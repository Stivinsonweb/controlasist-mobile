import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export type TipoActividad = 'tarea' | 'taller' | 'quiz' | 'lectura' | 'exposicion' | 'proyecto' | 'otro';

export const TIPOS_ACTIVIDAD: { valor: TipoActividad; label: string }[] = [
  { valor: 'tarea', label: 'Tarea' },
  { valor: 'taller', label: 'Taller' },
  { valor: 'quiz', label: 'Quiz' },
  { valor: 'lectura', label: 'Lectura' },
  { valor: 'exposicion', label: 'Exposición' },
  { valor: 'proyecto', label: 'Proyecto' },
  { valor: 'otro', label: 'Otro' },
];

export interface Actividad {
  id: string;
  asignatura_id: string;
  horario_id: string | null;
  fecha_clase: string | null;
  titulo: string;
  descripcion: string | null;
  tipo: TipoActividad;
  /** Tipo escrito por el docente cuando elige "Otro" (p. ej. "Laboratorio", "Foro"). */
  tipo_personalizado: string | null;
  fecha_entrega: string | null;
  permite_entregas: boolean;
  calificable: boolean;
  nota_maxima: number;
  enlace: string | null;
  archivo_path: string | null;
  archivo_nombre: string | null;
  created_at: string;
  updated_at: string;
}

export type ActividadPayload = Omit<Actividad, 'id' | 'created_at' | 'updated_at'>;

export interface EntregaActividad {
  id: string;
  actividad_id: string;
  estudiante_id: string;
  comentario: string | null;
  enlace: string | null;
  archivo_path: string | null;
  archivo_nombre: string | null;
  entregada_en: string;
  actualizada_en: string;
  nota: number | null;
  retroalimentacion: string | null;
  calificada_en: string | null;
}

const BUCKET = 'actividades';

/** Nombre de archivo seguro para Storage (sin tildes, espacios ni símbolos raros). */
function nombreSeguro(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9._-]+/g, '_')
    .slice(-80);
}

export function tipoActividadLabel(a: Pick<Actividad, 'tipo' | 'tipo_personalizado'>): string {
  if (a.tipo === 'otro' && a.tipo_personalizado?.trim()) return a.tipo_personalizado.trim();
  return TIPOS_ACTIVIDAD.find((t) => t.valor === a.tipo)?.label ?? a.tipo;
}

export function actividadVencida(a: Pick<Actividad, 'fecha_entrega'>): boolean {
  return !!a.fecha_entrega && new Date(a.fecha_entrega).getTime() < Date.now();
}

export function entregaTardia(a: Pick<Actividad, 'fecha_entrega'>, e: Pick<EntregaActividad, 'entregada_en'>): boolean {
  return !!a.fecha_entrega && new Date(e.entregada_en).getTime() > new Date(a.fecha_entrega).getTime();
}

@Injectable({ providedIn: 'root' })
export class ActividadesService {
  constructor(private supabaseService: SupabaseService) {}

  private get supabase() {
    return this.supabaseService.supabase;
  }

  private get storage() {
    return this.supabaseService.storage;
  }

  async listarPorAsignaturas(asignaturaIds: string[]): Promise<Actividad[]> {
    if (asignaturaIds.length === 0) return [];
    const { data, error } = await this.supabase
      .from('actividades')
      .select('*')
      .in('asignatura_id', asignaturaIds)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as Actividad[];
  }

  async obtener(id: string): Promise<Actividad> {
    const { data, error } = await this.supabase.from('actividades').select('*').eq('id', id).single();
    if (error) throw error;
    return data as Actividad;
  }

  /** Actividades ligadas a clases de una fecha (para "Mis clases de hoy"). */
  async listarDeClases(asignaturaIds: string[], fecha: string): Promise<Actividad[]> {
    if (asignaturaIds.length === 0) return [];
    const { data, error } = await this.supabase
      .from('actividades')
      .select('*')
      .in('asignatura_id', asignaturaIds)
      .eq('fecha_clase', fecha);
    if (error) throw error;
    return (data || []) as Actividad[];
  }

  async crear(payload: ActividadPayload, archivo: File | null): Promise<Actividad> {
    const { data, error } = await this.supabase.from('actividades').insert([{ ...payload, archivo_path: null, archivo_nombre: null }]).select().single();
    if (error) throw error;
    const actividad = data as Actividad;
    if (!archivo) return actividad;
    return this.adjuntarMaterial(actividad, archivo);
  }

  async actualizar(actividad: Actividad, payload: Partial<ActividadPayload>, archivo: File | null): Promise<Actividad> {
    const { data, error } = await this.supabase.from('actividades').update(payload).eq('id', actividad.id).select().single();
    if (error) throw error;
    const actualizada = data as Actividad;
    if (!archivo) return actualizada;
    return this.adjuntarMaterial(actualizada, archivo);
  }

  async quitarMaterial(actividad: Actividad): Promise<Actividad> {
    if (actividad.archivo_path) await this.storage.from(BUCKET).remove([actividad.archivo_path]);
    const { data, error } = await this.supabase
      .from('actividades')
      .update({ archivo_path: null, archivo_nombre: null })
      .eq('id', actividad.id)
      .select()
      .single();
    if (error) throw error;
    return data as Actividad;
  }

