import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfiguracionAppService } from '../../../core/services/configuracion-app.service';
import { LoginAttemptsService } from '../../../core/services/login-attempts.service';
import { DialogComponent } from '../../../shared/components/dialog/dialog.component';
import { EduBackgroundComponent } from '../../../shared/components/edu-background/edu-background.component';
import { DecorBlobsComponent } from '../../../shared/components/decor-blobs/decor-blobs.component';
import { LogoComponent } from '../../../shared/components/logo/logo.component';
import { InstallPwaButtonComponent } from '../../../shared/components/install-pwa-button/install-pwa-button.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink, DialogComponent, EduBackgroundComponent, DecorBlobsComponent, LogoComponent, InstallPwaButtonComponent],
  templateUrl: './login.page.html',
})
export class LoginPage implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  showPassword = false;
  tipoUsuario: 'docente' | 'estudiante' = 'docente';
  showForgotModal = false;
  recoveryEmail = '';
  isRecovering = false;
  mantenimiento = signal<{ titulo: string; mensaje: string } | null>(null);

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private supabase: SupabaseService,
    private configuracionService: ConfiguracionAppService,
    private loginAttempts: LoginAttemptsService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
    this.verificarDisponibilidad();
    if (this.route.snapshot.queryParamMap.get('forgot') === '1') {
      this.showForgotModal = true;
    }
  }

  private async verificarDisponibilidad() {
    try {
      const config = await this.configuracionService.obtener();
      if (config && (!config.app_activa || !config.permitir_login)) {
        this.mantenimiento.set({
          titulo: (config.mostrar_mensaje && config.titulo_mensaje) || 'ControlAsist está en mantenimiento',
          mensaje: (config.mostrar_mensaje && config.mensaje) || 'El acceso está temporalmente deshabilitado. Intenta de nuevo más tarde.',
        });
      }
    } catch (e) {
      console.error('Error verificando disponibilidad de la app:', e);
    }
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  setTipo(tipo: 'docente' | 'estudiante') {
    this.tipoUsuario = tipo;
  }

  async login() {
    if (this.mantenimiento()) {
      this.toast.error('El acceso está deshabilitado temporalmente');
      return;
    }
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      if (this.email?.hasError('required')) this.toast.warning('El correo electrónico es requerido');
      else if (this.email?.hasError('email')) this.toast.warning('Ingresa un correo electrónico válido');
      else if (this.password?.hasError('required')) this.toast.warning('La contraseña es requerida');
      else if (this.password?.hasError('minlength')) this.toast.warning('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    const { email, password } = this.loginForm.value;

    try {
      const bloqueo = await this.loginAttempts.verificarBloqueo(email);
      if (bloqueo.bloqueado) {
        this.toast.error(`Demasiados intentos fallidos. Intenta de nuevo en ${bloqueo.minutosRestantes} minuto(s).`);
        return;
      }
    } catch (e) {
      console.error('Error verificando bloqueo de login:', e);
    }

    this.isLoading = true;
    try {
      const result = await this.authService.login({ email, password });

      if (result.success && result.profile) {
        await this.loginAttempts.registrarExito(email);
        const nombre = result.profile.nombres || 'Usuario';
        const rol = result.profile.rol;

        if (this.tipoUsuario === 'estudiante') {
          if (rol !== 'estudiante') {
            await this.supabase.auth.signOut();
            this.toast.error('Esta cuenta no es de estudiante. Selecciona "Docente" para iniciar sesión.');
            this.isLoading = false;
            return;
          }
          this.toast.success(`Bienvenido ${nombre}`);
          this.router.navigate(['/estudiante/home']);
        } else {
          if (rol !== 'administrador' && rol !== 'docente') {
            await this.supabase.auth.signOut();
            this.toast.error('Esta cuenta es de estudiante. Selecciona "Estudiante" para iniciar sesión.');
            this.isLoading = false;
            return;
          }
          this.toast.success(`Bienvenido ${nombre}`);
          this.router.navigate([rol === 'administrador' ? '/admin/dashboard' : '/home']);
        }
      } else {
        const bloqueo = await this.loginAttempts.registrarFallo(email);
        if (bloqueo.bloqueado) {
          this.toast.error(`Demasiados intentos fallidos. Tu acceso se bloqueó por ${bloqueo.minutosRestantes} minutos.`);
        } else {
          this.toast.error(result.error || 'Credenciales inválidas');
        }
      }
    } catch (error: any) {
      this.toast.error(error.message || 'Error inesperado al iniciar sesión');
    } finally {
      this.isLoading = false;
    }
  }

  openForgotPassword() {
    this.recoveryEmail = '';
    this.showForgotModal = true;
  }

  async submitForgotPassword() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!this.recoveryEmail || !emailRegex.test(this.recoveryEmail)) {
      this.toast.warning('Ingresa un correo válido');
      return;
    }
    this.isRecovering = true;
    const result = await this.authService.forgotPassword(this.recoveryEmail);
    this.isRecovering = false;
    this.showForgotModal = false;

    if (result.success) {
      this.toast.success(result.message || 'Correo de recuperación enviado');
    } else {
      this.toast.error(result.error || 'No se pudo enviar el correo de recuperación');
    }
  }

  goToRegister() {
    this.router.navigate([this.tipoUsuario === 'estudiante' ? '/auth/registro-estudiante' : '/auth/register']);
  }

  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }
}
