import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

const BUCKET_COMPROBANTES = 'comprobantes-pago';

export type EstadoSolicitud = 'pendiente' | 'aprobada' | 'rechazada';
export type EstadoPago = 'pendiente' | 'aprobado' | 'rechazado';
export type PeriodoPremium = 'mensual' | 'anual';

export interface SolicitudPremium {
  id: string;
  docente_id: string;
  estado: EstadoSolicitud;
  nota_admin?: string | null;
  revisado_por?: string | null;
  fecha_revision?: string | null;
  created_at: string;
  docentes?: { nombres: string; apellidos: string; email: string } | null;
}

export interface PagoPremium {
  id: string;
  docente_id: string;
  monto: number;
  fecha_pago_declarada: string;
  comprobante_url: string;
  estado: EstadoPago;
  periodo_declarado_por_docente: PeriodoPremium;
  periodo_confirmado_por_admin?: PeriodoPremium | null;
  nota_admin?: string | null;
  revisado_por?: string | null;
  fecha_revision?: string | null;
  created_at: string;
  docentes?: { nombres: string; apellidos: string; email: string } | null;
}

/** Flujo de activación de Premium por solicitud de prueba gratis + comprobante de pago manual (Parte 2), y otorgamiento manual del admin (Parte 3). */
@Injectable({ providedIn: 'root' })
export class PremiumSuscripcionService {
  constructor(private supabaseService: SupabaseService) {}

  private get supabase() {
    return this.supabaseService.supabase;
  }

  // ---------- Docente ----------

  async solicitarPruebaGratis(docenteId: string) {
    const { error } = await this.supabase.from('solicitudes_premium').insert([{ docente_id: docenteId }]);
    if (error) throw error;
  }

  async misSolicitudes(docenteId: string) {
    const { data, error } = await this.supabase
      .from('solicitudes_premium')
      .select('*')
      .eq('docente_id', docenteId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as SolicitudPremium[];
  }

  async misPagos(docenteId: string) {
    const { data, error } = await this.supabase
      .from('pagos_premium')
      .select('*')
      .eq('docente_id', docenteId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as PagoPremium[];
  }

  /** Sube el archivo del comprobante a Storage (bucket privado) y crea el registro pendiente en pagos_premium. */
  async subirComprobante(
    userId: string,
    docenteId: string,
    payload: { monto: number; fecha_pago_declarada: string; periodo_declarado_por_docente: PeriodoPremium; archivo: File }
  ) {
    const ext = payload.archivo.name.split('.').pop();
    const ruta = `${userId}/${Date.now()}.${ext}`;
    const { error: uploadError } = await this.supabase.storage
      .from(BUCKET_COMPROBANTES)
      .upload(ruta, payload.archivo, { cacheControl: '3600', upsert: false });
    if (uploadError) throw uploadError;

    const { error } = await this.supabase.from('pagos_premium').insert([
      {
        docente_id: docenteId,
        monto: payload.monto,
        fecha_pago_declarada: payload.fecha_pago_declarada,
        periodo_declarado_por_docente: payload.periodo_declarado_por_docente,
        comprobante_url: ruta,
      },
    ]);
    if (error) throw error;
  }

  /** Los comprobantes están en un bucket privado — se necesita una URL firmada para poder verlos. */
  async urlFirmadaComprobante(ruta: string): Promise<string | null> {
    const { data, error } = await this.supabase.storage.from(BUCKET_COMPROBANTES).createSignedUrl(ruta, 600);
    if (error) {
      console.error('Error generando URL firmada del comprobante:', error);
      return null;
    }
    return data?.signedUrl || null;
  }

  // ---------- Admin: colas ----------

  async solicitudesPendientes() {
    const { data, error } = await this.supabase
      .from('solicitudes_premium')
      .select('*, docentes(nombres, apellidos, email)')
      .eq('estado', 'pendiente')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []) as SolicitudPremium[];
  }

  async pagosPendientes() {
    const { data, error } = await this.supabase
      .from('pagos_premium')
      .select('*, docentes(nombres, apellidos, email)')
      .eq('estado', 'pendiente')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []) as PagoPremium[];
  }

  async historialSolicitudes() {
    const { data, error } = await this.supabase
      .from('solicitudes_premium')
      .select('*, docentes(nombres, apellidos, email)')
      .neq('estado', 'pendiente')
      .order('fecha_revision', { ascending: false });
    if (error) throw error;
    return (data || []) as SolicitudPremium[];
  }

  async historialPagos() {
    const { data, error } = await this.supabase
      .from('pagos_premium')
      .select('*, docentes(nombres, apellidos, email)')
      .neq('estado', 'pendiente')
      .order('fecha_revision', { ascending: false });
    if (error) throw error;
    return (data || []) as PagoPremium[];
  }

  // ---------- Admin: acciones (todas vía RPC SECURITY DEFINER) ----------

  async aprobarSolicitud(solicitudId: string) {
    const { error } = await this.supabase.rpc('admin_aprobar_solicitud_premium', { p_solicitud_id: solicitudId });
    if (error) throw error;
  }

  async rechazarSolicitud(solicitudId: string, nota: string) {
    const { error } = await this.supabase.rpc('admin_rechazar_solicitud_premium', { p_solicitud_id: solicitudId, p_nota: nota });
    if (error) throw error;
  }

  async aprobarPago(pagoId: string, periodo: PeriodoPremium) {
    const { error } = await this.supabase.rpc('admin_aprobar_pago_premium', { p_pago_id: pagoId, p_periodo: periodo });
    if (error) throw error;
  }

  async rechazarPago(pagoId: string, nota: string) {
    const { error } = await this.supabase.rpc('admin_rechazar_pago_premium', { p_pago_id: pagoId, p_nota: nota });
    if (error) throw error;
  }

  /** Parte 3: otorgar/revocar Premium manualmente (fuente 'admin'), independiente del flujo de solicitud/pago. */
  async otorgarPremiumManual(docenteId: string) {
    const { error } = await this.supabase.rpc('admin_otorgar_premium_manual', { p_docente_id: docenteId });
    if (error) throw error;
  }

  async revocarPremiumManual(docenteId: string) {
    const { error } = await this.supabase.rpc('admin_revocar_premium_manual', { p_docente_id: docenteId });
    if (error) throw error;
  }

  async actualizarPrecioPersonalizado(docenteId: string, precio: number | null) {
    const { error } = await this.supabase.rpc('admin_actualizar_precio_personalizado', { p_docente_id: docenteId, p_precio: precio });
    if (error) throw error;
  }
}
