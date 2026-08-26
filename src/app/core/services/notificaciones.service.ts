import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface Notificacion {
  id: string;
  usuario_id: string;
  tipo: string;
  titulo: string;
  cuerpo: string;
  leida: boolean;
  created_at: string;
}

/**
 * Notificaciones in-app. Se insertan solo desde las funciones SECURITY DEFINER del flujo Premium
 * (Parte 2/3) — no hay policy de INSERT para el cliente. Esta misma tabla la reutilizará la
 * Funcionalidad 5 (notificaciones push) cuando se construya, en vez de crear una infraestructura
 * de notificaciones aparte.
 */
@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  constructor(private supabaseService: SupabaseService) {}

  private get supabase() {
    return this.supabaseService.supabase;
  }

  async misNotificaciones(limite = 20) {
    const { data, error } = await this.supabase
      .from('notificaciones')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limite);
    if (error) throw error;
    return (data || []) as Notificacion[];
  }

  async marcarLeida(id: string) {
    const { error } = await this.supabase.from('notificaciones').update({ leida: true }).eq('id', id);
    if (error) throw error;
  }

  async contarNoLeidas(): Promise<number> {
    const { count, error } = await this.supabase.from('notificaciones').select('id', { count: 'exact', head: true }).eq('leida', false);
    if (error) throw error;
    return count ?? 0;
  }
}
