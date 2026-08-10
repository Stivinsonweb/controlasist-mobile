import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { XLSX, styleHeaderRow, autofitColumns } from '../../../shared/utils/excel-report.util';
import { AsignaturasService, Asignatura, Horario, DIAS_SEMANA, FilaCargaMasiva, ResultadoFilaCarga } from '../../../core/services/asignaturas.service';
import { AdminService } from '../../../core/services/admin.service';
import { AsistenciasService, Asistencia, EstadoAsistencia, ESTADOS_ASISTENCIA, TipoClase, TIPOS_CLASE } from '../../../core/services/asistencias.service';
import { ToastService } from '../../../core/services/toast.service';
import { DialogComponent } from '../../../shared/components/dialog/dialog.component';
import { CalendarioSelectorComponent } from '../../../shared/components/calendario-selector/calendario-selector.component';
import { CalendarioClasesComponent } from '../../../shared/components/calendario-clases/calendario-clases.component';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { SubjectIconComponent } from '../../../shared/components/subject-icon/subject-icon.component';
import { subjectGradientStyle, subjectShadowStyle } from '../../../shared/utils/subject-theme.util';

export interface EstadoOpcion {
  valor: string;
  label: string;
  descripcion: string;
  color: string;
}

const ESTADOS_CLASE: EstadoOpcion[] = [
  { valor: 'realizada', label: 'Realizada', descripcion: 'La clase se dictó normalmente', color: '#10b981' },
  { valor: 'cancelada', label: 'Cancelada', descripcion: 'La clase no se realizó', color: '#ef4444' },
  { valor: 'aplazada', label: 'Aplazada', descripcion: 'La clase se reprogramó', color: '#f59e0b' },
];

interface DiaMultiple {
  dia: number;
  nombre: string;
  seleccionado: boolean;
  fecha_clase: string;
  hora_inicio: string;
  hora_fin: string;
  aula: string;
}

const HORAS_RAPIDAS = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

function diasMultipleVacios(): DiaMultiple[] {
  return [1, 2, 3, 4, 5, 6].map((dia) => ({
    dia,
    nombre: DIAS_SEMANA[dia],
    seleccionado: false,
    fecha_clase: '',
    hora_inicio: '',
    hora_fin: '',
    aula: '',
  }));
}

export interface EstudianteRoster {
  id: string;
  nombres: string;
  apellidos: string;
  cedula?: string;
  email?: string;
  telefono?: string;
  foto_url?: string;
  observaciones?: string;
}

interface EstudianteInscrito {
  estudiante_id: string;
  estudiantes: EstudianteRoster | null;
}

interface RegistroTrabajo {
  estudiante_id: string;
  nombres: string;
  apellidos: string;
  estado: EstadoAsistencia;
}

interface FilaCargaPreview extends FilaCargaMasiva {
  valido: boolean;
  motivo?: string;
}

@Component({
  selector: 'app-detalle-asignatura',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, DialogComponent, CalendarioSelectorComponent, CalendarioClasesComponent, AvatarComponent, SubjectIconComponent],
  templateUrl: './detalle.page.html',
})
export class DetalleAsignaturaPage implements OnInit {
  asignaturaId = '';
  asignatura = signal<Asignatura | null>(null);
  horarios = signal<Horario[]>([]);
  roster = signal<EstudianteInscrito[]>([]);
  totalEstudiantes = signal(0);
  loading = signal(true);
  showConfirmDesactivar = false;
  dias = DIAS_SEMANA;
  horasRapidas = HORAS_RAPIDAS;

  // Configurar código de acceso
  showCodigoConfig = false;
  tieneExpiracion = false;
  fechaExpiracion = '';
  regenerandoCodigo = false;
  savingExpiracion = false;

  // Info / observaciones de estudiante
  estudianteSeleccionado = signal<EstudianteRoster | null>(null);
  observacionesEdit = '';
  observacionesOriginal = '';
  editandoObservaciones = false;
  savingObservaciones = false;

