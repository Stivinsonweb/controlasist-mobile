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
  IonSelect,
  IonSelectOption,
  IonInput,
  ModalController,
  LoadingController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, saveOutline, timeOutline, calendarOutline, locationOutline } from 'ionicons/icons';
import { SupabaseService } from '../../../services/supabase/supabase.service';

@Component({
  selector: 'app-agregar-horario',
  templateUrl: './agregar-horario.page.html',
  styleUrls: ['./agregar-horario.page.scss'],
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
    IonSelect,
    IonSelectOption,
    IonInput
  ]
})
export class AgregarHorarioPage implements OnInit {
  @Input() asignaturaId!: string;

  horarioForm!: FormGroup;
  
  diasSemana = [
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' },
    { value: 6, label: 'Sábado' }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private modalController: ModalController,
    private supabase: SupabaseService,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {
    addIcons({ closeOutline, saveOutline, timeOutline, calendarOutline, locationOutline });
  }

  ngOnInit() {
    this.horarioForm = this.formBuilder.group({
      dia_semana: [1, [Validators.required]],
      hora_inicio: ['', [Validators.required]],
      hora_fin: ['', [Validators.required]],
      aula: ['']
    });
  }

  async guardar() {
    if (this.horarioForm.valid) {
      const loading = await this.loadingController.create({
        message: 'Guardando horario...',
        spinner: 'crescent'
      });
      await loading.present();

      try {
        const formData = this.horarioForm.value;

        const { data, error } = await this.supabase
          .from('horarios')
          .insert({
            asignatura_id: this.asignaturaId,
            dia_semana: formData.dia_semana,
            hora_inicio: formData.hora_inicio,
            hora_fin: formData.hora_fin,
            aula: formData.aula || null,
            activo: true
          })
          .select()
          .single();

        await loading.dismiss();

        if (error) throw error;

        await this.showToast('✓ Horario agregado exitosamente', 'success');
        
        this.modalController.dismiss({
          created: true,
          data: data
        });

      } catch (error: any) {
        await loading.dismiss();
        console.error('❌ Error guardando horario:', error);
        await this.showToast('Error al guardar el horario', 'danger');
      }
    } else {
      await this.showToast('Por favor completa todos los campos requeridos', 'warning');
    }
  }

  cerrar() {
    this.modalController.dismiss({ created: false });
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

  get dia_semana() { return this.horarioForm.get('dia_semana'); }
  get hora_inicio() { return this.horarioForm.get('hora_inicio'); }
  get hora_fin() { return this.horarioForm.get('hora_fin'); }
  get aula() { return this.horarioForm.get('aula'); }
}