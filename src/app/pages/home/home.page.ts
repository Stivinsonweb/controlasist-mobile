import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';
import { AsignaturasService, Asignatura } from '../../core/services/asignaturas.service';
import { ToastService } from '../../core/services/toast.service';
import { EduBackgroundComponent } from '../../shared/components/edu-background/edu-background.component';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { SubjectIconComponent } from '../../shared/components/subject-icon/subject-icon.component';
import { subjectGradientStyle, subjectShadowStyle } from '../../shared/utils/subject-theme.util';

@Component({
  selector: 'app-home-docente',
  standalone: true,
  imports: [CommonModule, EduBackgroundComponent, AvatarComponent, SubjectIconComponent],
  templateUrl: './home.page.html',
})
export class HomeDocentePage implements OnInit {
  docente = signal<any>(null);
  asignaturas = signal<Asignatura[]>([]);
  loadingProfile = signal(true);
  loadingAsignaturas = signal(true);

  periodos = signal<string[]>([]);
  periodoSeleccionado = signal<string>('todos');

  asignaturasFiltradas = computed(() => {
    const periodo = this.periodoSeleccionado();
    const lista = this.asignaturas();
    return periodo === 'todos' ? lista : lista.filter((a) => a.periodo === periodo);
  });

  constructor(
    private supabaseService: SupabaseService,
    private asignaturasService: AsignaturasService,
    private router: Router,
    private toast: ToastService
  ) {}

  async ngOnInit() {
    await this.loadAll();
  }

  async loadAll() {
    await this.loadDocente();
    await this.loadAsignaturas();
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

      const periodosUnicos = [...new Set(data.map((a) => a.periodo))].sort().reverse();
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
