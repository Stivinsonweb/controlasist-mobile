import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { SupabaseService } from '../../core/services/supabase.service';
import { AuthService } from '../../core/services/auth.service';
import { AdminService, Docente } from '../../core/services/admin.service';
import { ConfiguracionAppService } from '../../core/services/configuracion-app.service';
import { PremiumSuscripcionService, PagoPremium, SolicitudPremium, PeriodoPremium, referenciaPagoDocente } from '../../core/services/premium-suscripcion.service';
import { NotificacionesService, Notificacion } from '../../core/services/notificaciones.service';
import { ToastService } from '../../core/services/toast.service';
import { AsignaturasService, Asignatura } from '../../core/services/asignaturas.service';
import { formatearPesosCOP, parsearPesosCOP, validarPrecioCOP } from '../../shared/utils/moneda-cop.util';
import { MetodoPagoConfig, MetodoPagoTipo, catalogoMetodo, normalizarMetodosPago } from '../../shared/utils/metodos-pago.util';
import { MetodoPagoIconComponent } from '../../shared/components/metodo-pago-icon/metodo-pago-icon.component';
import {
  LogoPosicion,
  LogoTamano,
  PlantillaReporte,
  PlantillaAsignatura,
  SECCIONES_REPORTE,
  SeccionReporteId,
  TipoTablaAsistencia,
  TamanoFuenteTabla,
  TipoInstitucion,
  LABELS_INSTITUCION,
  ESTILOS_DISENO,
  EstiloDiseno,
  PLANTILLAS_CATALOGO,
  PlantillaCatalogo,
  aplicarPlantillaCatalogo,
  plantillaDelCatalogo,
  defaultPlantillaReporte,
  normalizarPlantilla,
  seccionActiva,
} from '../../core/services/plantilla-reporte.model';
import { fechaLocalISO } from '../../shared/utils/fecha.util';

/** Datos de ejemplo para que la vista previa se vea "llena" sin depender de datos reales. */
const CLASES_EJEMPLO = [
  { fecha: '03/03/2026', hora: '08:00 - 10:00', tema: 'Introducción y presentación del curso' },
  { fecha: '10/03/2026', hora: '08:00 - 10:00', tema: 'Fundamentos teóricos — capítulo 1' },
  { fecha: '17/03/2026', hora: '08:00 - 10:00', tema: 'Taller práctico en grupos' },
];

/** Filas de ejemplo para la vista previa de "Matriz de estudiantes" y "Listado de estudiantes". */
const ESTUDIANTES_EJEMPLO = [
  { nombre: 'Ana Martínez', cedula: '1020345678', estados: ['P', 'P', 'T'], porcentaje: 92 },
  { nombre: 'Carlos Ruiz', cedula: '1098234512', estados: ['P', 'A', 'P'], porcentaje: 78 },
  { nombre: 'Laura Gómez', cedula: '1045678901', estados: ['J', 'P', 'P'], porcentaje: 85 },
];

const LEYENDA_ESTADOS = 'P = Presente   T = Tarde   J = Justificado   A = Ausente';

const TITULO_FORMATO_DEFAULT = 'FORMATO PARA REGISTRO DE CLASES Y ASISTENCIA DOCENTE';

/** Solo estas notificaciones se muestran aquí — los recordatorios de clase viven en la campana. */
const TIPOS_NOTIFICACION_PREMIUM = [
  'premium_solicitud_aprobada',
  'premium_solicitud_rechazada',
  'premium_pago_aprobado',
  'premium_pago_rechazado',
  'premium_por_vencer',
  'premium_vencido',
  'premium_otorgado',
];

type VistaPlantilla = 'gratis' | 'premium';

@Component({
  selector: 'app-premium',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, MetodoPagoIconComponent],
  templateUrl: './premium.page.html',
})
export class PremiumPage implements OnInit {
  loading = signal(true);
  private docenteId = '';
  private userId = '';

  // ---------- Estado de la suscripción (Parte 2/3) ----------
  perfil = signal<Docente | null>(null);
  premiumActivo = signal(false);
  precioMensual = signal<number | null>(null);
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
  qrAbierto = signal<MetodoPagoTipo | null>(null);

  // ---------- Slider Plantilla gratis / Plantilla Premium ----------
  vista = signal<VistaPlantilla>('gratis');
  plantillasGratis = PLANTILLAS_CATALOGO.filter((c) => c.nivel === 'gratis');
  catalogo = PLANTILLAS_CATALOGO;
  /** Config de cada plantilla del catálogo para pintar su miniatura (se calcula una sola vez). */
  miniaturas: Record<string, PlantillaReporte> = {};
  seleccionGratis = signal<string>(this.plantillasGratis[0].id);

