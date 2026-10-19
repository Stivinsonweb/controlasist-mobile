import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';
import { AsignaturasService, Asignatura, Horario } from '../../core/services/asignaturas.service';
import { AsistenciasService } from '../../core/services/asistencias.service';
import { ActividadesService, Actividad } from '../../core/services/actividades.service';
import { ClaseVirtualService, esAsignaturaVirtual } from '../../core/services/clase-virtual.service';
import { DialogComponent } from '../../shared/components/dialog/dialog.component';
import { fechaLocalISO } from '../../shared/utils/fecha.util';
import { ToastService } from '../../core/services/toast.service';
import { EduBackgroundComponent } from '../../shared/components/edu-background/edu-background.component';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { SubjectIconComponent } from '../../shared/components/subject-icon/subject-icon.component';
import { subjectGradientStyle, subjectShadowStyle } from '../../shared/utils/subject-theme.util';

type EstadoClaseHoy = 'tomada' | 'realizada' | 'cancelada' | 'aplazada' | 'en_curso' | 'pendiente' | 'sin_registrar';

export interface ClaseHoy {
  horario: Horario;
  asignatura: Asignatura;
  estado: EstadoClaseHoy;
  /** Actividades ligadas a esta clase de hoy. */
  actividades: Actividad[];
  /** Clase virtual: link vigente hoy (el del día o el fijo) y cuántos entraron con "Unirme". */
  virtual: boolean;
  linkHoy: string | null;
  linkDelDia: boolean;
  ingresos: number;
}

const ESTADOS_CLASE_HOY: Record<EstadoClaseHoy, { label: string; color: string }> = {
  tomada: { label: 'Asistencia tomada', color: '#10b981' },
  realizada: { label: 'Realizada', color: '#10b981' },
  en_curso: { label: 'En curso', color: '#3b82f6' },
  pendiente: { label: 'Más tarde', color: '#64748b' },
  sin_registrar: { label: 'Sin registrar', color: '#f59e0b' },
  cancelada: { label: 'Cancelada', color: '#ef4444' },
  aplazada: { label: 'Aplazada', color: '#8b5cf6' },
};

@Component({
  selector: 'app-home-docente',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogComponent, EduBackgroundComponent, AvatarComponent, SubjectIconComponent],
  templateUrl: './home.page.html',
})
export class HomeDocentePage implements OnInit {
  docente = signal<any>(null);
  asignaturas = signal<Asignatura[]>([]);
  loadingProfile = signal(true);
  loadingAsignaturas = signal(true);

