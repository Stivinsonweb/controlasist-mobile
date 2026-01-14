<<<<<<< HEAD
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
=======
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonSpinner,
  IonCard,
  IonCardContent,
  IonButtons,
  IonBackButton,
  IonInput,
  IonItem,
  IonLabel
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  pencilOutline,
  checkmarkOutline,
  closeOutline,
  eyeOutline,
  eyeOffOutline,
  lockClosedOutline,
  shieldOutline,
  settingsOutline,
  informationCircleOutline,
  calendarOutline,
  checkmarkCircleOutline,
  callOutline,
  mailOutline
} from 'ionicons/icons';
import { SupabaseService } from '../../../services/supabase/supabase.service';
import { ToastService } from '../../../services/toast.service';

interface AdminData {
  nombres: string;
  apellidos: string;
  email: string;
  telefono?: string;
  rol: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
>>>>>>> 12b5483e3a772962cb6c43c35c1e4be0fc4d057f
}

@Component({
  selector: 'app-admin-perfil',
  templateUrl: './admin-perfil.page.html',
  styleUrls: ['./admin-perfil.page.scss'],
  standalone: true,
  imports: [
<<<<<<< HEAD
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
=======
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonSpinner,
    IonCard,
    IonCardContent,
    IonButtons,
    IonBackButton,
    IonInput,
    IonItem,
    IonLabel
  ]
})
export class AdminPerfilPage implements OnInit {
  admin: AdminData = {
    nombres: '',
    apellidos: '',
    email: '',
    rol: 'administrador',
    telefono: '',
    created_at: '',
    updated_at: ''
  };

  systemInfo = {
    totalDocentes: 0,
    totalEstudiantes: 0,
    totalAdministradores: 0,
    ultimoAcceso: 'Hoy'
  };

  loading = false;
  isEditingProfile = false;
  isChangingPassword = false;

  editForm = {
    nombres: '',
    apellidos: '',
    telefono: ''
  };

  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(
    private supabaseService: SupabaseService,
    private toastService: ToastService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({
      pencilOutline,
      checkmarkOutline,
      closeOutline,
      eyeOutline,
      eyeOffOutline,
      lockClosedOutline,
      shieldOutline,
      settingsOutline,
      informationCircleOutline,
      calendarOutline,
      checkmarkCircleOutline,
      callOutline,
      mailOutline
    });
  }

  ngOnInit() {
    console.log('✅ Admin Perfil inicializado');
    this.initializeProfile();
  }

