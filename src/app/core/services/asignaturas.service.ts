import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface Asignatura {
  id: string;
  nombre: string;
  codigo: string;
  grupo: string;
  facultad?: string;
  programa?: string;
  nivel: string;
  periodo: string;
  cds?: string;
  creditos: number;
  modalidad: string;
  aula?: string;
  color: string;
  icono?: string;
  activa: boolean;
  docente_id: string;
  codigo_acceso?: string;
  codigo_expira?: string | null;
  created_at?: string;
}

const CODIGO_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generarCodigoAleatorio(): string {
  let codigo = '';
  for (let i = 0; i < 8; i++) {
    codigo += CODIGO_CHARS.charAt(Math.floor(Math.random() * CODIGO_CHARS.length));
    if (i === 3) codigo += '-';
  }
  return codigo;
}

export interface Horario {
  id?: string;
  asignatura_id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  aula?: string;
  activo?: boolean;
  fecha_clase?: string | null;
  estado?: string;
  fecha_ultima_actualizacion?: string;
}

export const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

@Injectable({ providedIn: 'root' })
export class AsignaturasService {
  constructor(private supabaseService: SupabaseService) {}

  private get supabase() {
    return this.supabaseService.supabase;
  }

  async getDocenteByUserId(userId: string) {
    const { data, error } = await this.supabase.from('docentes').select('*').eq('user_id', userId).single();
    if (error) throw error;
    return data;
  }

  /** Trae todas las asignaturas del docente (activas y archivadas) para que el home pueda filtrar por periodo real. */
  async listarPorDocente(docenteId: string) {
    const { data, error } = await this.supabase
      .from('asignaturas')
      .select('*')
      .eq('docente_id', docenteId)
      .order('periodo', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as Asignatura[];
  }

  async obtenerPorId(id: string) {
    const { data, error } = await this.supabase.from('asignaturas').select('*').eq('id', id).single();
    if (error) throw error;
    return data as Asignatura;
  }

  async crear(payload: Partial<Asignatura>) {
    const { data, error } = await this.supabase.from('asignaturas').insert([payload]).select().single();
    if (error) throw error;
    return data as Asignatura;
  }

  async actualizar(id: string, payload: Partial<Asignatura>) {
    const { data, error } = await this.supabase.from('asignaturas').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data as Asignatura;
  }

  async desactivar(id: string) {
    const { error } = await this.supabase.from('asignaturas').update({ activa: false }).eq('id', id);
    if (error) throw error;
  }

  async listarHorarios(asignaturaId: string) {
    const { data, error } = await this.supabase
      .from('horarios')
      .select('*')
      .eq('asignatura_id', asignaturaId)
      .eq('activo', true)
      .order('dia_semana', { ascending: true })
      .order('hora_inicio', { ascending: true });
    if (error) throw error;
    return (data || []) as Horario[];
  }

  async agregarHorario(payload: Horario) {
    const { data, error } = await this.supabase.from('horarios').insert([payload]).select().single();
    if (error) throw error;
    return data as Horario;
  }

  async agregarHorariosMultiples(payloads: Horario[]) {
    const { data, error } = await this.supabase.from('horarios').insert(payloads).select();
    if (error) throw error;
    return (data || []) as Horario[];
  }

  async desactivarHorario(id: string) {
    const { error } = await this.supabase.from('horarios').update({ activo: false }).eq('id', id);
    if (error) throw error;
  }

  async actualizarEstadoHorario(horarioId: string, estado: string) {
    const fechaHoy = new Date().toISOString().split('T')[0];
    const { data, error } = await this.supabase
      .from('horarios')
      .update({ estado, fecha_ultima_actualizacion: fechaHoy })
      .eq('id', horarioId)
      .select()
      .single();
    if (error) throw error;
    return data as Horario;
  }

  async contarEstudiantesInscritos(asignaturaId: string) {
    const { count, error } = await this.supabase
      .from('estudiantes_asignaturas')
      .select('estudiante_id', { count: 'exact', head: true })
      .eq('asignatura_id', asignaturaId)
      .eq('activo', true);
    if (error) throw error;
    return count ?? 0;
  }

  /** Genera un código nuevo con reintentos ante colisión (la app original no verificaba unicidad). */
  async regenerarCodigoAcceso(id: string) {
    for (let intento = 0; intento < 5; intento++) {
      const nuevoCodigo = generarCodigoAleatorio();
      const { data: existente, error: existenteError } = await this.supabase
        .from('asignaturas')
        .select('id')
        .eq('codigo_acceso', nuevoCodigo)
        .maybeSingle();
      if (existenteError) throw existenteError;
      if (existente) continue;

      const { data, error } = await this.supabase
        .from('asignaturas')
        .update({ codigo_acceso: nuevoCodigo, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Asignatura;
    }
    throw new Error('No se pudo generar un código único, intenta de nuevo');
  }

  async actualizarExpiracionCodigo(id: string, fecha: string | null) {
    const { data, error } = await this.supabase
      .from('asignaturas')
      .update({ codigo_expira: fecha, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Asignatura;
  }

  async listarEstudiantesInscritos(asignaturaId: string) {
    const { data, error } = await this.supabase
      .from('estudiantes_asignaturas')
      .select(`estudiante_id, estudiantes ( id, nombres, apellidos, cedula, email, telefono, foto_url, observaciones )`)
      .eq('asignatura_id', asignaturaId)
      .eq('activo', true);
    if (error) throw error;
    return data || [];
  }

  /**
   * Matricula estudiantes en lote desde una plantilla Excel/CSV. Delega en la Edge Function
   * `matricular-estudiantes-masivo` porque crear la cuenta de Auth de cada estudiante (con la
   * contraseña que trae el archivo) requiere la service_role key, que nunca debe tocar el
   * front-end — ver supabase/functions/matricular-estudiantes-masivo/index.ts. La función reenvía
   * el JWT del docente logueado automáticamente, así que del lado del server se puede verificar
   * que quien llama es el dueño real de la asignatura.
   */
  async matricularEstudiantesMasivo(asignaturaId: string, filas: FilaCargaMasiva[]): Promise<ResultadoFilaCarga[]> {
    const { data, error } = await this.supabaseService.client.functions.invoke('matricular-estudiantes-masivo', {
      body: { asignaturaId, filas },
    });
    if (error) throw error;
    return (data?.resultados || []) as ResultadoFilaCarga[];
  }
}

export interface FilaCargaMasiva {
  nombres: string;
  apellidos: string;
  cedula: string;
  email: string;
  password: string;
  telefono?: string;
  programa?: string;
  tipo_documento?: string;
}

export interface ResultadoFilaCarga {
  fila: number;
  cedula: string;
  nombres: string;
  resultado: 'matriculado' | 'reactivado' | 'ya-matriculado' | 'error';
  detalle?: string;
}
