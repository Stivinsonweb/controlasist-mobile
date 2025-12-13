import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, 
  IonCard, 
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  AlertController,
  LoadingController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  personAdd,
  personOutline,
  person,
  cardOutline,
  schoolOutline,
  school,
  briefcaseOutline,
  briefcase,
  mailOutline,
  mail,
  lockClosedOutline,
  lockClosed,
  eye,
  eyeOff,
  checkmarkDoneOutline,
  logInOutline,
  shieldCheckmark,
  alertCircle,
  imageOutline,
  checkmarkCircle
} from 'ionicons/icons';
import { AuthService } from '../../../services/auth/auth.service';
import { AvatarService } from '../../../services/avatar/avatar.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonContent,
    IonCard,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonIcon,
    IonSelect,
    IonSelectOption,
    IonSpinner
  ]
})
export class RegisterPage implements OnInit {
  registerForm!: FormGroup;
  isLoading = false;
  showPassword = false;
  avatars: string[] = [];
  selectedAvatarIndex: number = 0;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private avatarService: AvatarService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {
    addIcons({
      personAdd,
      personOutline,
      person,
      cardOutline,
      schoolOutline,
      school,
      briefcaseOutline,
      briefcase,
      mailOutline,
      mail,
      lockClosedOutline,
      lockClosed,
      eye,
      eyeOff,
      checkmarkDoneOutline,
      logInOutline,
      shieldCheckmark,
      alertCircle,
      imageOutline,
      checkmarkCircle
    });
  }

  async ngOnInit() {
    this.initForm();
    await this.loadAvatars();
  }

  initForm() {
    this.registerForm = this.formBuilder.group({
      nombres: ['', [Validators.required, Validators.minLength(2)]],
      apellidos: ['', [Validators.required, Validators.minLength(2)]],
      tipo_documento: ['CC', Validators.required],
      cedula: ['', [Validators.required, Validators.pattern(/^[0-9]+$/)]],
      programa: [''],
      area: [''],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  async loadAvatars() {
    const loading = await this.loadingController.create({
      message: 'Cargando avatares...',
      spinner: 'crescent',
      duration: 3000
    });
    await loading.present();

    try {
      // Intentar cargar avatares desde Supabase Storage
      this.avatars = await this.avatarService.getDefaultAvatars();
      
      // Si no hay avatares en Storage, usar los de UI Avatars
      if (this.avatars.length === 0) {
        this.avatars = this.avatarService.getDefaultAvatarUrls();
      }
      
      await loading.dismiss();
    } catch (error) {
      await loading.dismiss();
      console.error('Error cargando avatares:', error);
      // Usar avatares por defecto
      this.avatars = this.avatarService.getDefaultAvatarUrls();
    }
  }

  selectAvatar(index: number) {
    this.selectedAvatarIndex = index;
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  getPasswordStrength(): number {
    const password = this.password?.value || '';
    let strength = 0;

    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 10;

    return Math.min(strength, 100);
  }

  getPasswordStrengthClass(): string {
    const strength = this.getPasswordStrength();
    if (strength < 40) return 'weak';
    if (strength < 70) return 'medium';
    return 'strong';
  }

  getPasswordStrengthText(): string {
    const strength = this.getPasswordStrength();
    if (strength < 40) return 'Débil';
    if (strength < 70) return 'Media';
    return 'Fuerte';
  }

  async register() {
    if (this.registerForm.valid) {
      const loading = await this.loadingController.create({
        message: 'Creando cuenta...',
        spinner: 'crescent'
      });
      await loading.present();

      try {
        const formData = this.registerForm.value;
        const selectedAvatar = this.avatars[this.selectedAvatarIndex];

        // Preparar datos para registro
        const registerData = {
          ...formData,
          foto_url: selectedAvatar // Avatar seleccionado
        };

        const result = await this.authService.register(registerData);

        await loading.dismiss();

        if (result.success) {
          await this.showSuccessAlert(
            '✓ Cuenta creada exitosamente',
            `Bienvenido ${result.docente?.nombres}. Tu cuenta ha sido creada. Ahora puedes iniciar sesión.`
          );
          this.router.navigate(['/auth/login']);
        } else {
          // Mensajes de error específicos
          let errorMessage = result.error || 'Error al crear la cuenta';

          if (result.error.includes('already registered') || result.error.includes('already exists')) {
            errorMessage = 'El correo electrónico ya está registrado';
          } else if (result.error.includes('cédula ya está registrada')) {
            errorMessage = 'La cédula ya está registrada en el sistema';
          } else if (result.error.includes('Invalid email')) {
            errorMessage = 'El formato del correo electrónico es inválido';
          }

          await this.showAlert('Error al registrarse', errorMessage);
        }

      } catch (error: any) {
        await loading.dismiss();
        await this.showAlert('Error', error.message || 'Error inesperado al crear la cuenta');
      }
    } else {
      // Validar campos específicos
      if (this.nombres?.hasError('required')) {
        await this.showToast('Los nombres son requeridos', 'warning');
      } else if (this.apellidos?.hasError('required')) {
        await this.showToast('Los apellidos son requeridos', 'warning');
      } else if (this.cedula?.hasError('required')) {
        await this.showToast('La cédula es requerida', 'warning');
      } else if (this.cedula?.hasError('pattern')) {
        await this.showToast('La cédula solo debe contener números', 'warning');
      } else if (this.email?.hasError('required')) {
        await this.showToast('El correo electrónico es requerido', 'warning');
      } else if (this.email?.hasError('email')) {
        await this.showToast('Ingresa un correo electrónico válido', 'warning');
      } else if (this.password?.hasError('required')) {
        await this.showToast('La contraseña es requerida', 'warning');
      } else if (this.password?.hasError('minlength')) {
        await this.showToast('La contraseña debe tener al menos 8 caracteres', 'warning');
      } else {
        await this.showToast('Por favor completa todos los campos requeridos', 'warning');
      }
    }
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK'],
      cssClass: 'custom-alert'
    });
    await alert.present();
  }

  async showSuccessAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: [{
        text: 'Continuar',
        role: 'confirm'
      }],
      cssClass: 'custom-alert success-alert'
    });
    await alert.present();
  }

  async showToast(message: string, color: string = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color,
      cssClass: 'custom-toast'
    });
    await toast.present();
  }

  // Getters para validación
  get nombres() {
    return this.registerForm.get('nombres');
  }

  get apellidos() {
    return this.registerForm.get('apellidos');
  }

  get tipo_documento() {
    return this.registerForm.get('tipo_documento');
  }

  get cedula() {
    return this.registerForm.get('cedula');
  }

  get programa() {
    return this.registerForm.get('programa');
  }

  get area() {
    return this.registerForm.get('area');
  }

  get email() {
    return this.registerForm.get('email');
  }

  get password() {
    return this.registerForm.get('password');
  }
}