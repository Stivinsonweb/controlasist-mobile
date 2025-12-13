import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { 
  IonContent, 
  IonCard, 
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
  LoadingController,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  lockClosed,
  lockClosedOutline, 
  eye, 
  eyeOff, 
  checkmarkDoneOutline,
  checkmarkCircle,
  checkmarkCircleOutline,
  ellipseOutline,
  alertCircle,
  informationCircle,
  arrowBackOutline,
  shieldCheckmark
} from 'ionicons/icons';
import { AuthService } from '../../../services/auth/auth.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.page.html',
  styleUrls: ['./reset-password.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    IonContent,
    IonCard,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonIcon
  ]
})
export class ResetPasswordPage implements OnInit {
  resetForm!: FormGroup;
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private loadingController: LoadingController,
    private alertController: AlertController
  ) {
    addIcons({ 
      lockClosed,
      lockClosedOutline, 
      eye, 
      eyeOff, 
      checkmarkDoneOutline,
      checkmarkCircle,
      checkmarkCircleOutline,
      ellipseOutline,
      alertCircle,
      informationCircle,
      arrowBackOutline,
      shieldCheckmark
    });
  }

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    this.resetForm = this.formBuilder.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  hasUpperCase(value: string): boolean {
    return /[A-Z]/.test(value);
  }

  hasLowerCase(value: string): boolean {
    return /[a-z]/.test(value);
  }

  hasNumber(value: string): boolean {
    return /[0-9]/.test(value);
  }

  async resetPassword() {
    if (this.resetForm.valid) {
      const loading = await this.loadingController.create({
        message: 'Actualizando contraseña...',
        spinner: 'crescent'
      });
      await loading.present();

      try {
        const { password } = this.resetForm.value;
        
        const result = await this.authService.updatePassword(password);
        
        await loading.dismiss();

        if (result.success) {
          const alert = await this.alertController.create({
            header: '✓ Contraseña actualizada',
            message: 'Tu contraseña ha sido actualizada exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña.',
            buttons: [{
              text: 'Ir al login',
              handler: () => {
                this.router.navigate(['/auth/login']);
              }
            }],
            cssClass: 'success-alert'
          });
          await alert.present();
        } else {
          await this.showAlert('Error', result.error || 'No se pudo actualizar la contraseña');
        }
        
      } catch (error: any) {
        await loading.dismiss();
        await this.showAlert('Error', error.message || 'Error al actualizar la contraseña');
      }
    } else {
      if (this.resetForm.hasError('passwordMismatch')) {
        await this.showAlert('Error', 'Las contraseñas no coinciden');
      } else {
        await this.showAlert('Formulario inválido', 'Por favor completa todos los campos correctamente');
      }
    }
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  get password() {
    return this.resetForm.get('password');
  }

  get confirmPassword() {
    return this.resetForm.get('confirmPassword');
  }
}