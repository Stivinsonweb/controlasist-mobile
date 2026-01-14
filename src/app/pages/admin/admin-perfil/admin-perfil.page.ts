import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonBadge,
  IonAvatar,
  IonButton,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
  IonInput,
  IonItem,
  IonLabel,
  AlertController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline,
  shieldCheckmark,
  mailOutline,
  callOutline,
  businessOutline,
  schoolOutline,
  briefcaseOutline,
  calendarOutline,
  informationCircleOutline,
  alertCircleOutline,
  refreshOutline,
  createOutline,
  saveOutline,
  closeOutline,
  keyOutline,
  checkmarkCircleOutline
} from 'ionicons/icons';
import { SupabaseService } from '../../../services/supabase/supabase.service';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Admin {
  id: string;
  user_id: string;
  email: string;
  nombres: string;
  apellidos: string;
  telefono?: string;
  entidad?: string;
  programa?: string;
  area?: string;
  foto_url?: string;
  created_at: string;
}

@Component({
  selector: 'app-admin-perfil',
  templateUrl: './admin-perfil.page.html',
  styleUrls: ['./admin-perfil.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonBadge,
    IonAvatar,
    IonButton,
    IonRefresher,
    IonRefresherContent,
    IonSkeletonText,
    IonInput,
    IonItem,
    IonLabel,
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class AdminPerfilPage implements OnInit {
  admin: Admin | null = null;
  loading: boolean = true;
  isEditMode: boolean = false;
  isChangingPassword: boolean = false;

  profileForm!: FormGroup;
  passwordForm!: FormGroup;

  constructor(
    private supabase: SupabaseService,
    private router: Router,
    private fb: FormBuilder,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({
      personOutline,
      shieldCheckmark,
      mailOutline,
      callOutline,
      businessOutline,
      schoolOutline,
      briefcaseOutline,
      calendarOutline,
      informationCircleOutline,
      alertCircleOutline,
      refreshOutline,
      createOutline,
      saveOutline,
      closeOutline,
      keyOutline,
      checkmarkCircleOutline
    });

    this.initForms();
  }

  initForms() {
    this.profileForm = this.fb.group({
      nombres: ['', [Validators.required, Validators.minLength(2)]],
      apellidos: ['', [Validators.required, Validators.minLength(2)]],
      telefono: [''],
      entidad: [''],
      programa: [''],
      area: ['']
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(group: FormGroup) {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  async ngOnInit() {
    await this.loadAdminInfo();
  }

  async ionViewWillEnter() {
    await this.loadAdminInfo();
  }

  async loadAdminInfo() {
    this.loading = true;
    try {
      const { data: { user } } = await this.supabase.auth.getUser();

      if (!user) {
        console.error('❌ No hay usuario autenticado');
        this.router.navigate(['/auth/login']);
        return;
      }

      const { data: adminData, error } = await this.supabase
        .from('administradores')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      this.admin = adminData;
      this.populateForm();
      console.log('✅ Perfil de administrador cargado:', this.admin);
    } catch (error) {
      console.error('❌ Error cargando perfil del administrador:', error);
      this.admin = null;
    } finally {
      this.loading = false;
    }
  }

  populateForm() {
    if (this.admin) {
      this.profileForm.patchValue({
        nombres: this.admin.nombres,
        apellidos: this.admin.apellidos,
        telefono: this.admin.telefono || '',
        entidad: this.admin.entidad || '',
        programa: this.admin.programa || '',
        area: this.admin.area || ''
      });
    }
  }

  toggleEditMode() {
    this.isEditMode = !this.isEditMode;
    if (!this.isEditMode) {
      this.populateForm(); // Restaurar valores originales
    }
  }

  togglePasswordChange() {
    this.isChangingPassword = !this.isChangingPassword;
    if (!this.isChangingPassword) {
      this.passwordForm.reset();
    }
  }

  async saveProfile() {
    if (this.profileForm.invalid || !this.admin) {
      await this.showToast('Por favor completa todos los campos requeridos', 'warning');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Confirmar cambios',
      message: '¿Estás seguro de actualizar tu perfil?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Guardar',
          role: 'confirm',
          handler: async () => {
            await this.updateProfile();
          }
        }
      ]
    });

    await alert.present();
  }

  async updateProfile() {
    try {
      const formData = this.profileForm.value;

      const { error } = await this.supabase
        .from('administradores')
        .update({
          nombres: formData.nombres,
          apellidos: formData.apellidos,
          telefono: formData.telefono || null,
          entidad: formData.entidad || null,
          programa: formData.programa || null,
          area: formData.area || null
        })
        .eq('id', this.admin!.id);

      if (error) throw error;

      await this.showToast('Perfil actualizado exitosamente', 'success');
      this.isEditMode = false;
      await this.loadAdminInfo();
    } catch (error) {
      console.error('❌ Error actualizando perfil:', error);
      await this.showToast('Error al actualizar el perfil', 'danger');
    }
  }

  async changePassword() {
    if (this.passwordForm.invalid) {
      await this.showToast('Por favor completa todos los campos correctamente', 'warning');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Cambiar contraseña',
      message: '¿Estás seguro de cambiar tu contraseña?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Cambiar',
          role: 'confirm',
          handler: async () => {
            await this.updatePassword();
          }
        }
      ]
    });

    await alert.present();
  }

  async updatePassword() {
    try {
      const { newPassword } = this.passwordForm.value;

      const { error } = await this.supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      await this.showToast('Contraseña actualizada exitosamente', 'success');
      this.isChangingPassword = false;
      this.passwordForm.reset();
    } catch (error: any) {
      console.error('❌ Error cambiando contraseña:', error);
      await this.showToast(error.message || 'Error al cambiar la contraseña', 'danger');
    }
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color
    });
    await toast.present();
  }

  async handleRefresh(event: any) {
    await this.loadAdminInfo();
    event.target.complete();
  }

  getNombreCompleto(): string {
    if (!this.admin) return '';
    return `${this.admin.nombres} ${this.admin.apellidos}`;
  }

  getAvatarUrl(): string {
    if (this.admin?.foto_url) {
      return this.admin.foto_url;
    }
    if (this.admin) {
      const initials = `${this.admin.nombres.charAt(0)}${this.admin.apellidos.charAt(0)}`;
      return `https://ui-avatars.com/api/?name=${initials}&background=10b981&color=fff&size=200&bold=true&rounded=true`;
    }
    return '';
  }

  formatDate(dateString: string): string {
    try {
      return format(new Date(dateString), "d 'de' MMMM, yyyy", { locale: es });
    } catch {
      return 'Fecha no disponible';
    }
  }
}
