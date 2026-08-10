import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { DecorBlobsComponent } from '../../../shared/components/decor-blobs/decor-blobs.component';
import { LogoComponent } from '../../../shared/components/logo/logo.component';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password && confirmPassword && password !== confirmPassword ? { passwordMismatch: true } : null;
}

type RecoveryState = 'checking' | 'ready' | 'invalid';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DecorBlobsComponent, LogoComponent],
  templateUrl: './reset-password.page.html',
})
export class ResetPasswordPage implements OnInit, OnDestroy {
  form!: FormGroup;
  isLoading = false;
  showPassword = false;
  done = false;
  recoveryState: RecoveryState = 'checking';
  private authSub: { unsubscribe: () => void } | null = null;
  private checkTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private toast: ToastService,
    private supabaseService: SupabaseService
  ) {}

  ngOnInit() {
    this.form = this.fb.group(
      {
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: passwordsMatchValidator }
    );

    this.checkRecoverySession();
  }

  private checkRecoverySession() {
    // Supabase agrega el error como fragmento de URL cuando el link ya expiró o
    // fue usado antes (ej: #error=access_denied&error_code=otp_expired).
    const hash = window.location.hash?.replace(/^#/, '');
    const hashParams = new URLSearchParams(hash);
    if (hashParams.get('error') || hashParams.get('error_code')) {
      this.recoveryState = 'invalid';
      return;
    }

    const { data } = this.supabaseService.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        this.recoveryState = 'ready';
        if (this.checkTimeout) clearTimeout(this.checkTimeout);
      }
    });
    this.authSub = data.subscription;

    // Puede que la sesión de recuperación ya se haya establecido antes de que nos
    // suscribiéramos (detectSessionInUrl corre apenas se crea el cliente).
    this.supabaseService.getSession().then((session) => {
      if (session && this.recoveryState === 'checking') {
        this.recoveryState = 'ready';
      }
    });

    // Si tras unos segundos no hay ni sesión ni evento de recuperación, el link no
    // trajo tokens válidos (ej: alguien entró directo a la URL sin pasar por el correo).
    this.checkTimeout = setTimeout(() => {
      if (this.recoveryState === 'checking') {
        this.recoveryState = 'invalid';
      }
    }, 4000);
  }

  ngOnDestroy() {
    this.authSub?.unsubscribe();
    if (this.checkTimeout) clearTimeout(this.checkTimeout);
  }

  solicitarNuevoLink() {
    this.router.navigate(['/auth/login'], { queryParams: { forgot: '1' } });
  }

  togglePassword() { this.showPassword = !this.showPassword; }

  get hasUpperCase() { return /[A-Z]/.test(this.password?.value || ''); }
  get hasLowerCase() { return /[a-z]/.test(this.password?.value || ''); }
  get hasNumber() { return /[0-9]/.test(this.password?.value || ''); }

  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      if (this.form.hasError('passwordMismatch')) {
        this.toast.warning('Las contraseñas no coinciden');
      } else {
        this.toast.warning('La contraseña debe tener al menos 8 caracteres');
      }
      return;
    }
    this.isLoading = true;
    const result = await this.authService.updatePassword(this.password?.value);
    this.isLoading = false;

    if (result.success) {
      this.done = true;
      this.toast.success(result.message || 'Contraseña actualizada exitosamente');
    } else {
      this.toast.error(result.error || 'No se pudo actualizar la contraseña');
    }
  }

  irAlLogin() {
    this.router.navigate(['/auth/login']);
  }

  get password() { return this.form.get('password'); }
  get confirmPassword() { return this.form.get('confirmPassword'); }
}
