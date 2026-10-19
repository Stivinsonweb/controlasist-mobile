import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';
import { AuthService } from '../../core/services/auth.service';
import { AsignaturasService, Asignatura, Horario, DIAS_SEMANA } from '../../core/services/asignaturas.service';
import { ReportesService } from '../../core/services/reportes.service';
import {
  ActividadesService,
  Actividad,
  ActividadPayload,
  EntregaActividad,
  TIPOS_ACTIVIDAD,
  TipoActividad,
  actividadVencida,
  entregaTardia,
  tipoActividadLabel,
} from '../../core/services/actividades.service';
import { ToastService } from '../../core/services/toast.service';
import { DialogComponent } from '../../shared/components/dialog/dialog.component';
import { CalendarioSelectorComponent } from '../../shared/components/calendario-selector/calendario-selector.component';
import { SelectorHoraComponent } from '../../shared/components/selector-hora/selector-hora.component';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { fechaLocalISO } from '../../shared/utils/fecha.util';

interface EstudianteInscrito {
  id: string;
  nombres: string;
  apellidos: string;
  foto_url?: string;
}

/** Fila de la tabla de entregas: un estudiante inscrito con su entrega (si la hay) y el borrador de nota. */
interface FilaEntrega {
  estudiante: EstudianteInscrito;
  entrega: EntregaActividad | null;
  nota: string;
  retro: string;
  guardando: boolean;
}

/** Seguimiento: asistencia + entregas por estudiante en la asignatura filtrada. */
interface FilaRiesgo {
  estudiante: EstudianteInscrito;
  porcentajeAsistencia: number | null;
  vencidasSinEntregar: number;
  promedio: number | null;
  enRiesgo: boolean;
}

interface FormActividad {
  asignatura_id: string;
  tipo: TipoActividad;
  tipo_personalizado: string;
  titulo: string;
  descripcion: string;
  horario_id: string;
  fecha_clase: string;
  tiene_entrega: boolean;
  fecha_entrega: string;
  hora_entrega: string;
  permite_entregas: boolean;
  calificable: boolean;
  nota_maxima: number;
  enlace: string;
}

const UMBRAL_ASISTENCIA = 75;
const MAX_ARCHIVO_MB = 20;

function formVacio(asignaturaId = ''): FormActividad {
  return {
    asignatura_id: asignaturaId,
    tipo: 'tarea',
    tipo_personalizado: '',
    titulo: '',
    descripcion: '',
    horario_id: '',
    fecha_clase: '',
    tiene_entrega: true,
    fecha_entrega: '',
    hora_entrega: '23:59',
    permite_entregas: true,
    calificable: true,
    nota_maxima: 5,
    enlace: '',
  };
}

/** Próxima fecha (desde hoy) que cae en ese día de la semana. */
function proximaFechaDia(diaSemana: number): string {
  const d = new Date();
  d.setDate(d.getDate() + ((diaSemana - d.getDay() + 7) % 7));
  return fechaLocalISO(d);
}

@Component({
  selector: 'app-actividades',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogComponent, CalendarioSelectorComponent, SelectorHoraComponent, AvatarComponent],
  templateUrl: './actividades.page.html',
})
export class ActividadesPage implements OnInit {
  loading = signal(true);
  asignaturas = signal<Asignatura[]>([]);
  horarios = signal<Horario[]>([]);
  actividades = signal<Actividad[]>([]);
  entregas = signal<EntregaActividad[]>([]);
  /** Inscritos por asignatura (se cargan cuando se necesitan). */
  private inscritos = new Map<string, EstudianteInscrito[]>();

  filtroAsignatura = signal<string>('todas');
  tipos = TIPOS_ACTIVIDAD;
  dias = DIAS_SEMANA;

  actividadesFiltradas = computed(() => {
    const f = this.filtroAsignatura();
    return f === 'todas' ? this.actividades() : this.actividades().filter((a) => a.asignatura_id === f);
  });

