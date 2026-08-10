import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AsignaturasService } from '../../../core/services/asignaturas.service';
import { ToastService } from '../../../core/services/toast.service';
import { SubjectIconComponent } from '../../../shared/components/subject-icon/subject-icon.component';
import { SUBJECT_ICONS, DEFAULT_SUBJECT_ICON } from '../../../shared/utils/subject-icons';

@Component({
  selector: 'app-crear-asignatura',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, SubjectIconComponent],
  templateUrl: './crear.page.html',
})
export class CrearAsignaturaPage implements OnInit {
  form!: FormGroup;
  isLoading = false;
  docente: any = null;

  colores = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b'];
  iconos = SUBJECT_ICONS;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private supabaseService: SupabaseService,
    private asignaturasService: AsignaturasService,
    private toast: ToastService
  ) {}

  async ngOnInit() {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      codigo: ['', [Validators.required, Validators.minLength(2)]],
      grupo: ['A', [Validators.required]],
      facultad: [''],
      programa: [''],
      nivel: ['', [Validators.required]],
      periodo: ['', [Validators.required]],
      cds: [''],
      creditos: [3, [Validators.required, Validators.min(1), Validators.max(10)]],
      modalidad: ['Presencial', [Validators.required]],
      aula: [''],
      color: ['#3b82f6', [Validators.required]],
      icono: [DEFAULT_SUBJECT_ICON, [Validators.required]],
      activa: [true],
    });

    const { data: { user } } = await this.supabaseService.auth.getUser();
    if (user) {
      this.docente = await this.asignaturasService.getDocenteByUserId(user.id).catch(() => null);
    }
  }

  setColor(c: string) {
    this.form.patchValue({ color: c });
  }

  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.warning('Revisa los campos requeridos');
      return;
    }
    if (!this.docente?.id) {
      this.toast.error('No se pudo identificar tu perfil de docente');
      return;
    }

    this.isLoading = true;
    try {
      await this.asignaturasService.crear({ ...this.form.value, docente_id: this.docente.id });
      this.toast.success('Asignatura creada exitosamente');
      this.router.navigate(['/home']);
    } catch (e: any) {
      console.error(e);
      this.toast.error(e.message || 'Error al crear la asignatura');
    } finally {
      this.isLoading = false;
    }
  }

  get f() { return this.form.controls; }
}
