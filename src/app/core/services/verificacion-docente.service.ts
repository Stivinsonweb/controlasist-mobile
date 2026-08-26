import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export type EstadoSolicitudVerificacion = 'pendiente' | 'aprobada' | 'rechazada';

export interface SolicitudVerificacion {
  id: string;
  docente_id: string;
  estado: EstadoSolicitudVerificacion;
  nota_admin?: string | null;
  revisado_por?: string | null;
  fecha_revision?: string | null;
  created_at: string;
  docentes?: { nombres: string; apellidos: string; email: string } | null;
}

/** Verificación de cuenta de docente: el docente la solicita, el admin la aprueba/rechaza sin pedirle información nueva. */
@Injectable({ providedIn: 'root' })
export class VerificacionDocenteService {
  constructor(private supabaseService: SupabaseService) {}

  private get supabase() {
    return this.supabaseService.supabase;
  }

  async solicitar(docenteId: string) {
    const { error } = await this.supabase.from('solicitudes_verificacion_docente').insert([{ docente_id: docenteId }]);
    if (error) throw error;
  }

  async misSolicitudes(docenteId: string) {
    const { data, error } = await this.supabase
      .from('solicitudes_verificacion_docente')
      .select('*')
      .eq('docente_id', docenteId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as SolicitudVerificacion[];
  }

  async pendientes() {
    const { data, error } = await this.supabase
      .from('solicitudes_verificacion_docente')
      .select('*, docentes(nombres, apellidos, email)')
      .eq('estado', 'pendiente')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []) as SolicitudVerificacion[];
  }

  async aprobar(solicitudId: string) {
    const { error } = await this.supabase.rpc('admin_aprobar_verificacion_docente', { p_solicitud_id: solicitudId });
    if (error) throw error;
  }

  async rechazar(solicitudId: string, nota: string) {
    const { error } = await this.supabase.rpc('admin_rechazar_verificacion_docente', { p_solicitud_id: solicitudId, p_nota: nota });
    if (error) throw error;
  }

  async revocar(docenteId: string) {
    const { error } = await this.supabase.rpc('admin_revocar_verificacion_docente', { p_docente_id: docenteId });
    if (error) throw error;
  }
}