  // ----- Crear / editar -----
  showForm = false;
  editando: Actividad | null = null;
  form: FormActividad = formVacio();
  archivo: File | null = null;
  quitarArchivo = false;
  guardando = false;

  // ----- Detalle / entregas -----
  detalle = signal<Actividad | null>(null);
  filas = signal<FilaEntrega[]>([]);
  loadingDetalle = signal(false);
  confirmarEliminar = false;

  // ----- Seguimiento de riesgo -----
  riesgo = signal<FilaRiesgo[]>([]);
  loadingRiesgo = signal(false);

  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService,
    private asignaturasService: AsignaturasService,
    private reportesService: ReportesService,
    private actividadesService: ActividadesService,
    private toast: ToastService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  async ngOnInit() {
    try {
      const user = await this.supabaseService.getCurrentUser();
      if (!user) return;
      const perfil = this.authService.currentProfileValue ?? (await this.authService.resolveProfile(user.id));
      if (!perfil) throw new Error('No se encontró tu perfil de docente');

      const asignaturas = (await this.asignaturasService.listarPorDocente(perfil.id)).filter((a) => a.activa);
      this.asignaturas.set(asignaturas);
      const ids = asignaturas.map((a) => a.id);
      const [horarios, actividades] = await Promise.all([
        this.asignaturasService.listarHorariosDeAsignaturas(ids),
        this.actividadesService.listarPorAsignaturas(ids),
      ]);
      this.horarios.set(horarios);
      this.actividades.set(actividades);
      this.entregas.set(await this.actividadesService.entregasDeActividades(actividades.map((a) => a.id)));

      const pedida = this.route.snapshot.queryParamMap.get('asignatura');
      if (pedida && ids.includes(pedida)) await this.setFiltro(pedida);
      if (this.route.snapshot.queryParamMap.get('nueva') === '1') this.abrirNueva();
    } catch (e: any) {
      console.error('Error cargando actividades:', e);
      this.toast.error('No se pudieron cargar las actividades');
    } finally {
      this.loading.set(false);
    }
  }

  async setFiltro(valor: string) {
    this.filtroAsignatura.set(valor);
    this.router.navigate([], { queryParams: { asignatura: valor === 'todas' ? null : valor }, replaceUrl: true });
    if (valor !== 'todas') await this.cargarRiesgo(valor);
    else this.riesgo.set([]);
  }

  // ===== Helpers de vista =====

  asignaturaDe(id: string) {
    return this.asignaturas().find((a) => a.id === id);
  }

  horariosDe(asignaturaId: string) {
    return this.horarios().filter((h) => h.asignatura_id === asignaturaId);
  }

  horarioLabel(h: Horario) {
    return `${this.dias[h.dia_semana] ?? '—'} ${h.hora_inicio.slice(0, 5)} - ${h.hora_fin.slice(0, 5)}${h.aula ? ' · ' + h.aula : ''}`;
  }

  claseLabel(a: Actividad): string | null {
    if (!a.fecha_clase) return null;
    const h = this.horarios().find((x) => x.id === a.horario_id);
    const fecha = new Date(a.fecha_clase + 'T00:00:00').toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' });
    return h ? `Clase del ${fecha} · ${h.hora_inicio.slice(0, 5)}` : `Clase del ${fecha}`;
  }

  tipoLabel = tipoActividadLabel;
  vencida = actividadVencida;