  // Agregar horario único
  showAgregarHorario = false;
  savingHorario = false;
  nuevoHorario = { dia_semana: 1, hora_inicio: '', hora_fin: '', aula: '', fecha_clase: '' };

  // Agregar horarios múltiples
  showAgregarMultiples = false;
  savingMultiples = false;
  diasMultiples: DiaMultiple[] = diasMultipleVacios();
  diaExpandido: number | null = null;

  // Eliminar horario
  horarioAEliminar = signal<Horario | null>(null);

  // Estado de clase (marcar sesión)
  estados = ESTADOS_CLASE;
  claseSeleccionada = signal<{ horario: Horario; estado: string; esHoy: boolean } | null>(null);
  estadoElegido = '';
  savingEstado = false;

  // Tomar asistencia por estudiante
  estadosAsistencia = ESTADOS_ASISTENCIA;
  showTomarAsistencia = false;
  loadingAsistencia = false;
  savingAsistencia = false;
  asistenciaActual: Asistencia | null = null;
  registrosTrabajo: RegistroTrabajo[] = [];
  temasTratados = '';
  observacionesClase = '';
  temasTratadosInvalid = false;
  private pendienteAsistenciaPayload: Asistencia | null = null;

  // Historial de clases dictadas (puntos 10 y 11)
  tiposClase = TIPOS_CLASE;
  tipoClaseSeleccionada: TipoClase | '' = '';
  tipoClaseInvalid = false;
  historial = signal<Asistencia[]>([]);
  loadingHistorial = signal(true);
  filtroTipoClaseHistorial = signal<TipoClase | 'todos'>('todos');
  historialFiltrado = computed(() => {
    const filtro = this.filtroTipoClaseHistorial();
    const lista = this.historial();
    return filtro === 'todos' ? lista : lista.filter((h) => h.tipo_clase === filtro);
  });

