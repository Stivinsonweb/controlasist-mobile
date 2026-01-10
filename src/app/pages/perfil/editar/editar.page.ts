import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { 
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonCard,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonAvatar,
  IonAccordionGroup,
  IonAccordion,
  ModalController,
  LoadingController,
  ToastController, IonCardHeader, IonCardTitle } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  closeOutline,
  saveOutline,
  personOutline,
  callOutline,
  businessOutline,
  schoolOutline,
  briefcaseOutline,
  cameraOutline,
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline,
  checkmarkCircle
} from 'ionicons/icons';
import { SupabaseService } from '../../../services/supabase/supabase.service';
import { AvatarService } from '../../../services/avatar/avatar.service';

@Component({
  selector: 'app-editar',
  templateUrl: './editar.page.html',
  styleUrls: ['./editar.page.scss'],
  standalone: true,
  imports: [IonCardTitle, IonCardHeader, 
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonCard,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    IonAvatar,
    IonAccordionGroup,
    IonAccordion
  ]
})
export class EditarPage implements OnInit {
  @Input() docente: any;

  perfilForm!: FormGroup;
  passwordForm!: FormGroup;
  isLoading = false;
  
  // Avatares
  avatars: string[] = [];
  loadingAvatars = false;
  selectedAvatarIndex: number = -1;
  avatarChanged = false;

