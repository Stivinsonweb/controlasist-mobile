import { Component, Input, OnInit } from '@angular/core';
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
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  LoadingController,
  ToastController,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { saveOutline, closeOutline } from 'ionicons/icons';
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
    IonCardHeader,
    IonCardTitle,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption
  ]
})
export class EditarPage implements OnInit {
  @Input() asignatura: any;

  asignaturaForm: FormGroup;

  colores = [
    { valor: '#3b82f6', nombre: 'Azul' },
    { valor: '#10b981', nombre: 'Verde' },
    { valor: '#f59e0b', nombre: 'Amarillo' },
    { valor: '#ef4444', nombre: 'Rojo' },
    { valor: '#8b5cf6', nombre: 'Púrpura' },
    { valor: '#ec4899', nombre: 'Rosa' },
    { valor: '#06b6d4', nombre: 'Cian' },
    { valor: '#84cc16', nombre: 'Lima' }
  ];

  modalidades = ['Presencial', 'Virtual', 'Híbrida'];

  constructor(
    private fb: FormBuilder,
    private supabase: SupabaseService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private modalCtrl: ModalController
  ) {
    addIcons({ saveOutline, closeOutline });
    
    this.asignaturaForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      codigo: ['', [Validators.required]],
      grupo: ['', [Validators.required]],
      facultad: [''],
      programa: [''],
      localidad: [''],
      nivel: ['', [Validators.required]],
      periodo: ['', [Validators.required]],
      creditos: [1, [Validators.required, Validators.min(1), Validators.max(10)]],
      modalidad: ['Presencial', [Validators.required]],
      aula: [''],
      color: ['#3b82f6', [Validators.required]]
    });
  }

  ngOnInit() {
    if (!this.asignatura) {
      this.showToast('Error al cargar datos', 'danger');
      this.cerrar();
      return;
    }

    this.asignaturaForm.patchValue({
      nombre: this.asignatura.nombre || '',
      codigo: this.asignatura.codigo || '',
      grupo: this.asignatura.grupo || '',
      facultad: this.asignatura.facultad || '',
      programa: this.asignatura.programa || '',
      localidad: this.asignatura.cds || '',
      nivel: this.asignatura.nivel || '',
      periodo: this.asignatura.periodo || '',
      creditos: this.asignatura.creditos || 1,
      modalidad: this.asignatura.modalidad || 'Presencial',
      aula: this.asignatura.aula || '',
      color: this.asignatura.color || '#3b82f6'
    });
  }

  cerrar() {
    this.modalCtrl.dismiss();
  }

  async guardar() {
    if (this.asignaturaForm.invalid) {
      await this.showToast('Completa los campos requeridos', 'warning');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Guardando...'
    });
    await loading.present();

    try {
      const formData = this.asignaturaForm.value;

      const { error } = await this.supabase
        .from('asignaturas')
        .update({
          nombre: formData.nombre,
          codigo: formData.codigo,
          grupo: formData.grupo,
          facultad: formData.facultad || null,
          programa: formData.programa || null,
          cds: formData.localidad || null,
          nivel: formData.nivel,
          periodo: formData.periodo,
          creditos: formData.creditos,
          modalidad: formData.modalidad,
          aula: formData.aula || null,
          color: formData.color,
          updated_at: new Date().toISOString()
        })
        .eq('id', this.asignatura.id);

      await loading.dismiss();

      if (!error) {
        await this.showToast('Asignatura actualizada', 'success');
        this.modalCtrl.dismiss({ updated: true });
      } else {
        await this.showToast('Error al guardar', 'danger');
      }
    } catch (error) {
      await loading.dismiss();
      await this.showToast('Error al guardar', 'danger');
    }
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color
    });
    toast.present();
  }

  get nombre() { return this.asignaturaForm.get('nombre'); }
  get codigo() { return this.asignaturaForm.get('codigo'); }
  get grupo() { return this.asignaturaForm.get('grupo'); }
  get nivel() { return this.asignaturaForm.get('nivel'); }
  get periodo() { return this.asignaturaForm.get('periodo'); }
  get creditos() { return this.asignaturaForm.get('creditos'); }
  get modalidad() { return this.asignaturaForm.get('modalidad'); }
  get color() { return this.asignaturaForm.get('color'); }
}