  private async adjuntarMaterial(actividad: Actividad, archivo: File): Promise<Actividad> {
    const ruta = `${actividad.asignatura_id}/material/${actividad.id}/${Date.now()}_${nombreSeguro(archivo.name)}`;
    const { error: upError } = await this.storage.from(BUCKET).upload(ruta, archivo, { upsert: true });
    if (upError) throw upError;
    if (actividad.archivo_path) await this.storage.from(BUCKET).remove([actividad.archivo_path]);
    const { data, error } = await this.supabase
      .from('actividades')
      .update({ archivo_path: ruta, archivo_nombre: archivo.name })
      .eq('id', actividad.id)
      .select()
      .single();
    if (error) throw error;
    return data as Actividad;
  }

  async eliminar(actividad: Actividad) {
    const { data: entregas } = await this.supabase.from('entregas_actividad').select('archivo_path').eq('actividad_id', actividad.id);
    const { error } = await this.supabase.from('actividades').delete().eq('id', actividad.id);
    if (error) throw error;
    const rutas = [actividad.archivo_path, ...(entregas || []).map((e: any) => e.archivo_path)].filter(Boolean) as string[];
    if (rutas.length > 0) await this.storage.from(BUCKET).remove(rutas).catch(() => null);
  }

  /** URL temporal (1 h) para abrir un archivo del bucket privado. */
  async urlArchivo(ruta: string): Promise<string> {
    const { data, error } = await this.storage.from(BUCKET).createSignedUrl(ruta, 3600);
    if (error) throw error;
    return data.signedUrl;
  }

  // ===== Entregas =====

  async entregasDeActividad(actividadId: string): Promise<EntregaActividad[]> {
    const { data, error } = await this.supabase.from('entregas_actividad').select('*').eq('actividad_id', actividadId);
    if (error) throw error;
    return (data || []) as EntregaActividad[];
  }

  async entregasDeActividades(actividadIds: string[]): Promise<EntregaActividad[]> {
    if (actividadIds.length === 0) return [];
    const { data, error } = await this.supabase.from('entregas_actividad').select('*').in('actividad_id', actividadIds);
    if (error) throw error;
    return (data || []) as EntregaActividad[];
  }

  async misEntregas(estudianteId: string): Promise<EntregaActividad[]> {
    const { data, error } = await this.supabase.from('entregas_actividad').select('*').eq('estudiante_id', estudianteId);
    if (error) throw error;
    return (data || []) as EntregaActividad[];
  }

  /** Crea o reemplaza la entrega del estudiante (solo mientras no esté calificada). */
  async entregar(
    actividad: Actividad,
    estudianteId: string,
    datos: { comentario: string; enlace: string },
    archivo: File | null,
    anterior: EntregaActividad | null
  ): Promise<EntregaActividad> {
    let archivo_path = anterior?.archivo_path ?? null;
    let archivo_nombre = anterior?.archivo_nombre ?? null;
    if (archivo) {
      const ruta = `${actividad.asignatura_id}/entregas/${actividad.id}/${estudianteId}/${Date.now()}_${nombreSeguro(archivo.name)}`;
      const { error: upError } = await this.storage.from(BUCKET).upload(ruta, archivo, { upsert: true });
      if (upError) throw upError;
      if (archivo_path) await this.storage.from(BUCKET).remove([archivo_path]).catch(() => null);
      archivo_path = ruta;
      archivo_nombre = archivo.name;
    }
    const fila = {
      actividad_id: actividad.id,
      estudiante_id: estudianteId,
      comentario: datos.comentario.trim() || null,
      enlace: datos.enlace.trim() || null,
      archivo_path,
      archivo_nombre,
    };
    const consulta = anterior
      ? this.supabase.from('entregas_actividad').update(fila).eq('id', anterior.id).select().single()
      : this.supabase.from('entregas_actividad').insert([fila]).select().single();
    const { data, error } = await consulta;
    if (error) throw error;
    return data as EntregaActividad;
  }

  /** Nota de un estudiante que no entregó por la app (p. ej. quiz presencial). */
  async registrarNota(actividadId: string, estudianteId: string, nota: number | null, retroalimentacion: string): Promise<EntregaActividad> {
    const { data, error } = await this.supabase
      .from('entregas_actividad')
      .insert([{ actividad_id: actividadId, estudiante_id: estudianteId, nota, retroalimentacion: retroalimentacion.trim() || null }])
      .select()
      .single();
    if (error) throw error;
    return data as EntregaActividad;
  }

  async calificar(entregaId: string, nota: number | null, retroalimentacion: string): Promise<EntregaActividad> {
    const { data, error } = await this.supabase
      .from('entregas_actividad')
      .update({ nota, retroalimentacion: retroalimentacion.trim() || null })
      .eq('id', entregaId)
      .select()
      .single();
    if (error) throw error;
    return data as EntregaActividad;
  }
}
