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
  callOutline,
  call,
  businessOutline,
  business,
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
    IonSpinner
  ]
})
export class RegisterPage implements OnInit {
  registerForm!: FormGroup;
  isLoading = false;
  loadingAvatars = false;
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
      callOutline,
      call,
      businessOutline,
      business,
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
      telefono: ['', [Validators.pattern(/^[0-9]{7,10}$/)]],
      entidad: [''],
      programa: [''],
      area: [''],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  async loadAvatars() {
    this.loadingAvatars = true;

    try {
      console.log('🔄 Intentando cargar avatares desde Supabase Storage...');
      
      // Intentar cargar avatares desde Supabase Storage
      this.avatars = await this.avatarService.getDefaultAvatars();
      
      console.log('✅ Avatares cargados:', this.avatars.length);
      
      // Si no hay avatares o falló, usar los de UI Avatars
      if (this.avatars.length === 0) {
        console.log('⚠️ No hay avatares en Storage, usando UI Avatars');
        this.avatars = this.avatarService.getDefaultAvatarUrls();
      }
      
      this.loadingAvatars = false;
    } catch (error) {
      console.error('❌ Error cargando avatares:', error);
      
      // Usar avatares por defecto de UI Avatars
      this.avatars = this.avatarService.getDefaultAvatarUrls();
      this.loadingAvatars = false;
      
      await this.showToast('Usando avatares por defecto', 'warning');
    }
  }

  // Manejar error de carga de imagen
  onImageError(event: any, index: number) {
    console.log(`❌ Error cargando avatar ${index + 1}, usando fallback`);
    
    // Reemplazar con avatar de UI Avatars
    const colors = ['3b82f6', '10b981', 'f59e0b', 'ef4444', '8b5cf6', 'ec4899', '06b6d4', '84cc16'];
    const color = colors[index % colors.length];
    this.avatars[index] = `https://ui-avatars.com/api/?name=Avatar+${index + 1}&background=${color}&color=fff&size=200&bold=true&rounded=true`;
    
    // Forzar actualización de la vista
    event.target.src = this.avatars[index];
  }

  selectAvatar(index: number) {
    this.selectedAvatarIndex = index;
    console.log('✅ Avatar seleccionado:', index + 1);
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

        console.log('📝 Datos del formulario:', formData);
        console.log('🎨 Avatar seleccionado:', selectedAvatar);

        // Preparar datos para registro
        const registerData = {
          email: formData.email,
          password: formData.password,
          nombres: formData.nombres,
          apellidos: formData.apellidos,
          telefono: formData.telefono || null,
          entidad: formData.entidad || null,
          programa: formData.programa || null,
          area: formData.area || null,
          foto_url: selectedAvatar
        };

        const result = await this.authService.register(registerData);

        await loading.dismiss();

        if (result.success) {
          await this.showSuccessAlert(
            '✓ Cuenta creada exitosamente',
            `Bienvenido ${result.docente?.nombres}. Tu cuenta ha sido creada`
          );
          this.router.navigate(['/auth/login']);
        } else {
          let errorMessage = result.error || 'Error al crear la cuenta';

          if (result.error.includes('already registered') || result.error.includes('already exists')) {
            errorMessage = 'El correo electrónico ya está registrado';
          } else if (result.error.includes('Invalid email')) {
            errorMessage = 'El formato del correo electrónico es inválido';
          }

          await this.showAlert('Error al registrarse', errorMessage);
        }

      } catch (error: any) {
        await loading.dismiss();
        console.error('❌ Error en registro:', error);
        await this.showAlert('Error', error.message || 'Error inesperado al crear la cuenta');
      }
    } else {
      // Validar campos específicos
      if (this.nombres?.hasError('required')) {
        await this.showToast('Los nombres son requeridos', 'warning');
      } else if (this.apellidos?.hasError('required')) {
        await this.showToast('Los apellidos son requeridos', 'warning');
      } else if (this.telefono?.hasError('pattern')) {
        await this.showToast('El teléfono debe tener entre 7 y 10 dígitos', 'warning');
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

  get telefono() {
    return this.registerForm.get('telefono');
  }

  get entidad() {
    return this.registerForm.get('entidad');
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