  async initializeProfile() {
    try {
      this.loading = true;
      console.log('🔄 Iniciando carga de perfil...');

      // Esperar a que el usuario esté autenticado
      const user = await this.supabaseService.getCurrentUser();
      
      if (!user) {
        console.error('❌ Usuario no autenticado');
        this.toastService.showError('Usuario no autenticado');
        this.loading = false;
        return;
      }

      console.log('👤 Usuario autenticado, ID:', user.id);

      // Cargar datos en paralelo
      await Promise.all([
        this.loadAdminProfile(user.id),
        this.loadSystemInfo()
      ]);

      console.log('✅ Perfil cargado exitosamente');
    } catch (error) {
      console.error('❌ Error inicializando perfil:', error);
      this.toastService.showError('Error al cargar el perfil');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  async loadAdminProfile(userId: string) {
    try {
      console.log('🔄 Consultando datos del administrador...');

      const { data: adminData, error } = await this.supabaseService.supabase
        .from('administradores')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('❌ Error en query:', error.message);
        throw error;
      }

      if (adminData) {
        console.log('✅ Datos recibidos:', adminData);
        
        this.admin = {
          nombres: adminData.nombres || '',
          apellidos: adminData.apellidos || '',
          email: adminData.email || '',
          rol: adminData.rol || 'administrador',
          telefono: adminData.telefono || '',
          created_at: adminData.created_at || '',
          updated_at: adminData.updated_at || '',
          user_id: adminData.user_id || ''
        };

        this.editForm = {
          nombres: this.admin.nombres,
          apellidos: this.admin.apellidos,
          telefono: this.admin.telefono || ''
        };

        console.log('✅ Admin data asignado:', this.admin);
        this.cdr.markForCheck();
      } else {
        console.warn('⚠️ No se encontraron datos del administrador');
      }
    } catch (error) {
      console.error('❌ Error cargando perfil:', error);
    }
  }

  async loadSystemInfo() {
    try {
      console.log('🔄 Cargando información del sistema...');

      const { count: docentes, error: errorDocentes } = await this.supabaseService.supabase
        .from('docentes')
        .select('id', { count: 'exact', head: true });

      const { count: estudiantes, error: errorEstudiantes } = await this.supabaseService.supabase
        .from('estudiantes')
        .select('id', { count: 'exact', head: true });

      const { count: administradores, error: errorAdministradores } = await this.supabaseService.supabase
        .from('administradores')
        .select('id', { count: 'exact', head: true });

      if (errorDocentes) console.error('❌ Error docentes:', errorDocentes);
      if (errorEstudiantes) console.error('❌ Error estudiantes:', errorEstudiantes);
      if (errorAdministradores) console.error('❌ Error administradores:', errorAdministradores);

      this.systemInfo = {
        totalDocentes: docentes || 0,
        totalEstudiantes: estudiantes || 0,
        totalAdministradores: administradores || 0,
        ultimoAcceso: 'Hoy'
      };

      console.log('✅ Sistema info cargado:', this.systemInfo);
      this.cdr.markForCheck();
    } catch (error) {
      console.error('❌ Error cargando info del sistema:', error);
    }
  }

  // Editar perfil
  startEditProfile() {
    this.isEditingProfile = true;
    this.editForm = { ...this.editForm };
  }

  cancelEditProfile() {
    this.isEditingProfile = false;
  }

  async saveProfileChanges() {
    try {
      if (!this.editForm.nombres || !this.editForm.apellidos) {
        this.toastService.showError('Nombres y apellidos son requeridos');
        return;
      }

      this.loading = true;
      const user = await this.supabaseService.getCurrentUser();

      if (!user) {
        this.toastService.showError('Usuario no autenticado');
        return;
      }

      const { error } = await this.supabaseService.supabase
        .from('administradores')
        .update({
          nombres: this.editForm.nombres,
          apellidos: this.editForm.apellidos,
          telefono: this.editForm.telefono,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      this.admin = { ...this.admin, ...this.editForm };
      this.isEditingProfile = false;
      this.toastService.showSuccess('Perfil actualizado correctamente');
      console.log('✅ Perfil actualizado');
      this.cdr.markForCheck();
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      this.toastService.showError('Error al actualizar el perfil');
>>>>>>> 12b5483e3a772962cb6c43c35c1e4be0fc4d057f
    } finally {
      this.loading = false;
    }
  }

<<<<<<< HEAD
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
=======
  // Cambiar contraseña
  startChangePassword() {
    this.isChangingPassword = true;
    this.passwordForm = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
  }

  cancelChangePassword() {
    this.isChangingPassword = false;
  }

  async changePassword() {
    if (!this.passwordForm.newPassword || !this.passwordForm.confirmPassword) {
      this.toastService.showError('Todos los campos son requeridos');
      return;
    }

    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.toastService.showError('Las contraseñas no coinciden');
      return;
    }

    if (this.passwordForm.newPassword.length < 6) {
      this.toastService.showError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      this.loading = true;

      const { error } = await this.supabaseService.supabase.auth.updateUser({
        password: this.passwordForm.newPassword
>>>>>>> 12b5483e3a772962cb6c43c35c1e4be0fc4d057f
      });

      if (error) throw error;

<<<<<<< HEAD
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
=======
      this.isChangingPassword = false;
      this.passwordForm = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      };
      this.toastService.showSuccess('Contraseña actualizada correctamente');
      console.log('✅ Contraseña actualizada');
      this.cdr.markForCheck();
    } catch (error) {
      console.error('Error actualizando contraseña:', error);
      this.toastService.showError('Error al actualizar la contraseña');
    } finally {
      this.loading = false;
    }
  }

  togglePasswordVisibility(field: 'current' | 'new' | 'confirm') {
    if (field === 'current') {
      this.showCurrentPassword = !this.showCurrentPassword;
    } else if (field === 'new') {
      this.showNewPassword = !this.showNewPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  getInitials(nombre: string): string {
    if (!nombre) return 'A';
    return nombre
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  formatDate(date: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
>>>>>>> 12b5483e3a772962cb6c43c35c1e4be0fc4d057f
