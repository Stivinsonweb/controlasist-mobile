import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Asignatura } from './asignaturas.service';
import { Estudiante } from './admin.service';

export interface DocenteResumen {
  id: string;
  nombres: string;
  apellidos: string;
  foto_url?: string;
}

export type AsignaturaConDocente = Asignatura & { docente: DocenteResumen | null };

export interface CompletarDatosPayload {
  tipo_documento: string;
  cedula: string;
  telefono: string;
  programa: string;
}

@Injectable({ providedIn: 'root' })
export class EstudiantesPortalService {
  constructor(private supabaseService: SupabaseService) {}

  private get supabase() {
    return this.supabaseService.supabase;
  }

  async obtenerPerfil(estudianteId: string) {
    const { data, error } = await this.supabase.from('estudiantes').select('*').eq('id', estudianteId).single();
    if (error) throw error;
    return data as Estudiante;
  }

  async actualizarPerfil(estudianteId: string, payload: Partial<Estudiante>) {
    const { data, error } = await this.supabase.from('estudiantes').update(payload).eq('id', estudianteId).select().single();
    if (error) throw error;
    return data as Estudiante;
  }

  /** Replica la lógica de la app original: dos consultas + merge en cliente, sin join anidado. */
  async misAsignaturas(estudianteId: string): Promise<AsignaturaConDocente[]> {
    const { data: inscripciones, error: inscripcionesError } = await this.supabase
      .from('estudiantes_asignaturas')
      .select('asignatura_id')
      .eq('estudiante_id', estudianteId)
      .eq('activo', true);
    if (inscripcionesError) throw inscripcionesError;

    const asignaturaIds = (inscripciones || []).map((i: any) => i.asignatura_id);
    if (asignaturaIds.length === 0) return [];

    const { data: asignaturas, error: asignaturasError } = await this.supabase
      .from('asignaturas')
      .select('*')
      .in('id', asignaturaIds);
    if (asignaturasError) throw asignaturasError;

    const docenteIds = [...new Set((asignaturas || []).map((a: any) => a.docente_id).filter(Boolean))];
    let docentes: DocenteResumen[] = [];
    if (docenteIds.length > 0) {
      const { data: docentesData, error: docentesError } = await this.supabase
        .from('docentes')
        .select('id, nombres, apellidos, foto_url')
        .in('id', docenteIds);
      if (docentesError) throw docentesError;
      docentes = (docentesData || []) as DocenteResumen[];
    }

    return (asignaturas || []).map((a: any) => ({
      ...a,
      docente: docentes.find((d) => d.id === a.docente_id) || null,
    })) as AsignaturaConDocente[];
  }

  async desinscribirse(estudianteId: string, asignaturaId: string) {
    const { error } = await this.supabase
      .from('estudiantes_asignaturas')
      .update({ activo: false })
      .eq('estudiante_id', estudianteId)
      .eq('asignatura_id', asignaturaId);
    if (error) throw error;
  }

  async buscarPorCodigoAcceso(codigo: string) {
    const codigoLimpio = codigo.trim().toUpperCase();
    const { data, error } = await this.supabase
      .from('asignaturas')
      .select('*')
      .eq('codigo_acceso', codigoLimpio)
      .eq('activa', true)
      .maybeSingle();
    if (error) throw error;
    if (!data) return { asignatura: null, expirado: false };

    const asignatura = data as Asignatura & { codigo_expira?: string | null };
    const expirado = !!asignatura.codigo_expira && new Date(asignatura.codigo_expira) < new Date();
    return { asignatura: asignatura as Asignatura, expirado };
  }

  verificarDatosCompletos(estudiante: Estudiante): boolean {
    return !!(estudiante.cedula && estudiante.telefono && estudiante.programa);
  }

  async completarDatos(estudianteId: string, payload: CompletarDatosPayload) {
    const { data: existente, error: existenteError } = await this.supabase
      .from('estudiantes')
      .select('id')
      .eq('cedula', payload.cedula)
      .neq('id', estudianteId)
      .maybeSingle();
    if (existenteError) throw existenteError;
    if (existente) throw new Error('Esta cédula ya está registrada por otro estudiante');

    const { data, error } = await this.supabase
      .from('estudiantes')
      .update(payload)
      .eq('id', estudianteId)
      .select()
      .single();
    if (error) throw error;
    return data as Estudiante;
  }

  /** Devuelve 'creada' | 'reactivada' | 'ya-inscrito' según el estado previo de la inscripción. */
  async crearInscripcion(estudianteId: string, asignaturaId: string): Promise<'creada' | 'reactivada' | 'ya-inscrito'> {
    const { data: existente, error: existenteError } = await this.supabase
      .from('estudiantes_asignaturas')
      .select('*')
      .eq('estudiante_id', estudianteId)
      .eq('asignatura_id', asignaturaId)
      .maybeSingle();
    if (existenteError) throw existenteError;

    if (existente) {
      if (existente.activo) return 'ya-inscrito';
      const { error } = await this.supabase
        .from('estudiantes_asignaturas')
        .update({ activo: true })
        .eq('estudiante_id', estudianteId)
        .eq('asignatura_id', asignaturaId);
      if (error) throw error;
      return 'reactivada';
    }

    const { error } = await this.supabase
      .from('estudiantes_asignaturas')
      .insert([{ estudiante_id: estudianteId, asignatura_id: asignaturaId, activo: true }]);
    if (error) {
      if (error.code === '23505') return 'ya-inscrito';
      throw error;
    }
    return 'creada';
  }
}
