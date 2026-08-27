import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { SupabaseService } from '../../core/services/supabase.service';
import { AuthService } from '../../core/services/auth.service';
import { AdminService, Docente } from '../../core/services/admin.service';
import { ConfiguracionAppService } from '../../core/services/configuracion-app.service';
import { PremiumSuscripcionService, PagoPremium, SolicitudPremium, PeriodoPremium } from '../../core/services/premium-suscripcion.service';
import { NotificacionesService, Notificacion } from '../../core/services/notificaciones.service';
import { ToastService } from '../../core/services/toast.service';
import { parsearPesosCOP } from '../../shared/utils/moneda-cop.util';
import { MetodoPagoConfig, normalizarMetodosPago } from '../../shared/utils/metodos-pago.util';
import { MetodoPagoIconComponent } from '../../shared/components/metodo-pago-icon/metodo-pago-icon.component';
import {
  LogoPosicion,
  LogoTamano,
  PlantillaReporte,
  SECCIONES_REPORTE,
  SeccionReporteId,
  TipoTablaAsistencia,
  TamanoFuenteTabla,
  ColorTablaModo,
  TipoInstitucion,
  LABELS_INSTITUCION,
  defaultPlantillaReporte,
  normalizarPlantilla,
  seccionActiva,
} from '../../core/services/plantilla-reporte.model';

/** Datos de ejemplo para que la vista previa se vea "llena" sin depender de datos reales. */
const CLASES_EJEMPLO = [
  { fecha: '03/03/2026', hora: '08:00 - 10:00', tema: 'Introducción y presentación del curso' },
  { fecha: '10/03/2026', hora: '08:00 - 10:00', tema: 'Fundamentos teóricos — capítulo 1' },
  { fecha: '17/03/2026', hora: '08:00 - 10:00', tema: 'Taller práctico en grupos' },
];

/** Filas de ejemplo para la vista previa de "Matriz de estudiantes" y "Listado de estudiantes". */
const ESTUDIANTES_EJEMPLO = [
  { nombre: 'Ana Martínez', cedula: '1.020.345.678', estados: ['P', 'P', 'T'], porcentaje: 92 },
  { nombre: 'Carlos Ruiz', cedula: '1.098.234.512', estados: ['P', 'A', 'P'], porcentaje: 78 },
  { nombre: 'Laura Gómez', cedula: '1.045.678.901', estados: ['J', 'P', 'P'], porcentaje: 85 },
];

const LEYENDA_ESTADOS = 'P = Presente   T = Tarde   J = Justificado   A = Ausente';

@Component({
  selector: 'app-premium',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, MetodoPagoIconComponent],
  templateUrl: './premium.page.html',
})
export class PremiumPage implements OnInit, OnDestroy {
  loading = signal(true);
  private docenteId = '';
  private userId = '';

  // ---------- Estado de la suscripción (Parte 2/3) ----------
  perfil = signal<Docente | null>(null);
  premiumActivo = signal(false);
  precioMensual = signal<number | null>(null);
  precioAnual = signal<number | null>(null);
  infoPago = signal<string | null>(null);
  solicitudPendiente = signal<SolicitudPremium | null>(null);
  pagoPendiente = signal<PagoPremium | null>(null);
  historialPagos = signal<PagoPremium[]>([]);
  notificaciones = signal<Notificacion[]>([]);
  enviandoSolicitud = signal(false);

  mostrarFormularioPago = signal(false);
  subiendoComprobante = signal(false);
  formPago = { monto: '', fecha_pago_declarada: '', periodo_declarado_por_docente: 'mensual' as PeriodoPremium };
  metodosPago = signal<MetodoPagoConfig[]>([]);
  archivoComprobante: File | null = null;

  // ---------- Editor de plantilla (Parte 1) ----------
  logoUrl = signal<string | null>(null);
  titulo = signal('FORMATO PARA REGISTRO DE CLASES Y ASISTENCIA DOCENTE');
  segundaFirma = signal('');
  plantilla = signal<PlantillaReporte>(defaultPlantillaReporte());

  secciones = SECCIONES_REPORTE;
  clasesEjemplo = CLASES_EJEMPLO;
  estudiantesEjemplo = ESTUDIANTES_EJEMPLO;
  leyendaEstados = LEYENDA_ESTADOS;
  posicionesLogo: LogoPosicion[] = ['izquierda', 'centro', 'derecha'];
  tamanosLogo: LogoTamano[] = ['pequeno', 'mediano', 'grande'];
  tamanosFuente: TamanoFuenteTabla[] = ['compacta', 'normal', 'grande'];

  colorTablaActual(): string {
    const p = this.plantilla();
    return p.color_tabla_modo === 'personalizado' ? p.color_tabla_hex : 'var(--accent-from)';
  }

  tamanoFuentePreviewPx(): string {
    const t = this.plantilla().tamano_fuente;
    return t === 'compacta' ? '10px' : t === 'grande' ? '13px' : '11px';
  }