  /** "Mis clases de hoy": clases de las asignaturas activas que tocan hoy, en orden de hora. */
  clasesHoy = signal<ClaseHoy[]>([]);
  loadingClasesHoy = signal(true);
  hoyTexto = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });

  periodos = signal<string[]>([]);
  periodoSeleccionado = signal<string>('todos');

  /** Las archivadas tienen su propio botón ("Archivadas"); los filtros de periodo muestran solo las activas. */
  archivadas = computed(() => this.asignaturas().filter((a) => !a.activa));

  asignaturasFiltradas = computed(() => {
    const periodo = this.periodoSeleccionado();
    if (periodo === 'archivadas') return this.archivadas();
    const lista = this.asignaturas().filter((a) => a.activa);
    return periodo === 'todos' ? lista : lista.filter((a) => a.periodo === periodo);
  });

  constructor(
    private supabaseService: SupabaseService,
    private asignaturasService: AsignaturasService,
    private asistenciasService: AsistenciasService,
    private actividadesService: ActividadesService,
    private claseVirtualService: ClaseVirtualService,
    private router: Router,
    private toast: ToastService
  ) {}

  async ngOnInit() {
    await this.loadAll();
  }

  async loadAll() {
    await this.loadDocente();
    await this.loadAsignaturas();
    await this.loadClasesHoy();
  }

  /** Misma lógica del calendario de la asignatura: horarios activos del día de la semana de hoy. */
  async loadClasesHoy() {
    this.loadingClasesHoy.set(true);
    try {
      const activas = this.asignaturas().filter((a) => a.activa && a.id);
      const ids = activas.map((a) => a.id!) ;
      const ahora = new Date();
      const hoy = fechaLocalISO(ahora);
      const hora = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;

      const [horarios, tomadas, actividadesHoy] = await Promise.all([
        this.asignaturasService.listarHorariosDeAsignaturas(ids),
        this.asistenciasService.listarDeFecha(ids, hoy),
        this.actividadesService.listarDeClases(ids, hoy).catch(() => [] as Actividad[]),
      ]);
      const clave = (asignaturaId: string, ini: string, fin: string) => `${asignaturaId}|${ini}|${fin}`;
      const conAsistencia = new Set(tomadas.map((t) => clave(t.asignatura_id, t.hora_inicio, t.hora_fin)));

      const deHoy = horarios.filter((h) => h.dia_semana === ahora.getDay());
      const idsHoy = deHoy.map((h) => h.id!).filter(Boolean);
      const [linksDia, ingresos] = await Promise.all([
        this.claseVirtualService.linksDelDia(idsHoy, hoy).catch(() => []),
        this.claseVirtualService.ingresos(idsHoy, hoy).catch(() => []),
      ]);

      const clases: ClaseHoy[] = deHoy
        .map((h) => {
          const asignatura = activas.find((a) => a.id === h.asignatura_id)!;
          let estado: EstadoClaseHoy;
          if (conAsistencia.has(clave(h.asignatura_id, h.hora_inicio, h.hora_fin))) estado = 'tomada';
          else if (h.estado && h.estado !== 'pendiente' && h.fecha_ultima_actualizacion === hoy) estado = h.estado as EstadoClaseHoy;
          else if (hora < h.hora_inicio.slice(0, 5)) estado = 'pendiente';
          else if (hora <= h.hora_fin.slice(0, 5)) estado = 'en_curso';
          else estado = 'sin_registrar';
          const linkDia = linksDia.find((l) => l.horario_id === h.id)?.link ?? null;
          return {
            horario: h,
            asignatura,
            estado,
            actividades: actividadesHoy.filter((a) => a.horario_id === h.id),
            virtual: esAsignaturaVirtual(asignatura),
            linkHoy: linkDia || asignatura.link_clase || null,
            linkDelDia: !!linkDia,
            ingresos: ingresos.filter((i) => i.horario_id === h.id).length,
          };
        })
        .sort((a, b) => a.horario.hora_inicio.localeCompare(b.horario.hora_inicio));
      this.clasesHoy.set(clases);
    } catch (e) {
      console.error('Error cargando las clases de hoy:', e);
      this.clasesHoy.set([]);
    } finally {
      this.loadingClasesHoy.set(false);
    }
  }

  infoEstadoHoy(estado: EstadoClaseHoy) {
    return ESTADOS_CLASE_HOY[estado] ?? ESTADOS_CLASE_HOY.pendiente;
  }

  /** Se puede tomar asistencia salvo que la clase se haya cancelado o aplazado. */
  puedeTomarAsistencia(c: ClaseHoy): boolean {
    return c.estado !== 'cancelada' && c.estado !== 'aplazada';
  }

  abrirClaseHoy(c: ClaseHoy, accion: 'asistencia' | 'qr') {
    this.router.navigate(['/asignaturas/detalle', c.asignatura.id], { queryParams: { clase: c.horario.id, accion } });
  }

  // ===== Link de la clase virtual de hoy =====
  claseLink: ClaseHoy | null = null;
  linkEdit = '';
  publicandoLink = false;

  abrirLinkHoy(c: ClaseHoy) {
    this.claseLink = c;
    this.linkEdit = c.linkHoy || '';
  }

  async publicarLinkHoy() {
    const c = this.claseLink;
    if (!c) return;
    const link = this.linkEdit.trim();
    if (!/^https?:\/\//i.test(link)) {
      this.toast.warning('El link debe empezar por http:// o https://');
      return;
    }
    this.publicandoLink = true;
    try {
      await this.claseVirtualService.publicarLinkHoy(c.horario.id!, link);
      this.clasesHoy.update((l) => l.map((x) => (x === c ? { ...x, linkHoy: link, linkDelDia: true } : x)));
      this.claseLink = null;
      this.toast.success('Link publicado. Tus estudiantes recibirán el aviso.');
    } catch (e: any) {
      this.toast.error(e.message || 'No se pudo publicar el link');
    } finally {
      this.publicandoLink = false;
    }
  }

  verActividades(c: ClaseHoy) {
    this.router.navigate(['/actividades'], { queryParams: { asignatura: c.asignatura.id } });
  }

  horaCorta(h: string): string {
    return h.slice(0, 5);
  }

  async loadDocente() {
    this.loadingProfile.set(true);
    try {
      const { data: { user } } = await this.supabaseService.auth.getUser();
      if (!user) {
        this.router.navigate(['/auth/login']);
        return;
      }
      const docente = await this.asignaturasService.getDocenteByUserId(user.id);
      this.docente.set(docente);
    } catch (e) {
      console.error('Error cargando docente:', e);
      this.toast.error('No se pudo cargar la información del perfil');
    } finally {
      this.loadingProfile.set(false);
    }
  }

  async loadAsignaturas() {
    this.loadingAsignaturas.set(true);
    try {
      const docenteId = this.docente()?.id;
      if (!docenteId) {
        this.asignaturas.set([]);
        return;
      }
      const data = await this.asignaturasService.listarPorDocente(docenteId);
      this.asignaturas.set(data);

      const periodosUnicos = [...new Set(data.filter((a) => a.activa).map((a) => a.periodo))].sort().reverse();
      this.periodos.set(periodosUnicos);
      if (periodosUnicos.length > 0 && this.periodoSeleccionado() === 'todos') {
        this.periodoSeleccionado.set(periodosUnicos[0]);
      }
    } catch (e) {
      console.error('Error cargando asignaturas:', e);
      this.asignaturas.set([]);
    } finally {
      this.loadingAsignaturas.set(false);
    }
  }

  setPeriodo(p: string) {
    this.periodoSeleccionado.set(p);
  }

  crearAsignatura() {
    this.router.navigate(['/asignaturas/crear']);
  }

  verAsignatura(a: Asignatura) {
    this.router.navigate(['/asignaturas/detalle', a.id]);
  }

  getIniciales(): string {
    const d = this.docente();
    if (!d) return 'U';
    return `${(d.nombres?.[0] ?? '').toUpperCase()}${(d.apellidos?.[0] ?? '').toUpperCase()}`;
  }

  getNombreCompleto(): string {
    const d = this.docente();
    return d ? `${d.nombres} ${d.apellidos}` : 'Cargando...';
  }

  gradientStyle(color: string | null | undefined) {
    return subjectGradientStyle(color);
  }

  shadowStyle(color: string | null | undefined) {
    return subjectShadowStyle(color);
  }
}
