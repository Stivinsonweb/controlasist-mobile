import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AuthService } from '../../../core/services/auth.service';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password && confirmPassword && password !== confirmPassword ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-admin-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-perfil.page.html',
})
export class AdminPerfilPage implements OnInit {
  form!: FormGroup;
  passwordForm!: FormGroup;
  loading = true;
  isSaving = false;
  isChangingPassword = false;
  showPassword = false;
  email = '';
  private adminId = '';

  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService,
    private authService: AuthService,
    private adminService: AdminService,
    private toast: ToastService
  ) {}

  async ngOnInit() {
    this.form = this.fb.group({
      nombres: ['', [Validators.required, Validators.minLength(2)]],
      apellidos: ['', [Validators.required, Validators.minLength(2)]],
    });

    this.passwordForm = this.fb.group(
      {
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: passwordsMatchValidator }
    );

    await this.load();
  }

  async load() {
    this.loading = true;
    try {
      const user = await this.supabaseService.getCurrentUser();
      if (!user) return;
      const perfil = await this.authService.resolveProfile(user.id);
      if (!perfil) throw new Error('No se encontró el perfil de administrador');
      this.adminId = perfil.id;
      this.email = perfil.email;
      this.form.patchValue({ nombres: perfil.nombres, apellidos: perfil.apellidos });
    } catch (e: any) {
      console.error('Error cargando perfil de administrador:', e);
      this.toast.error('No se pudo cargar tu perfil');
    } finally {
      this.loading = false;
    }
  }

  async guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.warning('Revisa los campos marcados en rojo');
      return;
    }
    this.isSaving = true;
    try {
      await this.adminService.actualizarPerfilAdmin(this.adminId, this.form.value);
      this.toast.success('Perfil actualizado exitosamente');
    } catch (e: any) {
      this.toast.error(e.message || 'No se pudo actualizar el perfil');
    } finally {
      this.isSaving = false;
    }
  }

  togglePassword() { this.showPassword = !this.showPassword; }

  async cambiarPassword() {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      if (this.passwordForm.hasError('passwordMismatch')) {
        this.toast.warning('Las contraseñas no coinciden');
      } else {
        this.toast.warning('La contraseña debe tener al menos 8 caracteres');
      }
      return;
    }
    this.isChangingPassword = true;
    const result = await this.authService.updatePassword(this.passwordForm.get('password')?.value);
    this.isChangingPassword = false;

    if (result.success) {
      this.toast.success(result.message || 'Contraseña actualizada exitosamente');
      this.passwordForm.reset();
    } else {
      this.toast.error(result.error || 'No se pudo actualizar la contraseña');
    }
  }

  get f() { return this.form.controls; }
  get pf() { return this.passwordForm.controls; }
}