  guardando = signal(false);
  guardadoOk = signal(false);
  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService,
    private adminService: AdminService,
    private configuracionAppService: ConfiguracionAppService,
    private premiumService: PremiumSuscripcionService,
    private notificacionesService: NotificacionesService,
    private toast: ToastService
  ) {}

  async ngOnInit() {
    try {
      const user = await this.supabaseService.getCurrentUser();
      if (!user) return;
      this.userId = user.id;
      const perfil = await this.authService.resolveProfile(user.id);
      if (!perfil) throw new Error('No se encontró tu perfil de docente');

      this.docenteId = perfil.id;
      this.perfil.set(perfil as Docente);
      this.premiumActivo.set(!!(perfil as Docente).premium_activo);

      this.logoUrl.set(perfil.logo_institucional_url || null);
      this.titulo.set(perfil.formato_reporte_titulo || 'FORMATO PARA REGISTRO DE CLASES Y ASISTENCIA DOCENTE');
      this.segundaFirma.set(perfil.formato_reporte_segunda_firma || '');
      this.plantilla.set(normalizarPlantilla(perfil.plantilla_reporte));

      await Promise.all([this.cargarEstadoSuscripcion(), this.cargarNotificaciones()]);
    } catch (e: any) {
      console.error('Error cargando la página Premium:', e);
      this.toast.error('No se pudo cargar tu información de Premium');
    } finally {
      this.loading.set(false);
    }
  }

  ngOnDestroy() {
    if (this.saveTimer) clearTimeout(this.saveTimer);
  }

  private async cargarEstadoSuscripcion() {
    const [config, solicitudes, pagos] = await Promise.all([
      this.configuracionAppService.obtener().catch(() => null),
      this.premiumService.misSolicitudes(this.docenteId),
      this.premiumService.misPagos(this.docenteId),
    ]);

    const precioPersonalizado = this.perfil()?.premium_precio_personalizado;
    this.precioMensual.set(precioPersonalizado ?? config?.premium_precio_mensual ?? null);
    this.precioAnual.set(config?.premium_precio_anual ?? null);
    this.infoPago.set(config?.premium_info_pago || null);
    this.metodosPago.set(normalizarMetodosPago(config?.metodos_pago_premium).filter((m) => m.activo));

    this.solicitudPendiente.set(solicitudes.find((s) => s.estado === 'pendiente') || null);
    this.pagoPendiente.set(pagos.find((p) => p.estado === 'pendiente') || null);
    this.historialPagos.set(pagos.filter((p) => p.estado !== 'pendiente'));
  }

  private async cargarNotificaciones() {
    const lista = await this.notificacionesService.misNotificaciones(10).catch(() => []);
    this.notificaciones.set(lista);
  }

  async marcarNotificacionLeida(n: Notificacion) {
    if (n.leida) return;
    try {
      await this.notificacionesService.marcarLeida(n.id);
      this.notificaciones.update((lista) => lista.map((x) => (x.id === n.id ? { ...x, leida: true } : x)));
    } catch {
      // No es crítico si falla — no bloquea la lectura de la notificación en pantalla.
    }
  }

  get yaUsoPrueba(): boolean {
    return !!this.perfil()?.premium_prueba_utilizada;
  }

  async solicitarPruebaGratis() {
    this.enviandoSolicitud.set(true);
    try {
      await this.premiumService.solicitarPruebaGratis(this.docenteId);
      await this.authService.resolveProfile(this.userId);
      this.premiumActivo.set(true);
      this.toast.success('¡Premium activado! Ya puedes personalizar tu plantilla — tienes 30 días de prueba.');
      await this.cargarEstadoSuscripcion();
    } catch (e: any) {
      this.toast.error(e.message || 'No se pudo activar la prueba gratis');
    } finally {
      this.enviandoSolicitud.set(false);
    }
  }

  abrirFormularioPago() {
    this.mostrarFormularioPago.set(true);
  }

  cerrarFormularioPago() {
    this.mostrarFormularioPago.set(false);
    this.formPago = { monto: '', fecha_pago_declarada: '', periodo_declarado_por_docente: 'mensual' };
    this.archivoComprobante = null;
  }

  onArchivoComprobante(event: Event) {
    const input = event.target as HTMLInputElement;
    this.archivoComprobante = input.files?.[0] || null;
  }

  async enviarComprobante() {
    const monto = parsearPesosCOP(this.formPago.monto);
    if (!monto || !this.formPago.fecha_pago_declarada || !this.archivoComprobante) {
      this.toast.warning('Completa el monto, la fecha y adjunta el comprobante');
      return;
    }
    this.subiendoComprobante.set(true);
    try {
      await this.premiumService.subirComprobante(this.userId, this.docenteId, {
        monto,
        fecha_pago_declarada: this.formPago.fecha_pago_declarada,
        periodo_declarado_por_docente: this.formPago.periodo_declarado_por_docente,
        archivo: this.archivoComprobante,
      });
      this.toast.success('Comprobante enviado. Un administrador lo revisará pronto.');
      this.cerrarFormularioPago();
      await this.cargarEstadoSuscripcion();
    } catch (e: any) {
      this.toast.error(e.message || 'No se pudo subir el comprobante');
    } finally {
      this.subiendoComprobante.set(false);
    }
  }

  // ---------- Editor de plantilla (sin cambios de lógica, solo se muestra si premiumActivo) ----------

  esOpcional(id: SeccionReporteId): boolean {
    return this.secciones.find((s) => s.id === id)?.opcional ?? false;
  }

  labelSeccion(id: SeccionReporteId): string {
    return this.secciones.find((s) => s.id === id)?.label ?? id;
  }

  estaActiva(id: SeccionReporteId): boolean {
    return seccionActiva(this.plantilla(), id);
  }

  setLogoPosicion(pos: LogoPosicion) {
    this.plantilla.update((p) => ({ ...p, logo_posicion: pos }));
    this.programarGuardado();
  }

  setLogoTamano(t: LogoTamano) {
    this.plantilla.update((p) => ({ ...p, logo_tamano: t }));
    this.programarGuardado();
  }

  onTituloChange(v: string) {
    this.titulo.set(v);
    this.programarGuardado();
  }

  onSubtituloChange(v: string) {
    this.plantilla.update((p) => ({ ...p, subtitulo_formato: v }));
    this.programarGuardado();
  }

  onSegundaFirmaChange(v: string) {
    this.segundaFirma.set(v);
    this.programarGuardado();
  }

  onObservacionesChange(v: string) {
    this.plantilla.update((p) => ({ ...p, observaciones_texto: v }));
    this.programarGuardado();
  }

  toggleSeccion(id: SeccionReporteId) {
    if (!this.esOpcional(id)) return;
    this.plantilla.update((p) => {
      const activa = p.secciones_activas.includes(id);
      return { ...p, secciones_activas: activa ? p.secciones_activas.filter((s) => s !== id) : [...p.secciones_activas, id] };
    });
    this.programarGuardado();
  }

  labelsInstitucion() {
    return LABELS_INSTITUCION[this.plantilla().tipo_institucion];
  }

  setTipoInstitucion(tipo: TipoInstitucion) {
    this.plantilla.update((p) => ({ ...p, tipo_institucion: tipo }));
    this.programarGuardado();
  }

  setTipoTabla(tipo: TipoTablaAsistencia) {
    this.plantilla.update((p) => ({ ...p, tipo_tabla_asistencia: tipo }));
    this.programarGuardado();
  }

  toggleColumnaHistorial(col: 'tema' | 'horas' | 'firma') {
    this.plantilla.update((p) => ({ ...p, columnas_historial: { ...p.columnas_historial, [col]: !p.columnas_historial[col] } }));
    this.programarGuardado();
  }

  toggleColumnaMatriz(col: 'cedula' | 'porcentaje') {
    this.plantilla.update((p) => ({ ...p, columnas_matriz: { ...p.columnas_matriz, [col]: !p.columnas_matriz[col] } }));
    this.programarGuardado();
  }

  toggleLeyenda() {
    this.plantilla.update((p) => ({ ...p, mostrar_leyenda: !p.mostrar_leyenda }));
    this.programarGuardado();
  }

  setTamanoFuente(t: TamanoFuenteTabla) {
    this.plantilla.update((p) => ({ ...p, tamano_fuente: t }));
    this.programarGuardado();
  }

  setColorTablaModo(modo: ColorTablaModo) {
    this.plantilla.update((p) => ({ ...p, color_tabla_modo: modo }));
    this.programarGuardado();
  }

  onColorTablaHexChange(hex: string) {
    this.plantilla.update((p) => ({ ...p, color_tabla_hex: hex }));
    this.programarGuardado();
  }

  drop(event: CdkDragDrop<SeccionReporteId[]>) {
    if (event.previousIndex === event.currentIndex) return;
    this.plantilla.update((p) => {
      const orden = [...p.orden_secciones];
      moveItemInArray(orden, event.previousIndex, event.currentIndex);
      return { ...p, orden_secciones: orden };
    });
    this.programarGuardado();
  }

  private programarGuardado() {
    this.guardadoOk.set(false);
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.guardar(), 800);
  }

  private async guardar() {
    if (!this.docenteId) return;
    this.guardando.set(true);
    try {
      await this.adminService.actualizarPlantillaPremium(this.docenteId, {
        formato_reporte_titulo: this.titulo(),
        formato_reporte_segunda_firma: this.segundaFirma(),
        plantilla_reporte: { ...this.plantilla(), updated_at: new Date().toISOString() },
      });
      this.guardadoOk.set(true);
    } catch (e: any) {
      console.error('Error guardando la plantilla Premium:', e);
      this.toast.error('No se pudo guardar la plantilla');
    } finally {
      this.guardando.set(false);
    }
  }
}
