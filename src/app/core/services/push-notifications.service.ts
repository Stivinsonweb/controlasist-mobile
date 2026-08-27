import { Injectable } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { SupabaseService } from './supabase.service';
import { ConfiguracionAppService } from './configuracion-app.service';

/**
 * Notificaciones push del navegador (Funcionalidad 5 — recordatorio de clases, y reutilizado por
 * la Parte 2 para avisos de Premium). Usa el soporte de push YA incluido en el Service Worker de
 * Angular (`SwPush`) en vez de escribir un Service Worker propio — evita tener dos SW compitiendo
 * por el mismo scope. `SwPush.isEnabled` solo es true en producción (con SW registrado) y en un
 * navegador compatible, por eso cada método revisa ese flag antes de tocar el navegador.
 */
@Injectable({ providedIn: 'root' })
export class PushNotificationsService {
  constructor(
    private swPush: SwPush,
    private supabaseService: SupabaseService,
    private configuracionAppService: ConfiguracionAppService
  ) {}

  private get supabase() {
    return this.supabaseService.supabase;
  }

  get soportado(): boolean {
    return this.swPush.isEnabled;
  }

  /** true si ya existe una suscripción activa en ESTE navegador/dispositivo. */
  async yaSuscrito(): Promise<boolean> {
    if (!this.soportado) return false;
    const registration = await navigator.serviceWorker.getRegistration();
    const sub = await registration?.pushManager.getSubscription();
    return !!sub;
  }

  /**
   * En iOS, Safari solo soporta push para una PWA "agregada a inicio" (Add to Home Screen) — desde
   * una pestaña normal del navegador, `requestSubscription` siempre falla con permiso denegado,
   * sin importar lo que el usuario elija. Detectarlo de antemano evita mostrar un error genérico.
   */
  private iosSinInstalar(): boolean {
    const esIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const instalada = (navigator as any).standalone === true || window.matchMedia('(display-mode: standalone)').matches;
    return esIOS && !instalada;
  }

  /** Pide permiso al navegador (si hace falta) y guarda la suscripción en Supabase. */
  async activar(usuarioId: string, rol: 'docente' | 'estudiante'): Promise<void> {
    if (!this.soportado) throw new Error('Este navegador no soporta notificaciones push, o la app no está instalada/en producción');

    if (this.iosSinInstalar()) {
      throw new Error('En iPhone/iPad, primero instala ControlAsist en tu pantalla de inicio (compartir → "Agregar a inicio") — Safari solo permite notificaciones desde la app instalada.');
    }

    if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
      throw new Error('Tienes las notificaciones bloqueadas para esta app en el navegador. Actívalas manualmente en Configuración → Notificaciones (o el ícono de candado junto a la dirección) y vuelve a intentar.');
    }

    const config = await this.configuracionAppService.obtener();
    if (!config?.vapid_public_key) throw new Error('El servidor aún no tiene configurada la llave pública VAPID');

    let subscription;
    try {
      subscription = await this.swPush.requestSubscription({ serverPublicKey: config.vapid_public_key });
    } catch (e: any) {
      if (e?.name === 'NotAllowedError' || /permission denied/i.test(e?.message || '')) {
        throw new Error('Bloqueaste el permiso de notificaciones. Actívalo manualmente en la configuración del navegador/app y vuelve a intentar.');
      }
      throw e;
    }

    const raw = subscription.toJSON();
    const p256dh = raw.keys?.['p256dh'];
    const authKey = raw.keys?.['auth'];
    if (!raw.endpoint || !p256dh || !authKey) throw new Error('Suscripción push inválida');

    const { error } = await this.supabase.from('push_subscriptions').upsert(
      [{ usuario_id: usuarioId, rol, endpoint: raw.endpoint, p256dh, auth_key: authKey }],
      { onConflict: 'usuario_id,endpoint' }
    );
    if (error) throw error;
  }

  /** Cancela la suscripción del navegador y borra el registro en Supabase. */
  async desactivar(usuarioId: string): Promise<void> {
    if (!this.soportado) return;
    const registration = await navigator.serviceWorker.getRegistration();
    const sub = await registration?.pushManager.getSubscription();
    const endpoint = sub?.endpoint;
    await this.swPush.unsubscribe().catch(() => {});
    if (endpoint) {
      await this.supabase.from('push_subscriptions').delete().eq('usuario_id', usuarioId).eq('endpoint', endpoint);
    }
  }
}