  // ---------- Editor de plantilla (Parte 1) ----------
  logoUrl = signal<string | null>(null);
  titulo = signal(TITULO_FORMATO_DEFAULT);
  segundaFirma = signal('');
  plantilla = signal<PlantillaReporte>(defaultPlantillaReporte());
  mostrarConfig = signal(false);

  // ---------- Plantilla general o propia de una asignatura ----------
  asignaturas = signal<Asignatura[]>([]);
  /** 'general' = plantilla del docente para todas las asignaturas; si no, el id de la asignatura que se edita. */
  destino = signal<string>('general');
  /** Plantilla general guardada: punto de partida de las asignaturas que aún no tienen una propia. */
  private general = signal<{ titulo: string; segundaFirma: string; plantilla: PlantillaReporte } | null>(null);
  asignaturaDestino = computed(() => this.asignaturas().find((a) => a.id === this.destino()) ?? null);
  /** La asignatura elegida ya tiene plantilla propia guardada (si no, sus reportes usan la general). */
  destinoTienePropia = computed(() => !!this.asignaturaDestino()?.plantilla_reporte);

  /** Lo último guardado en la base — sirve para saber si hay cambios sin guardar y cuál está en uso. */
  private guardado = signal<{ titulo: string; segundaFirma: string; plantilla: PlantillaReporte } | null>(null);
  plantillaEnUsoId = computed(() => this.guardado()?.plantilla.plantilla_id ?? null);
  hayCambios = computed(() => {
    const g = this.guardado();
    if (!g) return true;
    return (
      g.titulo !== this.titulo() ||
      g.segundaFirma !== this.segundaFirma() ||
      JSON.stringify({ ...g.plantilla, updated_at: '' }) !== JSON.stringify({ ...this.plantilla(), updated_at: '' })
    );
  });

  vistaPreviaGratis = computed(() => {
    const c = plantillaDelCatalogo(this.seleccionGratis())!;
    return aplicarPlantillaCatalogo(this.plantilla(), c);
  });

  secciones = SECCIONES_REPORTE;
  clasesEjemplo = CLASES_EJEMPLO;
  estudiantesEjemplo = ESTUDIANTES_EJEMPLO;
  leyendaEstados = LEYENDA_ESTADOS;
  posicionesLogo: LogoPosicion[] = ['izquierda', 'centro', 'derecha'];
  tamanosLogo: LogoTamano[] = ['pequeno', 'mediano', 'grande'];
  tamanosFuente: TamanoFuenteTabla[] = ['compacta', 'normal', 'grande'];

  // La vista previa se reutiliza para la plantilla gratis, la Premium y las miniaturas, por eso reciben la plantilla.
  estilo(p: PlantillaReporte): EstiloDiseno {
    return ESTILOS_DISENO[p.diseno] ?? ESTILOS_DISENO.institucional;
  }

  tituloSugerido(p: PlantillaReporte): string {
    return LABELS_INSTITUCION[p.tipo_institucion].tituloSugerido;
  }

  /** Título que muestra la vista previa: el del docente, o el sugerido del tipo de institución si no lo ha cambiado. */
  tituloVista(p: PlantillaReporte): string {
    const sugeridos = Object.values(LABELS_INSTITUCION).map((l) => l.tituloSugerido);
    return !this.titulo() || sugeridos.includes(this.titulo()) ? this.tituloSugerido(p) : this.titulo();
  }

  labelPlantillaActual(): string {
    return plantillaDelCatalogo(this.plantilla().plantilla_id)?.nombre ?? 'Plantilla personalizada';
  }

  claseLogo(p: PlantillaReporte): string {
    return p.logo_tamano === 'pequeno' ? 'h-10 w-10' : p.logo_tamano === 'grande' ? 'h-20 w-20' : 'h-14 w-14';
  }

  claseTh(p: PlantillaReporte): string {
    const e = this.estilo(p);
    const fondo =
      e.cabeceraTabla === 'negro' ? 'bg-neutral-900 text-white' : e.cabeceraTabla === 'gris' ? 'bg-neutral-200 text-neutral-900' : 'border-b-2 border-neutral-900 text-neutral-900';
    return `px-2 py-1.5 font-semibold ${fondo} ${e.bordes === 'rejilla' ? 'border border-neutral-900' : ''}`;
  }

