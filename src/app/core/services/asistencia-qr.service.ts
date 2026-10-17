import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

/** Cada cuánto cambia el QR. Debe coincidir con la ventana de 20 s de marcar_asistencia_qr. */
export const QR_VENTANA_MS = 20_000;

export interface SesionQr {
  id: string;
  secreto: string;
  marcar_como: 'presente' | 'tarde';
  /** Diferencia (ms) entre el reloj del servidor y el del dispositivo, para que el token coincida. */
  desfaseMs: number;
}

export interface MarcaQr {
  estudiante_id: string;
  estado: 'presente' | 'tarde';
  marcado_en: string;
}

export type ResultadoMarcaQr = 'marcado' | 'ya-marcado' | 'vencido' | 'cerrada' | 'no-inscrito' | 'no-encontrada' | 'no-estudiante';

/**
 * Asistencia con QR: el docente proyecta un código que cambia cada 20 s y el estudiante lo
 * escanea. El token es HMAC-SHA256(secreto de la sesión, número de ventana) — el mismo cálculo
 * que hace token_qr() en la base, que es quien valida.
 */
@Injectable({ providedIn: 'root' })
export class AsistenciaQrService {
  constructor(private supabaseService: SupabaseService) {}

  private get supabase() {
    return this.supabaseService.supabase;
  }

  async iniciarSesion(asignaturaId: string, fecha: string, horaInicio: string, horaFin: string): Promise<SesionQr> {
    const { data, error } = await this.supabase.rpc('iniciar_sesion_qr', {
      p_asignatura_id: asignaturaId,
      p_fecha: fecha,
      p_hora_inicio: horaInicio,
      p_hora_fin: horaFin,
    });
    if (error) throw error;
    return { id: data.id, secreto: data.secreto, marcar_como: data.marcar_como, desfaseMs: Number(data.servidor_ms) - Date.now() };
  }

  async listarMarcas(sesionId: string): Promise<MarcaQr[]> {
    const { data, error } = await this.supabase
      .from('marcas_qr')
      .select('estudiante_id, estado, marcado_en')
      .eq('sesion_id', sesionId)
      .order('marcado_en', { ascending: true });
    if (error) throw error;
    return (data || []) as MarcaQr[];
  }

  async cambiarMarcarComo(sesionId: string, marcarComo: 'presente' | 'tarde') {
    const { error } = await this.supabase.from('sesiones_qr').update({ marcar_como: marcarComo }).eq('id', sesionId);
    if (error) throw error;
  }

  async cerrarSesion(sesionId: string) {
    const { error } = await this.supabase.from('sesiones_qr').update({ activa: false }).eq('id', sesionId);
    if (error) throw error;
  }

  async marcar(sesionId: string, token: string): Promise<{ resultado: ResultadoMarcaQr; asignatura?: string; estado?: string }> {
    const { data, error } = await this.supabase.rpc('marcar_asistencia_qr', { p_sesion_id: sesionId, p_token: token });
    if (error) throw error;
    return data;
  }

  /** Token de la ventana actual, con la hora corregida al reloj del servidor. */
  async tokenActual(sesion: SesionQr): Promise<{ token: string; restanteMs: number }> {
    const ahora = Date.now() + sesion.desfaseMs;
    const ventana = Math.floor(ahora / QR_VENTANA_MS);
    const enc = new TextEncoder();
    const clave = await crypto.subtle.importKey('raw', enc.encode(sesion.secreto), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const firma = new Uint8Array(await crypto.subtle.sign('HMAC', clave, enc.encode(String(ventana))));
    const token = Array.from(firma, (b) => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
    return { token, restanteMs: QR_VENTANA_MS - (ahora % QR_VENTANA_MS) };
  }

  /** URL que va dentro del QR: la cámara del celular la abre directo en la app. */
  urlMarcar(sesionId: string, token: string): string {
    return `${window.location.origin}/estudiante/marcar?s=${sesionId}&t=${token}`;
  }

  /** Extrae sesión y token de un QR leído desde la app (acepta la URL completa). */
  leerContenidoQr(texto: string): { s: string; t: string } | null {
    try {
      const url = new URL(texto);
      const s = url.searchParams.get('s');
      const t = url.searchParams.get('t');
      return s && t ? { s, t } : null;
    } catch {
      return null;
    }
  }
}
