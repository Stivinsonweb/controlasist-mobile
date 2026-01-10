import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonBackButton,
  IonButtons,
  LoadingController,
  ToastController,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  saveOutline,
  personOutline,
  cardOutline,
  callOutline,
  schoolOutline,
  calendarOutline,
  locationOutline,
  homeOutline,
  keyOutline
} from 'ionicons/icons';
import { SupabaseService } from '../../../services/supabase/supabase.service';

@Component({
  selector: 'app-perfil-estudiante',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonCard,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonBackButton,
    IonButtons
  ]
})
export class PerfilEstudiantePage implements OnInit {
  perfilForm: FormGroup;
  estudiante: any = null;

  constructor(
    private fb: FormBuilder,
    private supabase: SupabaseService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {
    addIcons({
      saveOutline,
      personOutline,
      cardOutline,
      callOutline,
      schoolOutline,
      calendarOutline,
      locationOutline,
      homeOutline,
      keyOutline
    });

    this.perfilForm = this.fb.group({
      nombres: ['', [Validators.required]],
      apellidos: ['', [Validators.required]],
      tipo_documento: ['CC'],
      cedula: [''],
      telefono: [''],
      programa: [''],
      fecha_nacimiento: [''],
      ciudad: [''],
      direccion: ['']
    });
  }

  async ngOnInit() {
    await this.loadEstudiante();
  }

  async loadEstudiante() {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      
      if (user) {
        const { data } = await this.supabase
          .from('estudiantes')
          .select('*')
          .eq('id', user.id)
          .single();

        if (data) {
          this.estudiante = data;
          this.perfilForm.patchValue({
            nombres: data.nombres || '',
            apellidos: data.apellidos || '',
            tipo_documento: data.tipo_documento || 'CC',
            cedula: data.cedula || '',
            telefono: data.telefono || '',
            programa: data.programa || '',
            fecha_nacimiento: data.fecha_nacimiento || '',
            ciudad: data.ciudad || '',
            direccion: data.direccion || ''
          });
        }
      }
    } catch (error) {
      console.error('Error cargando estudiante:', error);
    }
  }

  async guardarPerfil() {
    if (this.perfilForm.invalid) {
      await this.showToast('Completa los campos obligatorios', 'warning');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Guardando perfil...'
    });
    await loading.present();

    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      
      if (user) {
        const { error } = await this.supabase
          .from('estudiantes')
          .update(this.perfilForm.value)
          .eq('id', user.id);

        if (error) throw error;

        await loading.dismiss();
        await this.showToast('Perfil actualizado exitosamente', 'success');
        this.router.navigate(['/estudiante/home']);
      }
    } catch (error: any) {
      await loading.dismiss();
      console.error('Error:', error);
      await this.showToast('Error al guardar perfil', 'danger');
    }
  }

  async cambiarContrasena() {
    const alert = await this.alertCtrl.create({
      header: 'Cambiar Contraseña',
      inputs: [
        {
          name: 'nuevaPassword',
          type: 'password',
          placeholder: 'Nueva contraseña (mínimo 8 caracteres)'
        },
        {
          name: 'confirmarPassword',
          type: 'password',
          placeholder: 'Confirmar nueva contraseña'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Cambiar',
          handler: async (data) => {
            if (!data.nuevaPassword || data.nuevaPassword.length < 8) {
              await this.showToast('La contraseña debe tener al menos 8 caracteres', 'warning');
              return false;
            }

            if (data.nuevaPassword !== data.confirmarPassword) {
              await this.showToast('Las contraseñas no coinciden', 'warning');
              return false;
            }

            const loading = await this.loadingCtrl.create({
              message: 'Cambiando contraseña...'
            });
            await loading.present();

            try {
              const { error } = await this.supabase.auth.updateUser({
                password: data.nuevaPassword
              });

              await loading.dismiss();

              if (error) throw error;

              await this.showToast('Contraseña actualizada exitosamente', 'success');
              return true;
            } catch (error: any) {
              await loading.dismiss();
              await this.showToast('Error al cambiar contraseña', 'danger');
              return false;
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color
    });
    toast.present();
  }
}