  claseTd(p: PlantillaReporte): string {
    return `px-2 py-1.5 text-neutral-800 ${this.estilo(p).bordes === 'rejilla' ? 'border border-neutral-900' : 'border-b border-neutral-200'}`;
  }

  tamanoFuentePx(p: PlantillaReporte): string {
    const t = p.tamano_fuente;
    return t === 'compacta' ? '10px' : t === 'grande' ? '13px' : '11px';
  }

  seccionVisible(p: PlantillaReporte, id: SeccionReporteId): boolean {
    return seccionActiva(p, id);
  }

  labelsDe(p: PlantillaReporte) {
    return LABELS_INSTITUCION[p.tipo_institucion];
  }

  cambiarVista(v: VistaPlantilla) {
    this.vista.set(v);
  }

  guardando = signal(false);

  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService,
    private adminService: AdminService,
    private configuracionAppService: ConfiguracionAppService,
    private premiumService: PremiumSuscripcionService,
    private notificacionesService: NotificacionesService,
    private asignaturasService: AsignaturasService,
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
      if (this.premiumActivo()) this.vista.set('premium');

      this.logoUrl.set(perfil.logo_institucional_url || null);
      const general = {
        titulo: perfil.formato_reporte_titulo || TITULO_FORMATO_DEFAULT,
        segundaFirma: perfil.formato_reporte_segunda_firma || '',
        plantilla: normalizarPlantilla(perfil.plantilla_reporte),
      };
      this.general.set(perfil.plantilla_reporte ? general : null);
      this.cargarEnEditor(general, this.general());
      this.asignaturas.set(await this.asignaturasService.listarPorDocente(perfil.id).catch(() => []));
      for (const c of this.catalogo) this.miniaturas[c.id] = aplicarPlantillaCatalogo(defaultPlantillaReporte(), c);

