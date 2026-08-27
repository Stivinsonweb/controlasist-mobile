import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, Docente } from '../../../core/services/admin.service';
import { ConfiguracionAppService, ConfiguracionApp } from '../../../core/services/configuracion-app.service';
import { PremiumSuscripcionService, SolicitudPremium, PagoPremium, PeriodoPremium } from '../../../core/services/premium-suscripcion.service';
import { ToastService } from '../../../core/services/toast.service';
import { parsearPesosCOP, formatearPesosCOP } from '../../../shared/utils/moneda-cop.util';
import { MetodoPagoConfig, MetodoPagoTipo, METODOS_PAGO_CATALOGO, normalizarMetodosPago, catalogoMetodo } from '../../../shared/utils/metodos-pago.util';
import { MetodoPagoIconComponent } from '../../../shared/components/metodo-pago-icon/metodo-pago-icon.component';

type Tab = 'pendientes' | 'historial' | 'docentes' | 'precio';

@Component({
  selector: 'app-admin-premium',
  standalone: true,
  imports: [CommonModule, FormsModule, MetodoPagoIconComponent],
  templateUrl: './admin-premium.page.html',
})
export class AdminPremiumPage implements OnInit {
  loading = signal(true);
  tab = signal<Tab>('pendientes');
  tabs: Array<[Tab, string]> = [
    ['pendientes', 'Pendientes'],
    ['historial', 'Historial'],
    ['docentes', 'Docentes'],
    ['precio', 'Precio'],
  ];

  solicitudesPendientes = signal<SolicitudPremium[]>([]);
  pagosPendientes = signal<PagoPremium[]>([]);
  historialSolicitudes = signal<SolicitudPremium[]>([]);
  historialPagos = signal<PagoPremium[]>([]);
  docentes = signal<Docente[]>([]);
  config = signal<ConfiguracionApp | null>(null);

  filtroHistorial = signal('');
  historialCombinado = computed(() => {
    const filtro = this.filtroHistorial().toLowerCase().trim();
    const solicitudes = this.historialSolicitudes().map((s) => ({
      tipo: 'solicitud' as const,
      id: s.id,
      docente: s.docentes,
      estado: s.estado,
      detalle: 'Prueba gratis',
      nota_admin: s.nota_admin,
      fecha: s.fecha_revision || s.created_at,
    }));
    const pagos = this.historialPagos().map((p) => ({
      tipo: 'pago' as const,
      id: p.id,
      docente: p.docentes,
      estado: p.estado,
      detalle: `${p.monto} · ${p.periodo_confirmado_por_admin || p.periodo_declarado_por_docente}`,
      nota_admin: p.nota_admin,
      fecha: p.fecha_revision || p.created_at,
    }));
    return [...solicitudes, ...pagos]
      .filter((r) => !filtro || `${r.docente?.nombres} ${r.docente?.apellidos} ${r.docente?.email}`.toLowerCase().includes(filtro))
      .sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  });

  procesandoId = signal<string | null>(null);
  notaRechazo: Record<string, string> = {};
  periodoConfirmado: Record<string, PeriodoPremium> = {};
  precioPersonalizadoEdit: Record<string, string> = {};
  guardandoPrecioGlobal = signal(false);

  metodosPago = signal<MetodoPagoConfig[]>(normalizarMetodosPago(null));
  catalogoMetodosPago = METODOS_PAGO_CATALOGO;

  formatearPesos = formatearPesosCOP;

  labelMetodo(tipo: MetodoPagoTipo): string {
    return catalogoMetodo(tipo).label;
  }

  placeholderMetodo(tipo: MetodoPagoTipo): string {
    return catalogoMetodo(tipo).placeholder;
  }

  constructor(
    private adminService: AdminService,
    private configuracionAppService: ConfiguracionAppService,
    private premiumService: PremiumSuscripcionService,
    private toast: ToastService
  ) {}

  async ngOnInit() {
    await this.cargarTodo();
  }

  async cargarTodo() {
    this.loading.set(true);
    try {
      const [solicitudes, pagos, historialSol, historialPag, docentes, config] = await Promise.all([
        this.premiumService.solicitudesPendientes(),
        this.premiumService.pagosPendientes(),
        this.premiumService.historialSolicitudes(),
        this.premiumService.historialPagos(),
        this.adminService.listarDocentes(),
        this.configuracionAppService.obtener(),
      ]);
      this.solicitudesPendientes.set(solicitudes);
      this.pagosPendientes.set(pagos);
      this.historialSolicitudes.set(historialSol);
      this.historialPagos.set(historialPag);
      this.docentes.set(docentes);
      this.config.set(config);
      this.metodosPago.set(normalizarMetodosPago(config?.metodos_pago_premium));

      for (const p of pagos) this.periodoConfirmado[p.id] = p.periodo_declarado_por_docente;
    } catch (e) {
      console.error('Error cargando panel de Premium:', e);
      this.toast.error('No se pudo cargar el panel de Premium');
    } finally {
      this.loading.set(false);
    }
  }

