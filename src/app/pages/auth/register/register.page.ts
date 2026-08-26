import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfiguracionAppService } from '../../../core/services/configuracion-app.service';
import { AvatarService } from '../../../core/services/avatar.service';
import { EduBackgroundComponent } from '../../../shared/components/edu-background/edu-background.component';
import { DecorBlobsComponent } from '../../../shared/components/decor-blobs/decor-blobs.component';
import { BrandHeaderComponent } from '../../../shared/components/brand-header/brand-header.component';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password && confirmPassword && password !== confirmPassword ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, EduBackgroundComponent, DecorBlobsComponent, BrandHeaderComponent],
  templateUrl: './register.page.html',
})
export class RegisterPage implements OnInit {
  form!: FormGroup;
  isLoading = false;
  showPassword = false;
  registroDeshabilitado = false;

  avataresDisponibles = signal<string[]>([]);
  cargandoAvatares = false;
  avatarSeleccionado = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private configuracionService: ConfiguracionAppService,
    private avatarService: AvatarService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.form = this.fb.group(
      {
        nombres: ['', [Validators.required, Validators.minLength(2)]],
        apellidos: ['', [Validators.required, Validators.minLength(2)]],
        telefono: ['', [Validators.pattern(/^[0-9]{7,10}$/)]],
        entidad: [''],
        programa: [''],
        area: [''],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: passwordsMatchValidator }
    );
    this.configuracionService.obtener()
      .then((config) => { this.registroDeshabilitado = !!config && !config.permitir_registro; })
      .catch((e) => console.error('Error verificando disponibilidad de registro:', e));

    this.cargarAvatares();
  }

  private async cargarAvatares() {
    this.cargandoAvatares = true;
    try {
      this.avataresDisponibles.set(await this.avatarService.getDefaultAvatars('docente'));
    } catch (e) {
      console.error('Error cargando galería de avatares:', e);
    } finally {
      this.cargandoAvatares = false;
    }
  }

  seleccionarAvatar(url: string) {
    this.avatarSeleccionado.set(this.avatarSeleccionado() === url ? null : url);
  }

  togglePassword() { this.showPassword = !this.showPassword; }

  async submit() {
    if (this.registroDeshabilitado) {
      this.toast.error('El registro de nuevas cuentas está deshabilitado temporalmente');
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      if (this.form.hasError('passwordMismatch')) {
        this.toast.warning('Las contraseñas no coinciden');
      } else {
        this.toast.warning('Revisa los campos marcados en rojo');
      }
      return;
    }
    this.isLoading = true;
    const { confirmPassword, ...registerData } = this.form.value;
    const result = await this.authService.register({ ...registerData, foto_url: this.avatarSeleccionado() || undefined });
    this.isLoading = false;

    if (result.success) {
      this.toast.success('Cuenta creada exitosamente. Ya puedes iniciar sesión.');
      this.router.navigate(['/auth/login']);
    } else {
      this.toast.error(result.error || 'Error al crear la cuenta');
    }
  }

  get f() { return this.form.controls; }
}