      await Promise.all([this.cargarEstadoSuscripcion(), this.cargarNotificaciones()]);
    } catch (e: any) {
      console.error('Error cargando la página Premium:', e);
      this.toast.error('No se pudo cargar tu información de Premium');
    } finally {
      this.loading.set(false);
    }
  }

  private async cargarEstadoSuscripcion() {
    const [config, solicitudes, pagos] = await Promise.all([
      this.configuracionAppService.obtener().catch(() => null),
      this.premiumService.misSolicitudes(this.docenteId),
      this.premiumService.misPagos(this.docenteId),
    ]);

    const precioPersonalizado = this.perfil()?.premium_precio_personalizado;
    this.precioMensual.set(precioPersonalizado ?? config?.premium_precio_mensual ?? null);
    this.infoPago.set(config?.premium_info_pago || null);
    this.metodosPago.set(normalizarMetodosPago(config?.metodos_pago_premium).filter((m) => m.activo));

    this.solicitudPendiente.set(solicitudes.find((s) => s.estado === 'pendiente') || null);
    this.pagoPendiente.set(pagos.find((p) => p.estado === 'pendiente') || null);
    this.historialPagos.set(pagos.filter((p) => p.estado !== 'pendiente'));
  }

  private async cargarNotificaciones() {
    const lista = await this.notificacionesService.misNotificaciones(50).catch(() => []);
    this.notificaciones.set(lista.filter((n) => TIPOS_NOTIFICACION_PREMIUM.includes(n.tipo) && !n.leida).slice(0, 3));
  }

  async marcarNotificacionLeida(n: Notificacion) {
    if (n.leida) return;
    try {
      await this.notificacionesService.marcarLeida(n.id);
      this.notificaciones.update((lista) => lista.filter((x) => x.id !== n.id));
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
      this.vista.set('premium');
      this.toast.success('¡Premium activado! Ya puedes personalizar tu plantilla — tienes 30 días de prueba.');
      await this.cargarEstadoSuscripcion();
    } catch (e: any) {
      this.toast.error(e.message || 'No se pudo activar la prueba gratis');
    } finally {
      this.enviandoSolicitud.set(false);
    }
  }

  get referencia(): string {
    return this.docenteId ? referenciaPagoDocente(this.docenteId) : '';
  }

  labelMetodo(tipo: MetodoPagoTipo): string {
    return catalogoMetodo(tipo).label;
  }

  abrirFormularioPago() {
    this.formPago.fecha_pago_declarada = fechaLocalISO();
    const precio = this.precioMensual();
    if (precio) this.formPago.monto = formatearPesosCOP(precio);
    this.mostrarFormularioPago.set(true);
  }

  async copiar(texto: string, que: string) {
    try {
      await navigator.clipboard.writeText(texto);
      this.toast.success(`${que} copiado`);
    } catch {
      this.toast.warning('No se pudo copiar, cópialo manualmente');
    }
  }

  cerrarFormularioPago() {
    this.mostrarFormularioPago.set(false);
    this.formPago = { monto: '', fecha_pago_declarada: '', periodo_declarado_por_docente: 'mensual' };
    this.archivoComprobante = null;
    this.qrAbierto.set(null);
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
    const errorMonto = validarPrecioCOP(monto);
    if (errorMonto) {
      this.toast.warning(errorMonto);
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
  }

  setLogoTamano(t: LogoTamano) {
    this.plantilla.update((p) => ({ ...p, logo_tamano: t }));
  }

  onTituloChange(v: string) {
    this.titulo.set(v);
  }

  onSubtituloChange(v: string) {
    this.plantilla.update((p) => ({ ...p, subtitulo_formato: v }));
  }

  onSegundaFirmaChange(v: string) {
    this.segundaFirma.set(v);
  }

  onObservacionesChange(v: string) {
    this.plantilla.update((p) => ({ ...p, observaciones_texto: v }));
  }

  toggleSeccion(id: SeccionReporteId) {
    if (!this.esOpcional(id)) return;
    this.plantilla.update((p) => {
      const activa = p.secciones_activas.includes(id);
      return { ...p, secciones_activas: activa ? p.secciones_activas.filter((s) => s !== id) : [...p.secciones_activas, id] };
    });
  }

  setTipoInstitucion(tipo: TipoInstitucion) {
    this.ajustarTituloSugerido(tipo);
    this.plantilla.update((p) => ({ ...p, tipo_institucion: tipo }));
  }

  /** Si el título sigue siendo uno de los sugeridos (no lo escribió el docente), cambia al del nuevo tipo. */
  private ajustarTituloSugerido(tipo: TipoInstitucion) {
    const sugeridos = Object.values(LABELS_INSTITUCION).map((l) => l.tituloSugerido);
    if (!this.titulo() || sugeridos.includes(this.titulo())) this.titulo.set(LABELS_INSTITUCION[tipo].tituloSugerido);
  }

  // ---------- Galería de plantillas ----------

  seleccionarPlantilla(c: PlantillaCatalogo) {
    if (c.nivel === 'premium' && !this.premiumActivo()) return;
    this.ajustarTituloSugerido(c.config.tipo_institucion);
    this.plantilla.update((p) => aplicarPlantillaCatalogo(p, c));
  }

  /** Plantilla gratis: se guarda tal cual viene del catálogo. */
  private cargarEnEditor(
    valores: { titulo: string; segundaFirma: string; plantilla: PlantillaReporte },
    guardado: { titulo: string; segundaFirma: string; plantilla: PlantillaReporte } | null
  ) {
    this.titulo.set(valores.titulo);
    this.segundaFirma.set(valores.segundaFirma);
    this.plantilla.set(valores.plantilla);
    this.guardado.set(guardado);
    if (this.plantillasGratis.some((c) => c.id === valores.plantilla.plantilla_id)) this.seleccionGratis.set(valores.plantilla.plantilla_id);
  }

  /** Valores de la plantilla general para usar como punto de partida (o los de fábrica si no hay). */
  private valoresGenerales() {
    return this.general() ?? { titulo: TITULO_FORMATO_DEFAULT, segundaFirma: '', plantilla: normalizarPlantilla(null) };
  }

  cambiarDestino(id: string) {
    if (id === this.destino()) return;
    if (this.hayCambios() && this.guardado() && !confirm('Tienes cambios sin guardar en esta plantilla. ¿Descartarlos?')) return;
    this.destino.set(id);
    if (id === 'general') {
      this.cargarEnEditor(this.valoresGenerales(), this.general());
      return;
    }
    const propia = this.asignaturas().find((a) => a.id === id)?.plantilla_reporte;
    if (propia) {
      const valores = { titulo: propia.titulo || TITULO_FORMATO_DEFAULT, segundaFirma: propia.segunda_firma || '', plantilla: normalizarPlantilla(propia.plantilla) };
      this.cargarEnEditor(valores, valores);
    } else {
      // Sin plantilla propia: se parte de la general y queda pendiente de guardar.
      this.cargarEnEditor(this.valoresGenerales(), null);
    }
  }

  async quitarPlantillaAsignatura() {
    const a = this.asignaturaDestino();
    if (!a || this.guardando()) return;
    if (!confirm(`"${a.nombre}" volverá a usar tu plantilla general. ¿Continuar?`)) return;
    this.guardando.set(true);
    try {
      await this.asignaturasService.actualizar(a.id, { plantilla_reporte: null });
      this.asignaturas.update((lista) => lista.map((x) => (x.id === a.id ? { ...x, plantilla_reporte: null } : x)));
      this.cargarEnEditor(this.valoresGenerales(), null);
      this.toast.success(`${a.nombre} ahora usa la plantilla general`);
    } catch (e: any) {
      console.error('Error quitando la plantilla de la asignatura:', e);
      this.toast.error('No se pudo quitar la plantilla de la asignatura');
    } finally {
      this.guardando.set(false);
    }
  }

  async guardarPlantillaGratis() {
    const c = plantillaDelCatalogo(this.seleccionGratis());
    if (!c) return;
    this.seleccionarPlantilla(c);
    await this.guardarPlantilla();
  }

  restablecerPlantilla() {
    const c = plantillaDelCatalogo(this.plantilla().plantilla_id);
    if (c) this.seleccionarPlantilla(c);
  }

  setTipoTabla(tipo: TipoTablaAsistencia) {
    this.plantilla.update((p) => ({ ...p, tipo_tabla_asistencia: tipo }));
  }

  toggleColumnaHistorial(col: 'tema' | 'horas' | 'firma') {
    this.plantilla.update((p) => ({ ...p, columnas_historial: { ...p.columnas_historial, [col]: !p.columnas_historial[col] } }));
  }

  toggleColumnaMatriz(col: 'cedula' | 'porcentaje') {
    this.plantilla.update((p) => ({ ...p, columnas_matriz: { ...p.columnas_matriz, [col]: !p.columnas_matriz[col] } }));
  }

  toggleLeyenda() {
    this.plantilla.update((p) => ({ ...p, mostrar_leyenda: !p.mostrar_leyenda }));
  }

  setTamanoFuente(t: TamanoFuenteTabla) {
    this.plantilla.update((p) => ({ ...p, tamano_fuente: t }));
  }



  drop(event: CdkDragDrop<SeccionReporteId[]>) {
    if (event.previousIndex === event.currentIndex) return;
    this.plantilla.update((p) => {
      const orden = [...p.orden_secciones];
      moveItemInArray(orden, event.previousIndex, event.currentIndex);
      return { ...p, orden_secciones: orden };
    });
  }

  async guardarPlantilla() {
    if (!this.docenteId || this.guardando()) return;
    this.guardando.set(true);
    try {
      const plantilla = { ...this.plantilla(), updated_at: new Date().toISOString() };
      const asignatura = this.asignaturaDestino();
      if (asignatura) {
        const propia: PlantillaAsignatura = { titulo: this.titulo(), segunda_firma: this.segundaFirma(), plantilla };
        await this.asignaturasService.actualizar(asignatura.id, { plantilla_reporte: propia });
        this.asignaturas.update((lista) => lista.map((x) => (x.id === asignatura.id ? { ...x, plantilla_reporte: propia } : x)));
      } else {
        await this.adminService.actualizarPlantillaPremium(this.docenteId, {
          formato_reporte_titulo: this.titulo(),
          formato_reporte_segunda_firma: this.segundaFirma(),
          plantilla_reporte: plantilla,
        });
        this.general.set({ titulo: this.titulo(), segundaFirma: this.segundaFirma(), plantilla });
        // Reportes lee la plantilla del perfil en memoria: se refresca para que el próximo PDF ya la use.
        if (this.userId) await this.authService.resolveProfile(this.userId).catch(() => null);
      }
      this.plantilla.set(plantilla);
      this.guardado.set({ titulo: this.titulo(), segundaFirma: this.segundaFirma(), plantilla });
      this.toast.success(
        asignatura
          ? `Plantilla guardada solo para ${asignatura.nombre}.`
          : 'Plantilla general guardada. Las asignaturas sin plantilla propia ya usan este formato.'
      );
    } catch (e: any) {
      console.error('Error guardando la plantilla Premium:', e);
      this.toast.error('No se pudo guardar la plantilla');
    } finally {
      this.guardando.set(false);
    }
  }
}