  // Carga masiva de estudiantes (punto 9)
  showCargaMasiva = false;
  nombreArchivoCarga = '';
  cargandoArchivo = false;
  matriculando = false;
  filasCarga: FilaCargaPreview[] = [];
  resultadosCarga: ResultadoFilaCarga[] | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private asignaturasService: AsignaturasService,
    private adminService: AdminService,
    private asistenciasService: AsistenciasService,
    private toast: ToastService
  ) {}

  async ngOnInit() {
    this.asignaturaId = this.route.snapshot.paramMap.get('id') || '';
    await this.load();
  }

  async load() {
    this.loading.set(true);
    try {
      const [asignatura, horarios, roster] = await Promise.all([
        this.asignaturasService.obtenerPorId(this.asignaturaId),
        this.asignaturasService.listarHorarios(this.asignaturaId),
        this.asignaturasService.listarEstudiantesInscritos(this.asignaturaId).catch(() => []),
      ]);
      this.asignatura.set(asignatura);
      this.horarios.set(horarios);
      this.roster.set(roster as EstudianteInscrito[]);
      this.totalEstudiantes.set(roster.length);
    } catch (e: any) {
      console.error(e);
      this.toast.error('No se pudo cargar la asignatura');
      this.router.navigate(['/home']);
    } finally {
      this.loading.set(false);
    }
    await this.cargarHistorial();
  }

  async cargarHistorial() {
    this.loadingHistorial.set(true);
    try {
      const historial = await this.asistenciasService.listarPorAsignatura(this.asignaturaId);
      this.historial.set(historial);
    } catch (e) {
      console.error('Error cargando historial de clases:', e);
    } finally {
      this.loadingHistorial.set(false);
    }
  }

  tipoClaseLabel(valor?: string | null): string {
    return this.tiposClase.find((t) => t.valor === valor)?.label || 'Sin tipo';
  }

  copiarCodigo() {
    const codigo = this.asignatura()?.codigo_acceso;
    if (!codigo) {
      this.toast.warning('Esta asignatura aún no tiene código de acceso');
      return;
    }
    navigator.clipboard.writeText(codigo);
    this.toast.success('Código copiado al portapapeles');
  }

  irAEditar() {
    this.router.navigate(['/asignaturas/editar', this.asignaturaId]);
  }

  irAReportes() {
    this.router.navigate(['/reportes', this.asignaturaId]);
  }

  gradientStyle(color: string | null | undefined) {
    return subjectGradientStyle(color);
  }

  shadowStyle(color: string | null | undefined) {
    return subjectShadowStyle(color);
  }

  async confirmarDesactivar() {
    try {
      await this.asignaturasService.desactivar(this.asignaturaId);
      this.toast.success('Asignatura desactivada');
      this.router.navigate(['/home']);
    } catch (e: any) {
      this.toast.error(e.message || 'No se pudo desactivar la asignatura');
    } finally {
      this.showConfirmDesactivar = false;
    }
  }

  horarioLabel(h: Horario) {
    return `${this.dias[h.dia_semana] ?? '—'} · ${h.hora_inicio} - ${h.hora_fin}${h.aula ? ' · ' + h.aula : ''}`;
  }

  // ===== Agregar horario único =====
  abrirAgregarHorario() {
    this.nuevoHorario = { dia_semana: 1, hora_inicio: '', hora_fin: '', aula: '', fecha_clase: '' };
    this.showAgregarHorario = true;
  }

  async guardarHorario() {
    if (!this.nuevoHorario.hora_inicio || !this.nuevoHorario.hora_fin) {
      this.toast.warning('Indica la hora de inicio y de fin');
      return;
    }
    this.savingHorario = true;
    try {
      await this.asignaturasService.agregarHorario({
        asignatura_id: this.asignaturaId,
        dia_semana: Number(this.nuevoHorario.dia_semana),
        hora_inicio: this.nuevoHorario.hora_inicio,
        hora_fin: this.nuevoHorario.hora_fin,
        aula: this.nuevoHorario.aula || undefined,
        fecha_clase: this.nuevoHorario.fecha_clase || null,
        activo: true,
      });
      this.toast.success('Horario agregado');
      this.showAgregarHorario = false;
      await this.load();
    } catch (e: any) {
      this.toast.error(e.message || 'No se pudo agregar el horario');
    } finally {
      this.savingHorario = false;
    }
  }

  // ===== Agregar horarios múltiples =====
  abrirAgregarMultiples() {
    this.diasMultiples = diasMultipleVacios();
    this.diaExpandido = null;
    this.showAgregarMultiples = true;
  }

  toggleDiaMultiple(d: DiaMultiple) {
    d.seleccionado = !d.seleccionado;
    if (d.seleccionado) {
      this.diaExpandido = d.dia;
    } else {
      d.fecha_clase = '';
      d.hora_inicio = '';
      d.hora_fin = '';
      d.aula = '';
      if (this.diaExpandido === d.dia) this.diaExpandido = null;
    }
  }

  seleccionarHoraRapida(d: DiaMultiple, hora: string) {
    d.hora_inicio = hora;
  }

  async guardarMultiples() {
    const seleccionados = this.diasMultiples.filter((d) => d.seleccionado && d.hora_inicio && d.hora_fin);
    if (seleccionados.length === 0) {
      this.toast.warning('Debes configurar al menos un día con hora de inicio y fin');
      return;
    }
    this.savingMultiples = true;
    try {
      const payloads: Horario[] = seleccionados.map((d) => ({
        asignatura_id: this.asignaturaId,
        dia_semana: d.dia,
        hora_inicio: d.hora_inicio,
        hora_fin: d.hora_fin,
        aula: d.aula || undefined,
        fecha_clase: d.fecha_clase || null,
        activo: true,
      }));
      await this.asignaturasService.agregarHorariosMultiples(payloads);
      this.toast.success(`${payloads.length} horario(s) agregados`);
      this.showAgregarMultiples = false;
      await this.load();
    } catch (e: any) {
      this.toast.error(e.message || 'No se pudieron agregar los horarios');
    } finally {
      this.savingMultiples = false;
    }
  }

  // ===== Eliminar horario =====
  pedirEliminarHorario(h: Horario) {
    this.horarioAEliminar.set(h);
  }

  async confirmarEliminarHorario() {
    const h = this.horarioAEliminar();
    if (!h?.id) return;
    try {
      await this.asignaturasService.desactivarHorario(h.id);
      this.toast.success('Horario eliminado');
      this.horarioAEliminar.set(null);
      await this.load();
    } catch (e: any) {
      this.toast.error(e.message || 'No se pudo eliminar el horario');
    }
  }

  // ===== Estado de clase =====
  onClaseClick(evento: { horario: Horario; estado: string; esHoy: boolean }) {
    this.claseSeleccionada.set(evento);
    this.estadoElegido = ['realizada', 'cancelada', 'aplazada'].includes(evento.estado) ? evento.estado : '';
  }

  cerrarEstadoClase() {
    this.claseSeleccionada.set(null);
    this.estadoElegido = '';
  }

  async guardarEstadoClase() {
    const seleccion = this.claseSeleccionada();
    if (!seleccion?.horario.id || !this.estadoElegido) {
      this.toast.warning('Selecciona un estado');
      return;
    }
    this.savingEstado = true;
    try {
      await this.asignaturasService.actualizarEstadoHorario(seleccion.horario.id, this.estadoElegido);
      this.toast.success('Estado guardado exitosamente');
      this.cerrarEstadoClase();
      await this.load();
    } catch (e: any) {
      this.toast.error(e.message || 'No se pudo guardar el estado');
    } finally {
      this.savingEstado = false;
    }
  }

  colorEstado(valor: string): string {
    return this.estados.find((e) => e.valor === valor)?.color || '#94a3b8';
  }

  // ===== Tomar asistencia =====
  async abrirTomarAsistencia() {
    const seleccion = this.claseSeleccionada();
    const a = this.asignatura();
    if (!seleccion || !a) return;

    this.showTomarAsistencia = true;
    this.loadingAsistencia = true;
    this.temasTratadosInvalid = false;
    this.tipoClaseInvalid = false;
    try {
      const fechaHoy = new Date().toISOString().split('T')[0];
      this.pendienteAsistenciaPayload = {
        asignatura_id: a.id,
        docente_id: a.docente_id,
        fecha: fechaHoy,
        hora_inicio: seleccion.horario.hora_inicio,
        hora_fin: seleccion.horario.hora_fin,
        facultad: a.facultad || null,
        programa: a.programa || null,
        nivel: a.nivel || null,
        codigo: a.codigo || null,
        periodo: a.periodo || null,
        cds: a.cds || null,
      };

      // No se crea la fila en `asistencias` todavía: la columna temas_tratados es NOT NULL
      // y el docente aún no la ha completado. Se crea recién en guardarAsistencia().
      const asistencia = await this.asistenciasService.obtenerAsistencia(a.id, fechaHoy, seleccion.horario.hora_inicio, seleccion.horario.hora_fin);
      this.asistenciaActual = asistencia;
      this.temasTratados = asistencia?.temas_tratados || '';
      this.observacionesClase = asistencia?.observaciones || '';
      this.tipoClaseSeleccionada = asistencia?.tipo_clase || '';

      await this.cargarRegistrosTrabajo(asistencia?.id);
    } catch (e: any) {
      this.toast.error(e.message || 'No se pudo abrir la toma de asistencia');
      this.showTomarAsistencia = false;
    } finally {
      this.loadingAsistencia = false;
    }
  }

  /** Abre el mismo diálogo de "tomar asistencia" pero para editar una clase ya dictada (historial). */
  async abrirDetalleClase(a: Asistencia) {
    this.showTomarAsistencia = true;
    this.loadingAsistencia = true;
    this.temasTratadosInvalid = false;
    this.tipoClaseInvalid = false;
    this.pendienteAsistenciaPayload = null;
    this.asistenciaActual = a;
    this.temasTratados = a.temas_tratados || '';
    this.observacionesClase = a.observaciones || '';
    this.tipoClaseSeleccionada = a.tipo_clase || '';
    try {
      await this.cargarRegistrosTrabajo(a.id);
    } catch (e: any) {
      this.toast.error(e.message || 'No se pudo cargar el detalle de la clase');
      this.showTomarAsistencia = false;
    } finally {
      this.loadingAsistencia = false;
    }
  }

  private async cargarRegistrosTrabajo(asistenciaId?: string) {
    const registros = asistenciaId ? await this.asistenciasService.listarRegistros(asistenciaId) : [];
    const registrosPorEstudiante = new Map(registros.map((r) => [r.estudiante_id, r]));

    this.registrosTrabajo = this.roster()
      .filter((item): item is EstudianteInscrito & { estudiantes: EstudianteRoster } => !!item.estudiantes)
      .map((item) => ({
        estudiante_id: item.estudiantes.id,
        nombres: item.estudiantes.nombres,
        apellidos: item.estudiantes.apellidos,
        estado: registrosPorEstudiante.get(item.estudiantes.id)?.estado || 'presente',
      }));
  }

  cerrarTomarAsistencia() {
    this.showTomarAsistencia = false;
    this.asistenciaActual = null;
    this.registrosTrabajo = [];
    this.pendienteAsistenciaPayload = null;
    this.temasTratadosInvalid = false;
    this.tipoClaseInvalid = false;
    this.tipoClaseSeleccionada = '';
  }

  marcarTodosPresentes() {
    this.registrosTrabajo.forEach((r) => (r.estado = 'presente'));
  }

  colorEstadoAsistencia(valor: string): string {
    return this.estadosAsistencia.find((e) => e.valor === valor)?.color || '#94a3b8';
  }

  async guardarAsistencia() {
    let valido = true;
    if (!this.temasTratados.trim()) {
      this.temasTratadosInvalid = true;
      valido = false;
    } else {
      this.temasTratadosInvalid = false;
    }
    if (!this.tipoClaseSeleccionada) {
      this.tipoClaseInvalid = true;
      valido = false;
    } else {
      this.tipoClaseInvalid = false;
    }
    if (!valido) {
      this.toast.warning('Completa el tipo de clase y los temas tratados antes de guardar');
      return;
    }

    this.savingAsistencia = true;
    try {
      let asistencia = this.asistenciaActual;
      if (!asistencia) {
        if (!this.pendienteAsistenciaPayload) return;
        asistencia = await this.asistenciasService.crearAsistencia({
          ...this.pendienteAsistenciaPayload,
          temas_tratados: this.temasTratados,
          observaciones: this.observacionesClase || null,
          tipo_clase: this.tipoClaseSeleccionada || null,
        });
        this.asistenciaActual = asistencia;
      } else if (
        this.temasTratados !== (asistencia.temas_tratados || '') ||
        this.observacionesClase !== (asistencia.observaciones || '') ||
        this.tipoClaseSeleccionada !== (asistencia.tipo_clase || '')
      ) {
        await this.asistenciasService.actualizarAsistencia(asistencia.id!, {
          temas_tratados: this.temasTratados,
          observaciones: this.observacionesClase || null,
          tipo_clase: this.tipoClaseSeleccionada || null,
        });
      }
      await Promise.all(
        this.registrosTrabajo.map((r) => this.asistenciasService.guardarRegistro(asistencia!.id!, r.estudiante_id, r.estado))
      );
      this.toast.success('Asistencia guardada exitosamente');
      this.cerrarTomarAsistencia();
      this.cerrarEstadoClase();
      await this.cargarHistorial();
    } catch (e: any) {
      this.toast.error(e.message || 'No se pudo guardar la asistencia');
    } finally {
      this.savingAsistencia = false;
    }
  }

  // ===== Configurar código de acceso =====
  abrirCodigoConfig() {
    const a = this.asignatura();
    this.tieneExpiracion = !!a?.codigo_expira;
    this.fechaExpiracion = a?.codigo_expira ? a.codigo_expira.slice(0, 10) : '';
    this.showCodigoConfig = true;
  }

  async compartirCodigo() {
    const a = this.asignatura();
    if (!a) return;
    const mensaje = `🎓 Únete a mi asignatura en ControlAsist\n\n📚 ${a.nombre}\n👥 Grupo ${a.grupo}\n📅 Periodo ${a.periodo}\n\n🔑 Código de acceso: ${a.codigo_acceso}\n\nIngresa a ControlAsist y usa este código para inscribirte.`;
    try {
      if ((navigator as any).share) {
        await (navigator as any).share({ title: `Asignatura: ${a.nombre}`, text: mensaje });
      } else {
        await navigator.clipboard.writeText(mensaje);
        this.toast.success('Mensaje copiado al portapapeles');
      }
    } catch {
      // El usuario canceló el diálogo de compartir; no es un error a reportar.
    }
  }

  async regenerarCodigo() {
    this.regenerandoCodigo = true;
    try {
      const actualizada = await this.asignaturasService.regenerarCodigoAcceso(this.asignaturaId);
      this.asignatura.set(actualizada);
      this.toast.success('Código regenerado exitosamente');
    } catch (e: any) {
      this.toast.error(e.message || 'No se pudo regenerar el código');
    } finally {
      this.regenerandoCodigo = false;
    }
  }

  async guardarExpiracion() {
    if (this.tieneExpiracion && !this.fechaExpiracion) {
      this.toast.warning('Selecciona una fecha de expiración');
      return;
    }
    this.savingExpiracion = true;
    try {
      const actualizada = await this.asignaturasService.actualizarExpiracionCodigo(
        this.asignaturaId,
        this.tieneExpiracion ? this.fechaExpiracion : null
      );
      this.asignatura.set(actualizada);
      this.toast.success('Configuración guardada');
      this.showCodigoConfig = false;
    } catch (e: any) {
      this.toast.error(e.message || 'No se pudo guardar la configuración');
    } finally {
      this.savingExpiracion = false;
    }
  }

  // ===== Info / observaciones de estudiante =====
  verEstudiante(item: EstudianteInscrito) {
    if (!item.estudiantes) return;
    this.estudianteSeleccionado.set(item.estudiantes);
    this.observacionesEdit = item.estudiantes.observaciones || '';
    this.observacionesOriginal = this.observacionesEdit;
    this.editandoObservaciones = false;
  }

  cerrarEstudiante() {
    this.estudianteSeleccionado.set(null);
    this.editandoObservaciones = false;
  }

  iniciales(e: EstudianteRoster): string {
    return `${(e.nombres?.[0] ?? '').toUpperCase()}${(e.apellidos?.[0] ?? '').toUpperCase()}`;
  }

  cancelarEdicionObservaciones() {
    this.observacionesEdit = this.observacionesOriginal;
    this.editandoObservaciones = false;
  }

  async guardarObservaciones() {
    const est = this.estudianteSeleccionado();
    if (!est) return;
    if (this.observacionesEdit === this.observacionesOriginal) {
      this.editandoObservaciones = false;
      return;
    }
    this.savingObservaciones = true;
    try {
      await this.adminService.actualizarObservacionesEstudiante(est.id, this.observacionesEdit);
      this.observacionesOriginal = this.observacionesEdit;
      est.observaciones = this.observacionesEdit;
      this.editandoObservaciones = false;
      this.toast.success('Observaciones guardadas exitosamente');
    } catch (e: any) {
      this.toast.error(e.message || 'No se pudo guardar las observaciones');
    } finally {
      this.savingObservaciones = false;
    }
  }

  // ===== Carga masiva de estudiantes =====
  abrirCargaMasiva() {
    this.nombreArchivoCarga = '';
    this.filasCarga = [];
    this.resultadosCarga = null;
    this.showCargaMasiva = true;
  }

  cerrarCargaMasiva() {
    this.showCargaMasiva = false;
    this.nombreArchivoCarga = '';
    this.filasCarga = [];
    this.resultadosCarga = null;
  }

  descargarPlantilla() {
    const headers = ['nombres', 'apellidos', 'cedula', 'email', 'contraseña', 'telefono', 'programa'];
    const ejemplo = ['Juan', 'Pérez', '1234567890', 'juan.perez@correo.com', 'Cambiar123', '3001234567', 'Ingeniería de Sistemas'];
    const aoa = [headers, ejemplo];

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    styleHeaderRow(ws, 0, headers.length);
    autofitColumns(ws, aoa);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Estudiantes');
    XLSX.writeFile(wb, 'plantilla-carga-estudiantes.xlsx');
  }

  async onArchivoSeleccionado(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.nombreArchivoCarga = file.name;
    this.resultadosCarga = null;
    this.cargandoArchivo = true;
    try {
      const buffer = await file.arrayBuffer();
      // Los .xlsx/.xls guardan sus strings en UTF-8 dentro del propio zip, así que XLSX.read los
      // decodifica bien desde el ArrayBuffer. Los .csv en cambio son texto plano: si se pasan como
      // ArrayBuffer, SheetJS los interpreta con el codepage por defecto y las tildes/ñ (UTF-8
      // multibyte) se corrompen. Para .csv forzamos el decode como UTF-8 explícitamente y les
      // quitamos el BOM que agrega Excel al usar "Guardar como CSV UTF-8".
      const esCSV = /\.csv$/i.test(file.name);
      const workbook = esCSV
        ? XLSX.read(new TextDecoder('utf-8').decode(buffer).replace(/^﻿/, ''), { type: 'string' })
        : XLSX.read(buffer, { type: 'array' });
      const hoja = workbook.Sheets[workbook.SheetNames[0]];
      const filas = XLSX.utils.sheet_to_json<Record<string, any>>(hoja, { defval: '' });

      const cedulasVistas = new Set<string>();
      this.filasCarga = filas.map((fila): FilaCargaPreview => {
        const valor = (...claves: string[]) => {
          for (const clave of claves) {
            const encontrada = Object.keys(fila).find((k) => k.trim().toLowerCase() === clave);
            if (encontrada && String(fila[encontrada]).trim()) return String(fila[encontrada]).trim();
          }
          return '';
        };

        const nombres = valor('nombres', 'nombre');
        const apellidos = valor('apellidos', 'apellido');
        const cedula = valor('cedula', 'cédula', 'documento');
        const email = valor('email', 'correo', 'correo electrónico');
        const password = valor('contraseña', 'contrasena', 'password', 'clave');
        const telefono = valor('telefono', 'teléfono', 'celular');
        const programa = valor('programa');

        let motivo = '';
        if (!nombres || !apellidos) motivo = 'Falta nombres o apellidos';
        else if (!email) motivo = 'Falta correo electrónico';
        else if (!password) motivo = 'Falta contraseña';
        else if (password.length < 6) motivo = 'La contraseña debe tener al menos 6 caracteres';
        else if (cedula && cedulasVistas.has(cedula)) motivo = 'Cédula duplicada en el archivo';
        if (cedula) cedulasVistas.add(cedula);

        return { nombres, apellidos, cedula, email, password, telefono, programa, tipo_documento: 'CC', valido: !motivo, motivo };
      });

      if (this.filasCarga.length === 0) {
        this.toast.warning('El archivo no tiene filas para procesar');
      }
    } catch (e) {
      console.error('Error leyendo archivo de carga masiva:', e);
      this.toast.error('No se pudo leer el archivo. Verifica que sea un Excel (.xlsx) o CSV válido.');
      this.filasCarga = [];
    } finally {
      this.cargandoArchivo = false;
      input.value = '';
    }
  }

  get filasValidasCount(): number {
    return this.filasCarga.filter((f) => f.valido).length;
  }

  contarResultado(tipo: ResultadoFilaCarga['resultado']): number {
    return this.resultadosCarga?.filter((r) => r.resultado === tipo).length || 0;
  }

  async confirmarCargaMasiva() {
    const validas = this.filasCarga.filter((f) => f.valido);
    if (validas.length === 0) {
      this.toast.warning('No hay filas válidas para matricular');
      return;
    }
    this.matriculando = true;
    try {
      const resultados = await this.asignaturasService.matricularEstudiantesMasivo(this.asignaturaId, validas);
      this.resultadosCarga = resultados;
      await this.load();
    } catch (e: any) {
      this.toast.error(e.message || 'No se pudo completar la carga masiva');
    } finally {
      this.matriculando = false;
    }
  }
}
