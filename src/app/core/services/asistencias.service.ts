import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export type EstadoAsistencia = 'presente' | 'ausente' | 'tarde' | 'justificado';
export type TipoClase = 'teorica' | 'taller' | 'evaluacion' | 'laboratorio';

export interface Asistencia {
  id?: string;
  asignatura_id: string;
  docente_id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  facultad?: string | null;
  programa?: string | null;
  nivel?: string | null;
  codigo?: string | null;
  periodo?: string | null;
  cds?: string | null;
  temas_tratados?: string | null;
  observaciones?: string | null;
  tipo_clase?: TipoClase | null;
  created_at?: string;
  updated_at?: string;
}

export interface TipoClaseOpcion {
  valor: TipoClase;
  label: string;
}

export const TIPOS_CLASE: TipoClaseOpcion[] = [
  { valor: 'teorica', label: 'Teórica' },
  { valor: 'taller', label: 'Taller' },
  { valor: 'evaluacion', label: 'Evaluación' },
  { valor: 'laboratorio', label: 'Laboratorio' },
];

export interface RegistroAsistencia {
  id?: string;
  asistencia_id: string;
  estudiante_id: string;
  estado: EstadoAsistencia;
  observaciones?: string | null;
  created_at?: string;
  updated_at?: string;
}

/** Registro de asistencia del estudiante con la clase (fecha/tipo) embebida. */
export interface MiRegistroAsistencia {
  estado: EstadoAsistencia;
  observaciones: string | null;
  asistencias: {
    id: string;
    asignatura_id: string;
    fecha: string;
    hora_inicio: string;
    tipo_clase: TipoClase | null;
  };
}

export interface EstadoAsistenciaOpcion {
  valor: EstadoAsistencia;
  label: string;
  color: string;
  /** Ícono para el botón compacto de la lista de asistencia — la letra sola no basta para distinguir el estado de un vistazo. */
  icono: 'check' | 'clock' | 'flag' | 'x';
}

export const ESTADOS_ASISTENCIA: EstadoAsistenciaOpcion[] = [
  { valor: 'presente', label: 'Presente', color: '#10b981', icono: 'check' },
  { valor: 'tarde', label: 'Tarde', color: '#f59e0b', icono: 'clock' },
  { valor: 'justificado', label: 'Justificado', color: '#3b82f6', icono: 'flag' },
  { valor: 'ausente', label: 'Ausente', color: '#ef4444', icono: 'x' },
];

@Injectable({ providedIn: 'root' })
export class AsistenciasService {
  constructor(private supabaseService: SupabaseService) {}

  private get supabase() {
    return this.supabaseService.supabase;
  }

  /** Busca la clase dictada (asistencias) para una asignatura/fecha/horario específicos. */
  async obtenerAsistencia(asignaturaId: string, fecha: string, horaInicio: string, horaFin: string) {
    const { data, error } = await this.supabase
      .from('asistencias')
      .select('*')
      .eq('asignatura_id', asignaturaId)
      .eq('fecha', fecha)
      .eq('hora_inicio', horaInicio)
      .eq('hora_fin', horaFin)
      .maybeSingle();
    if (error) throw error;
    return data as Asistencia | null;
  }

  async crearAsistencia(payload: Asistencia) {
    const { data, error } = await this.supabase.from('asistencias').insert([payload]).select().single();
    if (error) throw error;
    return data as Asistencia;
  }

  async actualizarAsistencia(id: string, payload: Partial<Asistencia>) {
    const { data, error } = await this.supabase.from('asistencias').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data as Asistencia;
  }

  /** Devuelve la clase dictada existente para esa asignatura/fecha/horario, o la crea si no existe. */
  async obtenerOCrearAsistencia(payload: Asistencia) {
    const existente = await this.obtenerAsistencia(payload.asignatura_id, payload.fecha, payload.hora_inicio, payload.hora_fin);
    if (existente) return existente;
    return this.crearAsistencia(payload);
  }

  /** Historial de clases dictadas para una asignatura, más recientes primero. */
  async listarPorAsignatura(asignaturaId: string) {
    const { data, error } = await this.supabase
      .from('asistencias')
      .select('*')
      .eq('asignatura_id', asignaturaId)
      .order('fecha', { ascending: false })
      .order('hora_inicio', { ascending: false });
    if (error) throw error;
    return (data || []) as Asistencia[];
  }

  async listarRegistros(asistenciaId: string) {
    const { data, error } = await this.supabase.from('registros_asistencia').select('*').eq('asistencia_id', asistenciaId);
    if (error) throw error;
    return (data || []) as RegistroAsistencia[];
  }

  /** Upsert manual por estudiante: actualiza su registro si ya existe, si no lo crea. */
  async guardarRegistro(asistenciaId: string, estudianteId: string, estado: EstadoAsistencia, observaciones?: string | null) {
    const { data: existente, error: existenteError } = await this.supabase
      .from('registros_asistencia')
      .select('id')
      .eq('asistencia_id', asistenciaId)
      .eq('estudiante_id', estudianteId)
      .maybeSingle();
    if (existenteError) throw existenteError;

    if (existente) {
      const { error } = await this.supabase
        .from('registros_asistencia')
        .update({ estado, observaciones: observaciones || null })
        .eq('id', existente.id);
      if (error) throw error;
      return;
    }

    const { error } = await this.supabase
      .from('registros_asistencia')
      .insert([{ asistencia_id: asistenciaId, estudiante_id: estudianteId, estado, observaciones: observaciones || null }]);
    if (error) throw error;
  }

  /** Historial completo de asistencia del estudiante autenticado, con la clase embebida (fecha/tipo). */
  async misRegistros(estudianteId: string) {
    const { data, error } = await this.supabase
      .from('registros_asistencia')
      .select('estado, observaciones, asistencias!inner(id, asignatura_id, fecha, hora_inicio, tipo_clase)')
      .eq('estudiante_id', estudianteId);
    if (error) throw error;
    return (data || []) as unknown as MiRegistroAsistencia[];
  }
}
