import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AsignaturasService } from '../../../core/services/asignaturas.service';
import { ToastService } from '../../../core/services/toast.service';
import { SubjectIconComponent } from '../../../shared/components/subject-icon/subject-icon.component';
import { SUBJECT_ICONS } from '../../../shared/utils/subject-icons';

@Component({
  selector: 'app-editar-asignatura',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, SubjectIconComponent],
  templateUrl: './editar.page.html',
})
export class EditarAsignaturaPage implements OnInit {
  form!: FormGroup;
  isLoading = false;
  isSaving = false;
  asignaturaId = '';

  colores = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b'];
  iconos = SUBJECT_ICONS;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private asignaturasService: AsignaturasService,
    private toast: ToastService
  ) {}

  async ngOnInit() {
    this.asignaturaId = this.route.snapshot.paramMap.get('id') || '';

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
      icono: ['libro', [Validators.required]],
      activa: [true],
    });

    this.isLoading = true;
    try {
      const asignatura = await this.asignaturasService.obtenerPorId(this.asignaturaId);
      this.form.patchValue(asignatura);
    } catch (e) {
      this.toast.error('No se pudo cargar la asignatura');
      this.router.navigate(['/home']);
    } finally {
      this.isLoading = false;
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
    this.isSaving = true;
    try {
      await this.asignaturasService.actualizar(this.asignaturaId, this.form.value);
      this.toast.success('Asignatura actualizada');
      this.router.navigate(['/asignaturas/detalle', this.asignaturaId]);
    } catch (e: any) {
      this.toast.error(e.message || 'Error al actualizar la asignatura');
    } finally {
      this.isSaving = false;
    }
  }

  get f() { return this.form.controls; }
}
