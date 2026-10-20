import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface PresenciaUsuario {
  usuario_id: string;
  rol: 'docente' | 'estudiante' | 'administrador';
  nombre: string;
  seccion: string | null;
  dispositivo: string | null;
  ultima_actividad: string;
  conectado_desde: string;
}

/** Minutos sin actividad a partir de los cuales alguien deja de contar como "en línea". */
export const MINUTOS_EN_LINEA = 2;

/**
 * Quién está usando la app: cada usuario marca su actividad mientras tiene la app abierta
 * (registrar), y solo los administradores pueden leer la lista (listar, por RLS).
 */
@Injectable({ providedIn: 'root' })
export class PresenciaService {
  constructor(private supabaseService: SupabaseService) {}

  private get supabase() {
    return this.supabaseService.supabase;
  }

  async registrar(seccion: string) {
    const dispositivo = window.matchMedia('(pointer: coarse)').matches ? 'Celular' : 'Computador';
    await this.supabase.rpc('registrar_presencia', { p_seccion: seccion, p_dispositivo: dispositivo });
  }

  /** Actividad de las últimas 24 horas, la más reciente primero. */
  async listarRecientes(): Promise<PresenciaUsuario[]> {
    const desde = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { data, error } = await this.supabase
      .from('presencia_usuarios')
      .select('*')
      .gte('ultima_actividad', desde)
      .order('ultima_actividad', { ascending: false })
      .limit(300);
    if (error) throw error;
    return (data || []) as PresenciaUsuario[];
  }
}
