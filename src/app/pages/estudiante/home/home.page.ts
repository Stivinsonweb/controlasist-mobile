import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AsignaturasService, Horario, DIAS_SEMANA } from '../../../core/services/asignaturas.service';
import { EstudiantesPortalService, AsignaturaConDocente } from '../../../core/services/estudiantes-portal.service';
import { Estudiante } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { DialogComponent } from '../../../shared/components/dialog/dialog.component';
import { EduBackgroundComponent } from '../../../shared/components/edu-background/edu-background.component';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { SubjectIconComponent } from '../../../shared/components/subject-icon/subject-icon.component';
import { VerificadoBadgeComponent } from '../../../shared/components/verificado-badge/verificado-badge.component';
import { subjectGradientStyle, subjectShadowStyle } from '../../../shared/utils/subject-theme.util';
import { ClaseVirtualService, esAsignaturaVirtual } from '../../../core/services/clase-virtual.service';
import { fechaLocalISO } from '../../../shared/utils/fecha.util';
import { agruparPorDia, horaCorta as horaCortaUtil, DiaConHorarios } from '../../../shared/utils/horario.util';

/** Clase de la semana del estudiante: el horario con su asignatura. */
interface ClaseSemana extends Horario {
  asignatura: AsignaturaConDocente;
}

/** Clase virtual de hoy del estudiante, con su link y si ya registró su ingreso. */
interface ClaseVirtualHoy {
  horario: Horario;
  asignatura: AsignaturaConDocente;
  link: string | null;
  ingreso: 'presente' | 'tarde' | null;
  uniendo: boolean;
}

@Component({
  selector: 'app-estudiante-home',
  standalone: true,
  imports: [CommonModule, RouterLink, DialogComponent, EduBackgroundComponent, AvatarComponent, SubjectIconComponent, VerificadoBadgeComponent],
  templateUrl: './home.page.html',
})
export class EstudianteHomePage implements OnInit {
  perfil = signal<Estudiante | null>(null);
  asignaturas = signal<AsignaturaConDocente[]>([]);
  loading = signal(true);

  seleccionada = signal<AsignaturaConDocente | null>(null);
  horariosSeleccionada = signal<Horario[]>([]);
  loadingDetalle = signal(false);
  showConfirmDesinscribir = false;
  dias = DIAS_SEMANA;

  private estudianteId = '';

  clasesVirtualesHoy = signal<ClaseVirtualHoy[]>([]);
  /** "Mi horario de la semana": todas las clases de sus asignaturas, por día (lunes a domingo). */
  semana = signal<DiaConHorarios<ClaseSemana>[]>([]);
  hoyDia = new Date().getDay();
  /** Horarios de la asignatura abierta en el detalle, agrupados por día. */
  horariosPorDia = computed(() => agruparPorDia(this.horariosSeleccionada()));
  private reloj = signal(Date.now());

  constructor(
    private supabaseService: SupabaseService,
    private asignaturasService: AsignaturasService,
    private portalService: EstudiantesPortalService,
    private claseVirtualService: ClaseVirtualService,
    private router: Router,
    private toast: ToastService
  ) {}

  async ngOnInit() {
    await this.loadAll();
    // Para que el botón "Unirme" se habilite solo cuando llegue la hora de la clase.
    setInterval(() => this.reloj.set(Date.now()), 30_000);
  }

  async loadAll() {
    this.loading.set(true);
    try {
      const user = await this.supabaseService.getCurrentUser();
      if (!user) {
        this.router.navigate(['/auth/login']);
        return;
      }
      this.estudianteId = user.id;
      const [perfil, asignaturas] = await Promise.all([
        this.portalService.obtenerPerfil(user.id),
        this.portalService.misAsignaturas(user.id),
      ]);
      this.perfil.set(perfil);
      this.asignaturas.set(asignaturas);
      await Promise.all([this.cargarClasesVirtualesHoy(asignaturas), this.cargarSemana(asignaturas)]);
    } catch (e: any) {
      console.error('Error cargando inicio de estudiante:', e);
      this.toast.error('No se pudo cargar tu información');
    } finally {
      this.loading.set(false);
    }
  }

  private async cargarClasesVirtualesHoy(asignaturas: AsignaturaConDocente[]) {
    try {
      const virtuales = asignaturas.filter((a) => a.activa && esAsignaturaVirtual(a));
      if (virtuales.length === 0) {
        this.clasesVirtualesHoy.set([]);
        return;
      }
      const hoy = fechaLocalISO();
      const dia = new Date().getDay();
      const horarios = (await this.asignaturasService.listarHorariosDeAsignaturas(virtuales.map((a) => a.id))).filter(
        (h) => h.dia_semana === dia && (!h.fecha_clase || h.fecha_clase === hoy)
      );
      const ids = horarios.map((h) => h.id!);
      const [links, ingresos] = await Promise.all([this.claseVirtualService.linksDelDia(ids, hoy), this.claseVirtualService.ingresos(ids, hoy)]);
      this.clasesVirtualesHoy.set(
        horarios
          .map((h) => {
            const asignatura = virtuales.find((a) => a.id === h.asignatura_id)!;
            return {
              horario: h,
              asignatura,
              link: links.find((l) => l.horario_id === h.id)?.link || asignatura.link_clase || null,
              ingreso: ingresos.find((i) => i.horario_id === h.id)?.estado ?? null,
              uniendo: false,
            };
          })
          .sort((a, b) => a.horario.hora_inicio.localeCompare(b.horario.hora_inicio))
      );
    } catch (e) {
      console.error('Error cargando clases virtuales de hoy:', e);
      this.clasesVirtualesHoy.set([]);
    }
  }

