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
  ModalController,
  LoadingController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  closeOutline,
  saveOutline,
  personOutline,
  callOutline,
  businessOutline,
  schoolOutline,
  briefcaseOutline,
  cameraOutline
} from 'ionicons/icons';
import { SupabaseService } from '../../../services/supabase/supabase.service';

@Component({
  selector: 'app-editar',
  templateUrl: './editar.page.html',
  styleUrls: ['./editar.page.scss'],
  standalone: true,
  imports: [
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
    IonAvatar
  ]
})
export class EditarPage implements OnInit {
  @Input() docente: any;

  perfilForm!: FormGroup;
  isLoading = false;

  constructor(
    private formBuilder: FormBuilder,
    private modalController: ModalController,
    private supabase: SupabaseService,
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
      cameraOutline
    });
  }

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    this.perfilForm = this.formBuilder.group({
      nombres: [this.docente?.nombres || '', [Validators.required, Validators.minLength(2)]],
      apellidos: [this.docente?.apellidos || '', [Validators.required, Validators.minLength(2)]],
      telefono: [this.docente?.telefono || '', [Validators.pattern(/^[0-9]{7,10}$/)]],
      entidad: [this.docente?.entidad || ''],
      programa: [this.docente?.programa || ''],
      area: [this.docente?.area || '']
    });
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

        const { data, error } = await this.supabase
          .from('docentes')
          .update({
            nombres: formData.nombres,
            apellidos: formData.apellidos,
            telefono: formData.telefono || null,
            entidad: formData.entidad || null,
            programa: formData.programa || null,
            area: formData.area || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', this.docente.id)
          .select()
          .single();

        await loading.dismiss();

        if (error) throw error;

        await this.showToast('✓ Perfil actualizado exitosamente', 'success');
        
        // Cerrar modal y devolver datos actualizados
        this.modalController.dismiss({
          updated: true,
          data: data
        });

      } catch (error: any) {
        await loading.dismiss();
        console.error('❌ Error actualizando perfil:', error);
        await this.showToast('Error al actualizar el perfil', 'danger');
      }
    } else {
      if (this.nombres?.hasError('required')) {
        await this.showToast('Los nombres son requeridos', 'warning');
      } else if (this.apellidos?.hasError('required')) {
        await this.showToast('Los apellidos son requeridos', 'warning');
      } else if (this.telefono?.hasError('pattern')) {
        await this.showToast('El teléfono debe tener entre 7 y 10 dígitos', 'warning');
      } else {
        await this.showToast('Por favor completa los campos requeridos', 'warning');
      }
    }
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
    if (this.docente?.foto_url) {
      return this.docente.foto_url;
    }
    const firstInitial = this.docente?.nombres?.charAt(0)?.toUpperCase() || 'U';
    const lastInitial = this.docente?.apellidos?.charAt(0)?.toUpperCase() || '';
    return `https://ui-avatars.com/api/?name=${firstInitial}${lastInitial}&background=3b82f6&color=fff&size=200&bold=true&rounded=true`;
  }

  // Getters
  get nombres() { return this.perfilForm.get('nombres'); }
  get apellidos() { return this.perfilForm.get('apellidos'); }
  get telefono() { return this.perfilForm.get('telefono'); }
  get entidad() { return this.perfilForm.get('entidad'); }
  get programa() { return this.perfilForm.get('programa'); }
  get area() { return this.perfilForm.get('area'); }
}