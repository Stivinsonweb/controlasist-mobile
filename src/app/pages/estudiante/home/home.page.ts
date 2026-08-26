import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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

@Component({
  selector: 'app-estudiante-home',
  standalone: true,
  imports: [CommonModule, DialogComponent, EduBackgroundComponent, AvatarComponent, SubjectIconComponent, VerificadoBadgeComponent],
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

  constructor(
    private supabaseService: SupabaseService,
    private asignaturasService: AsignaturasService,
    private portalService: EstudiantesPortalService,
    private router: Router,
    private toast: ToastService
  ) {}

  async ngOnInit() {
    await this.loadAll();
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
    } catch (e: any) {
      console.error('Error cargando inicio de estudiante:', e);
      this.toast.error('No se pudo cargar tu información');
    } finally {
      this.loading.set(false);
    }
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
