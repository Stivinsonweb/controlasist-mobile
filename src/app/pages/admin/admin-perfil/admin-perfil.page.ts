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
  alertCircleOutline,
  settingsOutline,
  informationCircleOutline,
  calendarOutline,
  checkmarkCircleOutline,
  warningOutline,
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
}

@Component({
  selector: 'app-admin-perfil',
  templateUrl: './admin-perfil.page.html',
  styleUrls: ['./admin-perfil.page.scss'],
  standalone: true,
  imports: [
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
  isStoppingAccess = false;

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
      alertCircleOutline,
      settingsOutline,
      informationCircleOutline,
      calendarOutline,
      checkmarkCircleOutline,
      warningOutline,
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
    } finally {
      this.loading = false;
    }
  }

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
      });

      if (error) throw error;

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

  // ============================================================
  // DETENER ACCESO A USUARIOS
  // ============================================================

  startStoppingAccess() {
    console.log('🛑 Abriendo modal de detener acceso...');
    this.isStoppingAccess = true;
    this.cdr.markForCheck();
  }

  cancelStoppingAccess() {
    console.log('❌ Cancelando detención de acceso');
    this.isStoppingAccess = false;
    this.cdr.markForCheck();
  }

  async confirmStopAccess() {
    try {
      this.loading = true;
      console.log('🔄 Confirmando detención de acceso...');

      // Obtener usuario autenticado
      const user = await this.supabaseService.getCurrentUser();

      if (!user) {
        this.toastService.showError('Usuario no autenticado');
        console.error('❌ Usuario no autenticado');
        return;
      }

      console.log('👤 Usuario ID:', user.id);

      // Insertar registro en Supabase
      const { error } = await this.supabaseService.supabase
        .from('app_access_control')
        .insert({
          admin_id: user.id,
          access_enabled: false,
          allowed_roles: ['administrador'],
          stopped_at: new Date().toISOString(),
          stopped_by: user.id,
          reason: 'Acceso detenido por administrador'
        });

      if (error) {
        console.error('❌ Error en Supabase:', error);
        throw error;
      }

      console.log('✅ Acceso detenido exitosamente');

      // Cerrar modal
      this.isStoppingAccess = false;

      // Mostrar mensaje de éxito
      this.toastService.showSuccess('✓ Acceso detenido para docentes y estudiantes');

      // Actualizar UI
      this.cdr.markForCheck();

    } catch (error: any) {
      console.error('❌ Error en confirmStopAccess:', error);
      this.toastService.showError('Error al detener acceso: ' + error.message);
    } finally {
      this.loading = false;
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