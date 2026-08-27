import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Asistencia, EstadoAsistencia } from './asistencias.service';

export interface ResumenEstudiante {
  estudiante_id: string;
  nombres: string;
  apellidos: string;
  cedula?: string;
  presente: number;
  tarde: number;
  justificado: number;
  ausente: number;
  total: number;
  porcentajeAsistencia: number;
}

export interface ResumenGeneral {
  totalClases: number;
  presente: number;
  tarde: number;
  justificado: number;
  ausente: number;
  totalRegistros: number;
  porcentajeAsistencia: number;
}

export interface FilaMatrizEstudiante {
  estudiante_id: string;
  nombres: string;
  apellidos: string;
  cedula?: string;
  /** asistencia_id (id de la clase) -> estado del estudiante en esa clase. */
  estadosPorClase: Record<string, EstadoAsistencia>;
  porcentajeAsistencia: number;
}

@Injectable({ providedIn: 'root' })
export class ReportesService {
  constructor(private supabaseService: SupabaseService) {}

  private get supabase() {
    return this.supabaseService.supabase;
  }

  async listarClases(asignaturaId: string, anio?: number) {
    let query = this.supabase.from('asistencias').select('*').eq('asignatura_id', asignaturaId);
    if (anio) {
      query = query.gte('fecha', `${anio}-01-01`).lte('fecha', `${anio}-12-31`);
    }
    const { data, error } = await query.order('fecha', { ascending: false });
    if (error) throw error;
    return (data || []) as Asistencia[];
  }

  async aniosDisponibles(asignaturaId: string) {
    const { data, error } = await this.supabase.from('asistencias').select('fecha').eq('asignatura_id', asignaturaId);
    if (error) throw error;
    const anios = new Set((data || []).map((r: any) => new Date(r.fecha).getFullYear()));
    if (anios.size === 0) anios.add(new Date().getFullYear());
    return Array.from(anios).sort((a, b) => b - a);
  }

  private async registrosDeClases(asignaturaId: string, anio?: number) {
    const clases = await this.listarClases(asignaturaId, anio);
    const clasesIds = clases.map((c) => c.id).filter(Boolean) as string[];
    if (clasesIds.length === 0) return { clases, registros: [] as any[] };

    const { data, error } = await this.supabase
      .from('registros_asistencia')
      .select('asistencia_id, estudiante_id, estado, estudiantes ( id, nombres, apellidos, cedula )')
      .in('asistencia_id', clasesIds);
    if (error) throw error;
    return { clases, registros: (data || []) as any[] };
  }

  /** Estudiantes en filas, clases (fechas) en columnas — el formato de "lista de asistencia" clásico. */
  async matrizAsistencia(asignaturaId: string, anio?: number): Promise<{ clases: Asistencia[]; filas: FilaMatrizEstudiante[] }> {
    const { clases, registros } = await this.registrosDeClases(asignaturaId, anio);

    const mapa = new Map<string, FilaMatrizEstudiante>();
    for (const r of registros) {
      const est = r.estudiantes;
      if (!est) continue;
      if (!mapa.has(r.estudiante_id)) {
        mapa.set(r.estudiante_id, {
          estudiante_id: r.estudiante_id,
          nombres: est.nombres,
          apellidos: est.apellidos,
          cedula: est.cedula,
          estadosPorClase: {},
          porcentajeAsistencia: 0,
        });
      }
      mapa.get(r.estudiante_id)!.estadosPorClase[r.asistencia_id] = r.estado as EstadoAsistencia;
    }

    const filas = Array.from(mapa.values());
    for (const fila of filas) {
      const estados = Object.values(fila.estadosPorClase);
      const asistio = estados.filter((e) => e === 'presente' || e === 'tarde' || e === 'justificado').length;
      fila.porcentajeAsistencia = estados.length > 0 ? Math.round((asistio / estados.length) * 100) : 0;
    }

    const clasesOrdenadas = [...clases].sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora_inicio.localeCompare(b.hora_inicio));
    return { clases: clasesOrdenadas, filas: filas.sort((a, b) => a.apellidos.localeCompare(b.apellidos)) };
  }

  async resumenPorEstudiante(asignaturaId: string, anio?: number): Promise<ResumenEstudiante[]> {
    const { registros } = await this.registrosDeClases(asignaturaId, anio);

    const mapa = new Map<string, ResumenEstudiante>();
    for (const r of registros) {
      const est = r.estudiantes;
      if (!est) continue;
      if (!mapa.has(r.estudiante_id)) {
        mapa.set(r.estudiante_id, {
          estudiante_id: r.estudiante_id,
          nombres: est.nombres,
          apellidos: est.apellidos,
          cedula: est.cedula,
          presente: 0,
          tarde: 0,
          justificado: 0,
          ausente: 0,
          total: 0,
          porcentajeAsistencia: 0,
        });
      }
      const fila = mapa.get(r.estudiante_id)!;
      fila.total++;
      const estado = r.estado as EstadoAsistencia;
      if (estado === 'presente' || estado === 'tarde' || estado === 'justificado' || estado === 'ausente') {
        fila[estado]++;
      }
    }

    const filas = Array.from(mapa.values());
    for (const fila of filas) {
      const asistio = fila.presente + fila.tarde + fila.justificado;
      fila.porcentajeAsistencia = fila.total > 0 ? Math.round((asistio / fila.total) * 100) : 0;
    }
    return filas.sort((a, b) => a.apellidos.localeCompare(b.apellidos));
  }

  /** % de asistencia de cada clase dictada, en orden cronológico — para la gráfica de tendencia. */
  async porcentajePorClase(asignaturaId: string, anio?: number): Promise<{ fecha: string; porcentaje: number }[]> {
    const { clases, registros } = await this.registrosDeClases(asignaturaId, anio);

    const porClase = new Map<string, { asistio: number; total: number }>();
    for (const r of registros) {
      const acc = porClase.get(r.asistencia_id) || { asistio: 0, total: 0 };
      acc.total++;
      if (r.estado === 'presente' || r.estado === 'tarde' || r.estado === 'justificado') acc.asistio++;
      porClase.set(r.asistencia_id, acc);
    }

    return [...clases]
      .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora_inicio.localeCompare(b.hora_inicio))
      .map((c) => {
        const acc = porClase.get(c.id!);
        return { fecha: c.fecha, porcentaje: acc && acc.total > 0 ? Math.round((acc.asistio / acc.total) * 100) : 0 };
      });
  }

  async resumenGeneral(asignaturaId: string, anio?: number): Promise<ResumenGeneral> {
    const { clases, registros } = await this.registrosDeClases(asignaturaId, anio);

    const resumen: ResumenGeneral = {
      totalClases: clases.length,
      presente: 0,
      tarde: 0,
      justificado: 0,
      ausente: 0,
      totalRegistros: registros.length,
      porcentajeAsistencia: 0,
    };

    for (const r of registros) {
      const estado = r.estado as EstadoAsistencia;
      if (estado === 'presente' || estado === 'tarde' || estado === 'justificado' || estado === 'ausente') {
        resumen[estado]++;
      }
    }

    const asistio = resumen.presente + resumen.tarde + resumen.justificado;
    resumen.porcentajeAsistencia = resumen.totalRegistros > 0 ? Math.round((asistio / resumen.totalRegistros) * 100) : 0;
    return resumen;
  }
}
