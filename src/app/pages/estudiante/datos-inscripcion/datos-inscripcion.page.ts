import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AsignaturasService, Asignatura } from '../../../core/services/asignaturas.service';
import { EstudiantesPortalService } from '../../../core/services/estudiantes-portal.service';
import { Estudiante } from '../../../core/services/admin.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-datos-inscripcion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './datos-inscripcion.page.html',
})
export class DatosInscripcionPage implements OnInit {
  form!: FormGroup;
  loading = signal(true);
  isSaving = false;
  necesitaDatos = signal(false);
  asignatura = signal<Asignatura | null>(null);

  private estudianteId = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private supabaseService: SupabaseService,
    private asignaturasService: AsignaturasService,
    private portalService: EstudiantesPortalService,
    private toast: ToastService
  ) {}

  async ngOnInit() {
    this.form = this.fb.group({
      tipo_documento: ['CC', [Validators.required]],
      cedula: ['', [Validators.required]],
      telefono: ['', [Validators.required]],
      programa: ['', [Validators.required]],
    });

    const asignaturaId = this.route.snapshot.queryParamMap.get('asignaturaId');
    if (!asignaturaId) {
      this.toast.warning('Primero busca una asignatura con su código de acceso');
      this.router.navigate(['/estudiante/inscribir']);
      return;
    }

    await this.load(asignaturaId);
  }

  async load(asignaturaId: string) {
    this.loading.set(true);
    try {
      const user = await this.supabaseService.getCurrentUser();
      if (!user) {
        this.router.navigate(['/auth/login']);
        return;
      }
      this.estudianteId = user.id;

      const [asignatura, estudiante] = await Promise.all([
        this.asignaturasService.obtenerPorId(asignaturaId),
        this.portalService.obtenerPerfil(user.id),
      ]);
      this.asignatura.set(asignatura);

      const completos = this.portalService.verificarDatosCompletos(estudiante);
      this.necesitaDatos.set(!completos);
      if (!completos) {
        this.form.patchValue({
          tipo_documento: estudiante.tipo_documento || 'CC',
          cedula: estudiante.cedula || '',
          telefono: estudiante.telefono || '',
          programa: estudiante.programa || '',
        });
      }
    } catch (e: any) {
      console.error('Error cargando datos de inscripción:', e);
      this.toast.error('No se pudo cargar la información de la asignatura');
      this.router.navigate(['/estudiante/inscribir']);
    } finally {
      this.loading.set(false);
    }
  }

  async confirmar() {
    if (this.necesitaDatos() && this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.warning('Completa los campos requeridos para continuar');
      return;
    }

    const asignaturaId = this.asignatura()?.id;
    if (!asignaturaId) return;

    this.isSaving = true;
    try {
      if (this.necesitaDatos()) {
        await this.portalService.completarDatos(this.estudianteId, this.form.value);
      }

      const resultado = await this.portalService.crearInscripcion(this.estudianteId, asignaturaId);
      if (resultado === 'ya-inscrito') {
        this.toast.info('Ya estás inscrito en esta asignatura');
      } else if (resultado === 'reactivada') {
        this.toast.success('Te has vuelto a inscribir en la asignatura');
      } else {
        this.toast.success('Inscripción realizada exitosamente');
      }
      this.router.navigate(['/estudiante/home']);
    } catch (e: any) {
      this.toast.error(e.message || 'No se pudo completar la inscripción');
    } finally {
      this.isSaving = false;
    }
  }

  get f() { return this.form.controls; }
}
