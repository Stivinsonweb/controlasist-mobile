import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface Docente {
  id: string;
  user_id: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono?: string;
  entidad?: string;
  programa?: string;
  area?: string;
  foto_url?: string;
  /** Tema de acento elegido por el docente para su panel (ver shared/utils/subject-theme.util.ts ACCENT_PALETTES). */
  tema_acento?: string;
  /** Config del formato institucional de reportes (punto 6): logo y campos editables, reutilizados en todas sus asignaturas. */
  logo_institucional_url?: string;
  formato_reporte_codigo?: string;
  formato_reporte_version?: string;
  formato_reporte_titulo?: string;
  formato_reporte_segunda_firma?: string;
  created_at?: string;
}

export interface Administrador {
  id: string;
  user_id: string;
  email: string;
  nombres: string;
  apellidos: string;
  rol?: string;
  puede_cerrar_app?: boolean;
}

export interface Estudiante {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  cedula?: string;
  telefono?: string;
  tipo_documento?: string;
  programa?: string;
  ciudad?: string;
  direccion?: string;
  fecha_nacimiento?: string;
  observaciones?: string;
  activo?: boolean;
  foto_url?: string;
  created_at?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private supabaseService: SupabaseService) {}

  private get supabase() {
    return this.supabaseService.supabase;
  }

  async actualizarPerfilAdmin(id: string, payload: Pick<Administrador, 'nombres' | 'apellidos'>) {
    const { data, error } = await this.supabase.from('administradores').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data as Administrador;
  }

  async actualizarPerfilDocente(id: string, payload: Pick<Docente, 'nombres' | 'apellidos' | 'telefono' | 'programa' | 'area' | 'entidad'>) {
    const { data, error } = await this.supabase.from('docentes').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data as Docente;
  }

  async actualizarFotoDocente(id: string, foto_url: string) {
    const { data, error } = await this.supabase.from('docentes').update({ foto_url }).eq('id', id).select().single();
    if (error) throw error;
    return data as Docente;
  }

  async actualizarTemaDocente(id: string, tema_acento: string) {
    const { data, error } = await this.supabase.from('docentes').update({ tema_acento }).eq('id', id).select().single();
    if (error) throw error;
    return data as Docente;
  }

  async actualizarFormatoReporte(
    id: string,
    payload: Pick<Docente, 'formato_reporte_codigo' | 'formato_reporte_version' | 'formato_reporte_titulo' | 'formato_reporte_segunda_firma'>
  ) {
    const { data, error } = await this.supabase.from('docentes').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data as Docente;
  }

  async actualizarLogoInstitucional(id: string, logo_institucional_url: string) {
    const { data, error } = await this.supabase.from('docentes').update({ logo_institucional_url }).eq('id', id).select().single();
    if (error) throw error;
    return data as Docente;
  }

  /** `observaciones` es una nota global del estudiante, no específica de una asignatura. */
  async actualizarObservacionesEstudiante(estudianteId: string, observaciones: string) {
    const { data, error } = await this.supabase
      .from('estudiantes')
      .update({ observaciones: observaciones || null })
      .eq('id', estudianteId)
      .select()
      .single();
    if (error) throw error;
    return data as Estudiante;
  }

  async listarDocentes() {
    const { data, error } = await this.supabase.from('docentes').select('*').order('nombres', { ascending: true });
    if (error) throw error;
    return (data || []) as Docente[];
  }

  async listarEstudiantes() {
    const { data, error } = await this.supabase.from('estudiantes').select('*').order('nombres', { ascending: true });
    if (error) throw error;
    return (data || []) as Estudiante[];
  }

  async contarAsignaturasPorDocente(docenteId: string) {
    const { count, error } = await this.supabase
      .from('asignaturas')
      .select('id', { count: 'exact', head: true })
      .eq('docente_id', docenteId)
      .eq('activa', true);
    if (error) return 0;
    return count ?? 0;
  }

  async resumenGeneral() {
    const [{ count: docentes }, { count: estudiantes }, { count: administradores }, { count: asignaturas }] = await Promise.all([
      this.supabase.from('docentes').select('id', { count: 'exact', head: true }),
      this.supabase.from('estudiantes').select('id', { count: 'exact', head: true }),
      this.supabase.from('administradores').select('id', { count: 'exact', head: true }),
      this.supabase.from('asignaturas').select('id', { count: 'exact', head: true }).eq('activa', true),
    ]);

    return {
      docentes: docentes ?? 0,
      estudiantes: estudiantes ?? 0,
      administradores: administradores ?? 0,
      asignaturas: asignaturas ?? 0,
    };
  }

  async fechasRegistroDocentes() {
    const { data } = await this.supabase.from('docentes').select('created_at');
    return (data || []).map((d: any) => d.created_at as string);
  }

  async fechasRegistroEstudiantes() {
    const { data } = await this.supabase.from('estudiantes').select('created_at');
    return (data || []).map((d: any) => d.created_at as string);
  }

  async programasMasPoblados() {
    const { data, error } = await this.supabase.from('estudiantes').select('programa');
    if (error) throw error;
    const counts = new Map<string, number>();
    (data || []).forEach((row: any) => {
      const key = row.programa || 'Sin programa';
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([programa, total]) => ({ programa, total }))
      .sort((a, b) => b.total - a.total);
  }
}