  fechaEntregaTexto(a: Actividad): string {
    if (!a.fecha_entrega) return 'Sin fecha de entrega';
    return new Date(a.fecha_entrega).toLocaleString('es-CO', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  }

  resumenEntregas(a: Actividad) {
    const propias = this.entregas().filter((e) => e.actividad_id === a.id);
    const notas = propias.map((e) => e.nota).filter((n): n is number => n !== null).map(Number);
    const entregadas = propias.filter((e) => e.archivo_path || e.enlace || e.comentario);
    return {
      entregadas: entregadas.length,
      porCalificar: entregadas.filter((e) => !e.calificada_en).length,
      calificadas: propias.filter((e) => e.calificada_en).length,
      promedio: notas.length ? notas.reduce((s, n) => s + n, 0) / notas.length : null,
    };
  }

  iniciales(e: EstudianteInscrito) {
    return `${e.nombres?.charAt(0) ?? ''}${e.apellidos?.charAt(0) ?? ''}`.toUpperCase();
  }

  // ===== Crear / editar =====

  abrirNueva() {
    const f = this.filtroAsignatura();
    this.editando = null;
    this.form = formVacio(f !== 'todas' ? f : this.asignaturas()[0]?.id ?? '');
    this.archivo = null;
    this.quitarArchivo = false;
    this.showForm = true;
  }

  abrirEditar(a: Actividad) {
    this.editando = a;
    const entrega = a.fecha_entrega ? new Date(a.fecha_entrega) : null;
    this.form = {
      asignatura_id: a.asignatura_id,
      tipo: a.tipo,
      tipo_personalizado: a.tipo_personalizado ?? '',
      titulo: a.titulo,
      descripcion: a.descripcion ?? '',
      horario_id: a.horario_id ?? '',
      fecha_clase: a.fecha_clase ?? '',
      tiene_entrega: !!entrega,
      fecha_entrega: entrega ? fechaLocalISO(entrega) : '',
      hora_entrega: entrega ? `${String(entrega.getHours()).padStart(2, '0')}:${String(entrega.getMinutes()).padStart(2, '0')}` : '23:59',
      permite_entregas: a.permite_entregas,
      calificable: a.calificable,
      nota_maxima: Number(a.nota_maxima),
      enlace: a.enlace ?? '',
    };
    this.archivo = null;
    this.quitarArchivo = false;
    this.showForm = true;
  }

  onAsignaturaForm(id: string) {
    this.form.asignatura_id = id;
    this.form.horario_id = '';
    this.form.fecha_clase = '';
  }

  onHorarioForm(id: string) {
    this.form.horario_id = id;
    const h = this.horarios().find((x) => x.id === id);
    this.form.fecha_clase = h ? (h.fecha_clase || proximaFechaDia(h.dia_semana)) : '';
  }

  onArchivo(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (file && file.size > MAX_ARCHIVO_MB * 1024 * 1024) {
      this.toast.warning(`El archivo supera ${MAX_ARCHIVO_MB} MB`);
      input.value = '';
      return;
    }
    this.archivo = file;
    this.quitarArchivo = false;
  }

  async guardar() {
    const f = this.form;
    if (!f.asignatura_id) return this.toast.warning('Elige la asignatura');
    if (f.tipo === 'otro' && !f.tipo_personalizado.trim()) return this.toast.warning('Escribe el tipo de actividad (ej: Laboratorio, Foro)');
    if (!f.titulo.trim()) return this.toast.warning('Escribe el título de la actividad');
    if (f.tiene_entrega && (!f.fecha_entrega || !f.hora_entrega)) return this.toast.warning('Indica la fecha y hora de entrega');
    if (f.calificable && !(Number(f.nota_maxima) > 0)) return this.toast.warning('La nota máxima debe ser mayor que 0');

    const payload: Omit<ActividadPayload, 'archivo_path' | 'archivo_nombre'> = {
      asignatura_id: f.asignatura_id,
      tipo: f.tipo,
      tipo_personalizado: f.tipo === 'otro' ? f.tipo_personalizado.trim().slice(0, 40) : null,
      titulo: f.titulo.trim(),
      descripcion: f.descripcion.trim() || null,
      horario_id: f.horario_id || null,
      fecha_clase: f.horario_id ? f.fecha_clase || null : null,
      fecha_entrega: f.tiene_entrega ? new Date(`${f.fecha_entrega}T${f.hora_entrega}:00`).toISOString() : null,
      permite_entregas: f.permite_entregas,
      calificable: f.calificable,
      nota_maxima: Number(f.nota_maxima) || 5,
      enlace: f.enlace.trim() || null,
    };

    this.guardando = true;
    try {
      let guardada: Actividad;
      if (this.editando) {
        guardada = await this.actividadesService.actualizar(this.editando, payload, this.archivo);
        if (this.quitarArchivo && !this.archivo && guardada.archivo_path) guardada = await this.actividadesService.quitarMaterial(guardada);
        this.actividades.update((l) => l.map((x) => (x.id === guardada.id ? guardada : x)));
        if (this.detalle()?.id === guardada.id) this.detalle.set(guardada);
        this.toast.success('Actividad actualizada');
      } else {
        guardada = await this.actividadesService.crear({ ...payload, archivo_path: null, archivo_nombre: null }, this.archivo);
        this.actividades.update((l) => [guardada, ...l]);
        this.toast.success('Actividad publicada. Tus estudiantes recibirán un aviso.');
      }
      this.showForm = false;
      // Se abre la actividad: ahí está la lista de estudiantes para revisar entregas y calificar.
      if (!this.editando) await this.abrirDetalle(guardada);
    } catch (e: any) {
      console.error('Error guardando la actividad:', e);
      this.toast.error(e.message || 'No se pudo guardar la actividad');
    } finally {
      this.guardando = false;
    }
  }

  // ===== Detalle y calificación =====

  private async inscritosDe(asignaturaId: string): Promise<EstudianteInscrito[]> {
    if (!this.inscritos.has(asignaturaId)) {
      const data = await this.asignaturasService.listarEstudiantesInscritos(asignaturaId);
      const lista = (data as any[])
        .map((i) => i.estudiantes)
        .filter(Boolean)
        .sort((a: EstudianteInscrito, b: EstudianteInscrito) => a.apellidos.localeCompare(b.apellidos));
      this.inscritos.set(asignaturaId, lista);
    }
    return this.inscritos.get(asignaturaId)!;
  }

  async abrirDetalle(a: Actividad) {
    this.detalle.set(a);
    this.confirmarEliminar = false;
    this.loadingDetalle.set(true);
    try {
      const [estudiantes, entregas] = await Promise.all([this.inscritosDe(a.asignatura_id), this.actividadesService.entregasDeActividad(a.id)]);
      this.entregas.update((l) => [...l.filter((e) => e.actividad_id !== a.id), ...entregas]);
      this.filas.set(
        estudiantes.map((estudiante) => {
          const entrega = entregas.find((e) => e.estudiante_id === estudiante.id) ?? null;
          return { estudiante, entrega, nota: entrega?.nota != null ? String(entrega.nota) : '', retro: entrega?.retroalimentacion ?? '', guardando: false };
        })
      );
    } catch (e) {
      console.error(e);
      this.toast.error('No se pudieron cargar las entregas');
    } finally {
      this.loadingDetalle.set(false);
    }
  }

  cerrarDetalle() {
    this.detalle.set(null);
  }

  entrego(f: FilaEntrega) {
    return !!f.entrega && !!(f.entrega.archivo_path || f.entrega.enlace || f.entrega.comentario);
  }

  tardia(f: FilaEntrega) {
    const a = this.detalle();
    return !!a && this.entrego(f) && entregaTardia(a, f.entrega!);
  }

  async abrirArchivo(ruta: string | null) {
    if (!ruta) return;
    const ventana = window.open('', '_blank');
    try {
      const url = await this.actividadesService.urlArchivo(ruta);
      if (ventana) ventana.location.href = url;
      else window.location.href = url;
    } catch (e: any) {
      ventana?.close();
      this.toast.error('No se pudo abrir el archivo');
    }
  }

  async guardarNota(f: FilaEntrega) {
    const a = this.detalle();
    if (!a) return;
    const texto = f.nota.trim().replace(',', '.');
    const nota = texto === '' ? null : Number(texto);
    if (nota !== null && (isNaN(nota) || nota < 0 || nota > Number(a.nota_maxima))) {
      this.toast.warning(`La nota debe estar entre 0 y ${a.nota_maxima}`);
      return;
    }
    if (nota === null && !f.retro.trim() && !f.entrega) return;
    f.guardando = true;
    try {
      const entrega = f.entrega
        ? await this.actividadesService.calificar(f.entrega.id, nota, f.retro)
        : await this.actividadesService.registrarNota(a.id, f.estudiante.id, nota, f.retro);
      f.entrega = entrega;
      this.entregas.update((l) => [...l.filter((e) => e.id !== entrega.id), entrega]);
      this.toast.success(`Calificación guardada: ${f.estudiante.nombres}`);
    } catch (e: any) {
      console.error(e);
      this.toast.error(e.message || 'No se pudo guardar la calificación');
    } finally {
      f.guardando = false;
    }
  }

  async eliminar() {
    const a = this.detalle();
    if (!a) return;
    try {
      await this.actividadesService.eliminar(a);
      this.actividades.update((l) => l.filter((x) => x.id !== a.id));
      this.entregas.update((l) => l.filter((e) => e.actividad_id !== a.id));
      this.detalle.set(null);
      this.toast.success('Actividad eliminada');
    } catch (e: any) {
      this.toast.error(e.message || 'No se pudo eliminar la actividad');
    }
  }

  // ===== Seguimiento: asistencia + entregas =====

  async cargarRiesgo(asignaturaId: string) {
    this.loadingRiesgo.set(true);
    try {
      const [estudiantes, resumen] = await Promise.all([this.inscritosDe(asignaturaId), this.reportesService.resumenPorEstudiante(asignaturaId)]);
      const actividades = this.actividades().filter((a) => a.asignatura_id === asignaturaId);
      const vencidas = actividades.filter((a) => a.permite_entregas && actividadVencida(a));
      const entregas = this.entregas().filter((e) => actividades.some((a) => a.id === e.actividad_id));

      const filas = estudiantes.map((estudiante) => {
        const propias = entregas.filter((e) => e.estudiante_id === estudiante.id);
        const vencidasSinEntregar = vencidas.filter((a) => !propias.some((e) => e.actividad_id === a.id)).length;
        // Promedio sobre 5 para poder comparar actividades con distinta nota máxima.
        const notas = propias
          .filter((e) => e.nota !== null)
          .map((e) => (Number(e.nota) / Number(actividades.find((a) => a.id === e.actividad_id)?.nota_maxima || 5)) * 5);
        const r = resumen.find((x) => x.estudiante_id === estudiante.id);
        const porcentajeAsistencia = r && r.total > 0 ? r.porcentajeAsistencia : null;
        return {
          estudiante,
          porcentajeAsistencia,
          vencidasSinEntregar,
          promedio: notas.length ? notas.reduce((s, n) => s + n, 0) / notas.length : null,
          enRiesgo: (porcentajeAsistencia !== null && porcentajeAsistencia < UMBRAL_ASISTENCIA) || vencidasSinEntregar >= 2,
        };
      });
      filas.sort((a, b) => Number(b.enRiesgo) - Number(a.enRiesgo) || b.vencidasSinEntregar - a.vencidasSinEntregar);
      this.riesgo.set(filas);
    } catch (e) {
      console.error('Error cargando seguimiento:', e);
      this.riesgo.set([]);
    } finally {
      this.loadingRiesgo.set(false);
    }
  }

  get enRiesgoCount() {
    return this.riesgo().filter((r) => r.enRiesgo).length;
  }

  readonly umbral = UMBRAL_ASISTENCIA;
}
