import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface LinkClaseDia {
  horario_id: string;
  fecha: string;
  link: string;
  publicado_en: string;
}

export interface IngresoClaseVirtual {
  horario_id: string;
  fecha: string;
  estudiante_id: string;
  asignatura_id: string;
  estado: 'presente' | 'tarde';
  ingreso_en: string;
}

export type ResultadoUnirse = 'marcado' | 'ya-marcado' | 'fuera-de-horario' | 'cancelada' | 'sin-link' | 'no-inscrito' | 'no-estudiante';

/** Las asignaturas Virtual/Híbrida (o cualquiera con link fijo) muestran las opciones de clase virtual. */
export function esAsignaturaVirtual(a: { modalidad?: string | null; link_clase?: string | null }): boolean {
  const m = (a.modalidad || '').toLowerCase();
  return m === 'virtual' || m === 'híbrida' || m === 'hibrida' || !!a.link_clase;
}

@Injectable({ providedIn: 'root' })
export class ClaseVirtualService {
  constructor(private supabaseService: SupabaseService) {}

  private get supabase() {
    return this.supabaseService.supabase;
  }

  /** Links "solo para hoy" publicados para esos horarios en una fecha. */
  async linksDelDia(horarioIds: string[], fecha: string): Promise<LinkClaseDia[]> {
    if (horarioIds.length === 0) return [];
    const { data, error } = await this.supabase.from('links_clase_dia').select('*').in('horario_id', horarioIds).eq('fecha', fecha);
    if (error) throw error;
    return (data || []) as LinkClaseDia[];
  }

  /** Publica el link de la clase de hoy y avisa a los estudiantes inscritos. */
  async publicarLinkHoy(horarioId: string, link: string) {
    const { error } = await this.supabase.rpc('publicar_link_clase', { p_horario_id: horarioId, p_link: link.trim() });
    if (error) throw error;
  }

  /** El estudiante se une: devuelve el link y, si está dentro del horario, registra su asistencia. */
  async unirse(horarioId: string): Promise<{ resultado: ResultadoUnirse; link?: string; estado?: 'presente' | 'tarde' }> {
    const { data, error } = await this.supabase.rpc('unirse_clase_virtual', { p_horario_id: horarioId });
    if (error) throw error;
    return data;
  }

  /** Ingresos de una clase (docente) o los propios (estudiante), según los permisos. */
  async ingresos(horarioIds: string[], fecha: string): Promise<IngresoClaseVirtual[]> {
    if (horarioIds.length === 0) return [];
    const { data, error } = await this.supabase
      .from('ingresos_clase_virtual')
      .select('*')
      .in('horario_id', horarioIds)
      .eq('fecha', fecha)
      .order('ingreso_en', { ascending: true });
    if (error) throw error;
    return (data || []) as IngresoClaseVirtual[];
  }
}
