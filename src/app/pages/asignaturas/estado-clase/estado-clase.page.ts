import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  IonTextarea,
  IonChip,
  ModalController,
  LoadingController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  closeOutline, 
  saveOutline, 
  checkmarkCircleOutline,
  closeCircleOutline,
  timeOutline,
  calendarOutline,
  checkmarkCircle,
  locationOutline
} from 'ionicons/icons';
import { SupabaseService } from '../../../services/supabase/supabase.service';

interface Horario {
  id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  aula?: string;
  estado?: string;
  fecha_ultima_actualizacion?: string;
}

@Component({
  selector: 'app-estado-clase',
  templateUrl: './estado-clase.page.html',
  styleUrls: ['./estado-clase.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
    IonTextarea,
    IonChip
  ]
})
export class EstadoClasePage implements OnInit {
  @Input() horario!: Horario;
  @Input() asignaturaId!: string;
  @Input() estadoActual: string = 'pendiente';

  estadoSeleccionado: string = '';
  observaciones: string = '';
  temasTratados: string = '';

  diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  estados = [
    { 
      valor: 'realizada', 
      label: 'Realizada',
      descripcion: 'La clase se dictó normalmente',
      color: '#10b981',
      icono: 'checkmark-circle-outline'
    },
    { 
      valor: 'cancelada', 
      label: 'Cancelada',
      descripcion: 'La clase no se realizó',
      color: '#ef4444',
      icono: 'close-circle-outline'
    },
    { 
      valor: 'aplazada', 
      label: 'Aplazada',
      descripcion: 'La clase se reprogramó',
      color: '#f59e0b',
      icono: 'time-outline'
    }
  ];

  fechaActual: string = '';

  constructor(
    private modalController: ModalController,
    private supabase: SupabaseService,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {
    addIcons({ 
      closeOutline, 
      saveOutline, 
      checkmarkCircleOutline,
      closeCircleOutline,
      timeOutline,
      calendarOutline,
      checkmarkCircle,
      locationOutline
    });
  }

  ngOnInit() {
    this.estadoSeleccionado = this.estadoActual;
    this.fechaActual = new Date().toISOString().split('T')[0];
  }

  seleccionarEstado(estado: string) {
    this.estadoSeleccionado = estado;
  }

  async guardar() {
  if (!this.estadoSeleccionado) {
    await this.showToast('Selecciona un estado', 'warning');
    return;
  }

  const loading = await this.loadingController.create({
    message: 'Guardando...',
    spinner: 'crescent'
  });
  await loading.present();

  try {
    const fechaHoy = new Date().toISOString().split('T')[0];

    // Actualizar estado del horario
    const { error } = await this.supabase
      .from('horarios')
      .update({
        estado: this.estadoSeleccionado,
        fecha_ultima_actualizacion: fechaHoy
      })
      .eq('id', this.horario.id);

    await loading.dismiss();

    if (error) throw error;

    await this.showToast('✓ Estado guardado exitosamente', 'success');
    
    this.modalController.dismiss({
      saved: true,
      estado: this.estadoSeleccionado
    });

  } catch (error: any) {
    await loading.dismiss();
    console.error('❌ Error guardando estado:', error);
    await this.showToast('Error al guardar el estado', 'danger');
  }
}

  cerrar() {
    this.modalController.dismiss({ saved: false });
  }

  formatHora(hora: string): string {
    if (!hora) return '';
    const [h, m] = hora.split(':');
    const horas = parseInt(h);
    const ampm = horas >= 12 ? 'PM' : 'AM';
    const h12 = horas % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  }

  getColorEstado(valor: string): string {
    const estado = this.estados.find(e => e.valor === valor);
    return estado?.color || '#94a3b8';
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
}