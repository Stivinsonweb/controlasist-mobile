import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AuthService } from '../../../core/services/auth.service';
import { AdminService } from '../../../core/services/admin.service';
import { AvatarService } from '../../../core/services/avatar.service';
import { ToastService } from '../../../core/services/toast.service';
import { DialogComponent } from '../../../shared/components/dialog/dialog.component';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { AccentThemeService } from '../../../core/services/accent-theme.service';
import { ACCENT_PALETTES } from '../../../shared/utils/subject-theme.util';
import { NotificacionesPushToggleComponent } from '../../../shared/components/notificaciones-push-toggle/notificaciones-push-toggle.component';
import { VerificadoBadgeComponent } from '../../../shared/components/verificado-badge/verificado-badge.component';
import { VerificacionDocenteService, SolicitudVerificacion } from '../../../core/services/verificacion-docente.service';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password && confirmPassword && password !== confirmPassword ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-docente-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DialogComponent, AvatarComponent, NotificacionesPushToggleComponent, VerificadoBadgeComponent],
  templateUrl: './perfil.page.html',
})
export class DocentePerfilPage implements OnInit {
  form!: FormGroup;
  passwordForm!: FormGroup;
  loading = true;
  isSaving = false;
  isChangingPassword = false;
  showPassword = false;
  email = '';
  fotoUrl: string | null = null;
  nombres = '';
  apellidos = '';
  private docenteId = '';
  /** auth.uid() — distinto de docenteId (la PK de la fila `docentes`). Lo necesita push_subscriptions. */
  authUserId = '';

  showAvatarPicker = false;
  avataresDisponibles = signal<string[]>([]);
  cargandoAvatares = false;
  subiendoAvatar = false;

  paletas = ACCENT_PALETTES;
  temaSeleccionado = signal('emerald-teal');
  guardandoTema = signal(false);

  verificado = signal(false);
  solicitudVerificacion = signal<SolicitudVerificacion | null>(null);
  enviandoSolicitudVerificacion = signal(false);

  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService,
    private authService: AuthService,
    private adminService: AdminService,
    private avatarService: AvatarService,
    private toast: ToastService,
    private accentTheme: AccentThemeService,
    private verificacionService: VerificacionDocenteService
  ) {}

  async ngOnInit() {
    this.form = this.fb.group({
      nombres: ['', [Validators.required, Validators.minLength(2)]],
      apellidos: ['', [Validators.required, Validators.minLength(2)]],
      telefono: [''],
      entidad: [''],
      programa: [''],
      area: [''],
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
      if (!perfil) throw new Error('No se encontró el perfil de docente');
      this.docenteId = perfil.id;
      this.authUserId = user.id;
      this.verificado.set(!!perfil.verificado);
      this.verificacionService
        .misSolicitudes(perfil.id)
        .then((solicitudes) => this.solicitudVerificacion.set(solicitudes.find((s) => s.estado === 'pendiente') || null))
        .catch((e) => console.error('Error cargando solicitud de verificación:', e));
      this.email = perfil.email;
      this.fotoUrl = perfil.foto_url || null;
      this.nombres = perfil.nombres;
      this.apellidos = perfil.apellidos;
      this.temaSeleccionado.set(perfil.tema_acento || 'emerald-teal');
      this.form.patchValue({
        nombres: perfil.nombres,
        apellidos: perfil.apellidos,
        telefono: perfil.telefono,
        entidad: perfil.entidad,
        programa: perfil.programa,
        area: perfil.area,
      });
    } catch (e: any) {
      console.error('Error cargando perfil de docente:', e);
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
      await this.adminService.actualizarPerfilDocente(this.docenteId, this.form.value);
      await this.authService.resolveProfile(this.authUserId);
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

  async elegirTema(id: string) {
    if (id === this.temaSeleccionado() || this.guardandoTema()) return;
    const anterior = this.temaSeleccionado();
    this.temaSeleccionado.set(id);
    this.accentTheme.apply(id);
    this.guardandoTema.set(true);
    try {
      await this.adminService.actualizarTemaDocente(this.docenteId, id);
      await this.authService.resolveProfile(this.authUserId);
      this.toast.success('Tema de acento actualizado');
    } catch (e: any) {
      this.temaSeleccionado.set(anterior);
      this.accentTheme.apply(anterior);
      this.toast.error(e.message || 'No se pudo actualizar el tema');
    } finally {
      this.guardandoTema.set(false);
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
        this.avataresDisponibles.set(await this.avatarService.getDefaultAvatars('docente'));
      } catch (e) {
        console.error('Error cargando galería de avatares:', e);
      } finally {
        this.cargandoAvatares = false;
      }
    }
  }

  async seleccionarAvatarPreset(url: string) {
    try {
      await this.adminService.actualizarFotoDocente(this.docenteId, url);
      await this.authService.resolveProfile(this.authUserId);
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
      const url = await this.avatarService.subirAvatar(file, this.docenteId, 'docente');
      await this.adminService.actualizarFotoDocente(this.docenteId, url);
      await this.authService.resolveProfile(this.authUserId);
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

  async solicitarVerificacion() {
    this.enviandoSolicitudVerificacion.set(true);
    try {
      await this.verificacionService.solicitar(this.docenteId);
      this.solicitudVerificacion.set(await this.verificacionService.misSolicitudes(this.docenteId).then((s) => s.find((x) => x.estado === 'pendiente') || null));
      this.toast.success('Solicitud de verificación enviada. Un administrador la revisará pronto.');
    } catch (e: any) {
      this.toast.error(e.message || 'No se pudo enviar la solicitud');
    } finally {
      this.enviandoSolicitudVerificacion.set(false);
    }
  }
}