  private async cargarSemana(asignaturas: AsignaturaConDocente[]) {
    try {
      const activas = asignaturas.filter((a) => a.activa);
      const hoy = fechaLocalISO();
      const horarios = await this.asignaturasService.listarHorariosDeAsignaturas(activas.map((a) => a.id));
      const clases: ClaseSemana[] = horarios
        // Las sesiones de una sola fecha solo se muestran si aún no han pasado.
        .filter((h) => !h.fecha_clase || h.fecha_clase >= hoy)
        .map((h) => ({ ...h, asignatura: activas.find((a) => a.id === h.asignatura_id)! }))
        .filter((c) => !!c.asignatura);
      this.semana.set(agruparPorDia(clases));
    } catch (e) {
      console.error('Error cargando el horario de la semana:', e);
      this.semana.set([]);
    }
  }

  /** "Solo el 24 oct" para sesiones de una sola fecha. */
  fechaUnica(h: Horario): string | null {
    if (!h.fecha_clase) return null;
    return 'Solo el ' + new Date(h.fecha_clase + 'T00:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
  }

  private minutos(hhmm: string) {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  }

  /** 'antes' (más de 15 min para empezar), 'abierta' (se puede entrar y cuenta), 'terminada'. */
  momentoClase(c: ClaseVirtualHoy): 'antes' | 'abierta' | 'terminada' {
    const d = new Date(this.reloj());
    const ahora = d.getHours() * 60 + d.getMinutes();
    if (ahora < this.minutos(c.horario.hora_inicio) - 15) return 'antes';
    if (ahora > this.minutos(c.horario.hora_fin)) return 'terminada';
    return 'abierta';
  }

  horaCorta(h: string) {
    return horaCortaUtil(h);
  }

  /** Abre la reunión y, si está dentro del horario, registra la asistencia. */
  async unirme(c: ClaseVirtualHoy) {
    // La pestaña se abre antes de esperar al servidor para que el navegador no la bloquee.
    const ventana = window.open('', '_blank');
    c.uniendo = true;
    try {
      const r = await this.claseVirtualService.unirse(c.horario.id!);
      if (!r.link) {
        ventana?.close();
        this.toast.warning('Tu docente aún no ha publicado el link de esta clase');
        return;
      }
      if (ventana) ventana.location.href = r.link;
      else window.location.href = r.link;
      if (r.resultado === 'marcado' || r.resultado === 'ya-marcado') {
        c.ingreso = r.estado ?? 'presente';
        this.clasesVirtualesHoy.update((l) => [...l]);
        if (r.resultado === 'marcado') this.toast.success(r.estado === 'tarde' ? 'Ingreso registrado (llegaste tarde)' : 'Asistencia registrada');
      } else if (r.resultado === 'fuera-de-horario') {
        this.toast.info('Fuera del horario de la clase: el ingreso no cuenta como asistencia');
      } else if (r.resultado === 'cancelada') {
        this.toast.info('Esta clase fue cancelada o aplazada hoy');
      }
    } catch (e: any) {
      ventana?.close();
      this.toast.error(e.message || 'No se pudo abrir la clase');
    } finally {
      c.uniendo = false;
    }
  }

  /** Desde el detalle de la asignatura: si hoy hay clase se registra el ingreso; si no, solo abre el link. */
  async unirmeDesdeDetalle(a: AsignaturaConDocente) {
    const deHoy = this.clasesVirtualesHoy().find((c) => c.asignatura.id === a.id && this.momentoClase(c) === 'abierta');
    if (deHoy) return this.unirme(deHoy);
    if (a.link_clase) window.open(a.link_clase, '_blank', 'noopener');
  }

  async verAsignatura(a: AsignaturaConDocente) {
    this.seleccionada.set(a);
    this.loadingDetalle.set(true);
    try {
      const horarios = await this.asignaturasService.listarHorarios(a.id);
      this.horariosSeleccionada.set(horarios);
    } catch (e) {
      console.error('Error cargando horarios:', e);
      this.horariosSeleccionada.set([]);
    } finally {
      this.loadingDetalle.set(false);
    }
  }

  cerrarDetalle() {
    this.seleccionada.set(null);
    this.horariosSeleccionada.set([]);
    this.showConfirmDesinscribir = false;
  }

  async confirmarDesinscripcion() {
    const a = this.seleccionada();
    if (!a) return;
    try {
      await this.portalService.desinscribirse(this.estudianteId, a.id);
      this.toast.success('Te has desinscrito de la asignatura');
      this.cerrarDetalle();
      await this.loadAll();
    } catch (e: any) {
      this.toast.error(e.message || 'No se pudo completar la desinscripción');
    }
  }

  irAInscribir() {
    this.router.navigate(['/estudiante/inscribir']);
  }

  irAPerfil() {
    this.router.navigate(['/estudiante/perfil']);
  }

  horarioLabel(h: Horario) {
    return `${this.dias[h.dia_semana] ?? '—'} · ${h.hora_inicio} - ${h.hora_fin}${h.aula ? ' · ' + h.aula : ''}`;
  }

  getIniciales(): string {
    const p = this.perfil();
    if (!p) return 'U';
    return `${(p.nombres?.[0] ?? '').toUpperCase()}${(p.apellidos?.[0] ?? '').toUpperCase()}`;
  }

  getNombreCompleto(): string {
    const p = this.perfil();
    return p ? `${p.nombres} ${p.apellidos}` : 'Cargando...';
  }

  gradientStyle(color: string | null | undefined) {
    return subjectGradientStyle(color);
  }

  shadowStyle(color: string | null | undefined) {
    return subjectShadowStyle(color);
  }
}
