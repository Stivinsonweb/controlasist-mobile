import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';
import { EstudiantesPortalService } from '../../../core/services/estudiantes-portal.service';
import { AuthService } from '../../../core/services/auth.service';
import { AvatarService } from '../../../core/services/avatar.service';
import { ToastService } from '../../../core/services/toast.service';
import { DialogComponent } from '../../../shared/components/dialog/dialog.component';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password && confirmPassword && password !== confirmPassword ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-estudiante-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DialogComponent, AvatarComponent],
  templateUrl: './perfil.page.html',
})
export class EstudiantePerfilPage implements OnInit {
  form!: FormGroup;
  passwordForm!: FormGroup;
  loading = true;
  isSaving = false;
  isChangingPassword = false;
  showPassword = false;
  fotoUrl: string | null = null;
  nombres = '';
  apellidos = '';
  private estudianteId = '';

  showAvatarPicker = false;
  avataresDisponibles = signal<string[]>([]);
  cargandoAvatares = false;
  subiendoAvatar = false;

  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService,
    private portalService: EstudiantesPortalService,
    private authService: AuthService,
    private avatarService: AvatarService,
    private toast: ToastService
  ) {}

  async ngOnInit() {
    this.form = this.fb.group({
      nombres: ['', [Validators.required, Validators.minLength(2)]],
      apellidos: ['', [Validators.required, Validators.minLength(2)]],
      tipo_documento: ['CC'],
      cedula: [''],
      telefono: [''],
      programa: [''],
      fecha_nacimiento: [''],
      ciudad: [''],
      direccion: [''],
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
      this.estudianteId = user.id;
      const perfil = await this.portalService.obtenerPerfil(user.id);
      this.fotoUrl = perfil.foto_url || null;
      this.nombres = perfil.nombres;
      this.apellidos = perfil.apellidos;
      this.form.patchValue(perfil);
    } catch (e) {
      console.error('Error cargando perfil:', e);
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
      await this.portalService.actualizarPerfil(this.estudianteId, this.form.value);
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

  get iniciales(): string {
    return `${(this.nombres[0] ?? '').toUpperCase()}${(this.apellidos[0] ?? '').toUpperCase()}`;
  }

  async abrirAvatarPicker() {
    this.showAvatarPicker = true;
    if (this.avataresDisponibles().length === 0) {
      this.cargandoAvatares = true;
      try {
        this.avataresDisponibles.set(await this.avatarService.getDefaultAvatars());
      } catch (e) {
        console.error('Error cargando galería de avatares:', e);
      } finally {
        this.cargandoAvatares = false;
      }
    }
  }

  async seleccionarAvatarPreset(url: string) {
    try {
      await this.portalService.actualizarPerfil(this.estudianteId, { foto_url: url });
      this.fotoUrl = url;
      this.showAvatarPicker = false;
      this.toast.success('Foto de perfil actualizada');
    } catch (e: any) {
      this.toast.error(e.message || 'No se pudo actualizar la foto de perfil');
    }
  }

  async subirAvatarPropio(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.subiendoAvatar = true;
    try {
      const url = await this.avatarService.subirAvatar(file, this.estudianteId, 'estudiante');
      await this.portalService.actualizarPerfil(this.estudianteId, { foto_url: url });
      this.fotoUrl = url;
      this.showAvatarPicker = false;
      this.toast.success('Foto de perfil actualizada');
    } catch (e: any) {
      this.toast.error(e.message || 'No se pudo subir la foto');
    } finally {
      this.subiendoAvatar = false;
      input.value = '';
    }
  }
}
