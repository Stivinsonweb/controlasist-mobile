import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface ConfiguracionApp {
  id: string;
  app_activa: boolean;
  requiere_actualizacion: boolean;
  version_minima_requerida?: string | null;
  version_actual?: string | null;
  tipo_mensaje?: string | null;
  titulo_mensaje?: string | null;
  mensaje?: string | null;
  mostrar_mensaje: boolean;
  permitir_login: boolean;
  permitir_registro: boolean;
  permitir_tomar_asistencia: boolean;
  url_soporte?: string | null;
  url_documentacion?: string | null;
  actualizado_por?: string | null;
  /** Precio estándar de Premium (Parte 2), configurable por el admin. */
  premium_precio_mensual?: number | null;
  premium_precio_anual?: number | null;
  /** Cuenta/Nequi/banco a la que el docente debe transferir — texto libre, se muestra antes de subir el comprobante. */
  premium_info_pago?: string | null;
  /** Funcionalidad 5 — recordatorios de clase por push. */
  recordatorio_clase_minutos_antes?: number;
  vapid_public_key?: string | null;
  updated_at?: string;
}

/** `configuracion_app` es una tabla singleton: siempre hay una única fila con el estado global de la app. */
@Injectable({ providedIn: 'root' })
export class ConfiguracionAppService {
  constructor(private supabaseService: SupabaseService) {}

  private get supabase() {
    return this.supabaseService.supabase;
  }

  async obtener(): Promise<ConfiguracionApp | null> {
    const { data, error } = await this.supabase.from('configuracion_app').select('*').limit(1).maybeSingle();
    if (error) throw error;
    return data as ConfiguracionApp | null;
  }

  async actualizar(id: string, payload: Partial<ConfiguracionApp>) {
    const { data, error } = await this.supabase.from('configuracion_app').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data as ConfiguracionApp;
  }
}