  cambiarTab(t: Tab) {
    this.tab.set(t);
  }

  async verComprobante(p: PagoPremium) {
    const url = await this.premiumService.urlFirmadaComprobante(p.comprobante_url);
    if (!url) {
      this.toast.error('No se pudo generar el enlace del comprobante');
      return;
    }
    window.open(url, '_blank', 'noopener');
  }

  async aprobarSolicitud(s: SolicitudPremium) {
    this.procesandoId.set(s.id);
    try {
      await this.premiumService.aprobarSolicitud(s.id);
      this.toast.success('Prueba gratis aprobada');
      await this.cargarTodo();
    } catch (e: any) {
      this.toast.error(e.message || 'No se pudo aprobar la solicitud');
    } finally {
      this.procesandoId.set(null);
    }
  }

  async rechazarSolicitud(s: SolicitudPremium) {
    this.procesandoId.set(s.id);
    try {
      await this.premiumService.rechazarSolicitud(s.id, this.notaRechazo[s.id] || '');
      this.toast.success('Solicitud rechazada');
      await this.cargarTodo();
    } catch (e: any) {
      this.toast.error(e.message || 'No se pudo rechazar la solicitud');
    } finally {
      this.procesandoId.set(null);
    }
  }

  async aprobarPago(p: PagoPremium) {
    const periodo = this.periodoConfirmado[p.id] || p.periodo_declarado_por_docente;
    this.procesandoId.set(p.id);
    try {
      await this.premiumService.aprobarPago(p.id, periodo);
      this.toast.success('Pago aprobado — Premium extendido');
      await this.cargarTodo();
    } catch (e: any) {
      this.toast.error(e.message || 'No se pudo aprobar el pago');
    } finally {
      this.procesandoId.set(null);
    }
  }

  async rechazarPago(p: PagoPremium) {
    this.procesandoId.set(p.id);
    try {
      await this.premiumService.rechazarPago(p.id, this.notaRechazo[p.id] || '');
      this.toast.success('Pago rechazado');
      await this.cargarTodo();
    } catch (e: any) {
      this.toast.error(e.message || 'No se pudo rechazar el pago');
    } finally {
      this.procesandoId.set(null);
    }
  }

  async otorgarManual(d: Docente) {
    this.procesandoId.set(d.id);
    try {
      await this.premiumService.otorgarPremiumManual(d.id);
      this.toast.success(`Premium otorgado a ${d.nombres}`);
      await this.cargarTodo();
    } catch (e: any) {
      this.toast.error(e.message || 'No se pudo otorgar Premium');
    } finally {
      this.procesandoId.set(null);
    }
  }

  async revocarManual(d: Docente) {
    this.procesandoId.set(d.id);
    try {
      await this.premiumService.revocarPremiumManual(d.id);
      this.toast.success(`Premium revocado a ${d.nombres}`);
      await this.cargarTodo();
    } catch (e: any) {
      this.toast.error(e.message || 'No se pudo revocar Premium');
    } finally {
      this.procesandoId.set(null);
    }
  }

  toggleMetodoPago(tipo: MetodoPagoTipo) {
    this.metodosPago.update((lista) => lista.map((m) => (m.tipo === tipo ? { ...m, activo: !m.activo } : m)));
  }

  onDatoMetodoPagoChange(tipo: MetodoPagoTipo, dato: string) {
    this.metodosPago.update((lista) => lista.map((m) => (m.tipo === tipo ? { ...m, dato } : m)));
  }

  async guardarPrecioPersonalizado(d: Docente) {
    const raw = this.precioPersonalizadoEdit[d.id];
    const precio = raw === '' || raw === undefined ? null : parsearPesosCOP(raw);
    this.procesandoId.set(d.id);
    try {
      await this.premiumService.actualizarPrecioPersonalizado(d.id, precio);
      this.toast.success('Precio personalizado actualizado');
      await this.cargarTodo();
    } catch (e: any) {
      this.toast.error(e.message || 'No se pudo actualizar el precio');
    } finally {
      this.procesandoId.set(null);
    }
  }

  async guardarPrecioGlobal(mensual: string, anual: string, infoPago: string) {
    const cfg = this.config();
    if (!cfg) return;
    this.guardandoPrecioGlobal.set(true);
    try {
      const actualizado = await this.configuracionAppService.actualizar(cfg.id, {
        premium_precio_mensual: parsearPesosCOP(mensual),
        premium_precio_anual: parsearPesosCOP(anual),
        premium_info_pago: infoPago || null,
        metodos_pago_premium: this.metodosPago(),
      });
      this.config.set(actualizado);
      this.toast.success('Precio estándar actualizado');
    } catch (e: any) {
      this.toast.error(e.message || 'No se pudo actualizar el precio estándar');
    } finally {
      this.guardandoPrecioGlobal.set(false);
    }
  }
}