  // Password
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(
    private formBuilder: FormBuilder,
    private modalController: ModalController,
    private supabase: SupabaseService,
    private avatarService: AvatarService,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {
    addIcons({
      closeOutline,
      saveOutline,
      personOutline,
      callOutline,
      businessOutline,
      schoolOutline,
      briefcaseOutline,
      cameraOutline,
      lockClosedOutline,
      eyeOutline,
      eyeOffOutline,
      checkmarkCircle
    });
  }

  async ngOnInit() {
    this.initForms();
    await this.loadAvatars();
  }

  initForms() {
    // Formulario de perfil
    this.perfilForm = this.formBuilder.group({
      nombres: [this.docente?.nombres || '', [Validators.required, Validators.minLength(2)]],
      apellidos: [this.docente?.apellidos || '', [Validators.required, Validators.minLength(2)]],
      telefono: [this.docente?.telefono || '', [Validators.pattern(/^[0-9]{7,10}$/)]],
      entidad: [this.docente?.entidad || ''],
      programa: [this.docente?.programa || ''],
      area: [this.docente?.area || '']
    });

    // Formulario de contraseña
    this.passwordForm = this.formBuilder.group({
      currentPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(group: FormGroup) {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  async loadAvatars() {
    this.loadingAvatars = true;

    try {
      console.log('🔄 Cargando avatares desde Storage...');
      
      this.avatars = await this.avatarService.getDefaultAvatars();
      
      console.log('✅ Avatares cargados:', this.avatars.length);
      
      if (this.avatars.length === 0) {
        console.log('⚠️ No hay avatares en Storage, usando UI Avatars');
        this.avatars = this.avatarService.getDefaultAvatarUrls();
      }

      // Buscar el índice del avatar actual
      if (this.docente?.foto_url) {
        this.selectedAvatarIndex = this.avatars.findIndex(url => url === this.docente.foto_url);
      }
      
    } catch (error) {
      console.error('❌ Error cargando avatares:', error);
      this.avatars = this.avatarService.getDefaultAvatarUrls();
    } finally {
      this.loadingAvatars = false;
    }
  }

  selectAvatar(index: number) {
    this.selectedAvatarIndex = index;
    this.avatarChanged = true;
    console.log('✅ Avatar seleccionado:', index + 1);
  }

  onImageError(event: any, index: number) {
    console.log(`❌ Error cargando avatar ${index + 1}, usando fallback`);
    
    const colors = ['3b82f6', '10b981', 'f59e0b', 'ef4444', '8b5cf6', 'ec4899', '06b6d4', '84cc16'];
    const color = colors[index % colors.length];
    this.avatars[index] = `https://ui-avatars.com/api/?name=Avatar+${index + 1}&background=${color}&color=fff&size=200&bold=true&rounded=true`;
    
    event.target.src = this.avatars[index];
  }

  async guardar() {
    if (this.perfilForm.valid) {
      const loading = await this.loadingController.create({
        message: 'Actualizando perfil...',
        spinner: 'crescent'
      });
      await loading.present();

      try {
        const formData = this.perfilForm.value;
        
        const updateData: any = {
          nombres: formData.nombres,
          apellidos: formData.apellidos,
          telefono: formData.telefono || null,
          entidad: formData.entidad || null,
          programa: formData.programa || null,
          area: formData.area || null,
          updated_at: new Date().toISOString()
        };

        // Si cambió el avatar, actualizar
        if (this.avatarChanged && this.selectedAvatarIndex >= 0) {
          updateData.foto_url = this.avatars[this.selectedAvatarIndex];
        }

        const { data, error } = await this.supabase
          .from('docentes')
          .update(updateData)
          .eq('id', this.docente.id)
          .select()
          .single();

        await loading.dismiss();

        if (error) throw error;

        await this.showToast('✓ Perfil actualizado exitosamente', 'success');
        
        this.modalController.dismiss({
          updated: true,
          data: data
        });

      } catch (error: any) {
        await loading.dismiss();
        console.error('❌ Error actualizando perfil:', error);
        await this.showToast('Error al actualizar el perfil', 'danger');
      }
    }
  }

  async cambiarPassword() {
    if (this.passwordForm.valid) {
      const loading = await this.loadingController.create({
        message: 'Cambiando contraseña...',
        spinner: 'crescent'
      });
      await loading.present();

      try {
        const { currentPassword, newPassword } = this.passwordForm.value;

        // Primero, verificar la contraseña actual
        const { data: { user } } = await this.supabase.auth.getUser();
        
        if (!user) throw new Error('No hay usuario autenticado');

        // Intentar iniciar sesión con la contraseña actual para verificarla
        const { error: signInError } = await this.supabase.auth.signInWithPassword({
          email: this.docente.email,
          password: currentPassword
        });

        if (signInError) {
          await loading.dismiss();
          await this.showToast('La contraseña actual es incorrecta', 'danger');
          return;
        }

        // Si la contraseña actual es correcta, actualizar a la nueva
        const { error: updateError } = await this.supabase.auth.updateUser({
          password: newPassword
        });

        await loading.dismiss();

        if (updateError) throw updateError;

        await this.showToast('✓ Contraseña actualizada exitosamente', 'success');
        
        // Resetear formulario de contraseña
        this.passwordForm.reset();

      } catch (error: any) {
        await loading.dismiss();
        console.error('❌ Error cambiando contraseña:', error);
        await this.showToast('Error al cambiar la contraseña', 'danger');
      }
    } else {
      if (this.passwordForm.hasError('passwordMismatch')) {
        await this.showToast('Las contraseñas no coinciden', 'warning');
      }
    }
  }

  toggleCurrentPassword() {
    this.showCurrentPassword = !this.showCurrentPassword;
  }

  toggleNewPassword() {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  cerrar() {
    this.modalController.dismiss({
      updated: false
    });
  }

  async showToast(message: string, color: string = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color
    });
    await toast.present();
  }

  getAvatarUrl(): string {
    // Si seleccionó un nuevo avatar, mostrarlo
    if (this.avatarChanged && this.selectedAvatarIndex >= 0) {
      return this.avatars[this.selectedAvatarIndex];
    }
    
    // Si tiene foto_url, mostrarla
    if (this.docente?.foto_url) {
      return this.docente.foto_url;
    }
    
    // Fallback a UI Avatars
    const firstInitial = this.docente?.nombres?.charAt(0)?.toUpperCase() || 'U';
    const lastInitial = this.docente?.apellidos?.charAt(0)?.toUpperCase() || '';
    return `https://ui-avatars.com/api/?name=${firstInitial}${lastInitial}&background=3b82f6&color=fff&size=200&bold=true&rounded=true`;
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

  // Getters
  get nombres() { return this.perfilForm.get('nombres'); }
  get apellidos() { return this.perfilForm.get('apellidos'); }
  get telefono() { return this.perfilForm.get('telefono'); }
  get entidad() { return this.perfilForm.get('entidad'); }
  get programa() { return this.perfilForm.get('programa'); }
  get area() { return this.perfilForm.get('area'); }

  get currentPassword() { return this.passwordForm.get('currentPassword'); }
  get newPassword() { return this.passwordForm.get('newPassword'); }
  get confirmPassword() { return this.passwordForm.get('confirmPassword'); }
}