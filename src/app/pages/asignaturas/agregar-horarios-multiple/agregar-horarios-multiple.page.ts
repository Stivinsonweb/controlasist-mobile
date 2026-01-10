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
  IonInput,
  IonCheckbox,
  IonChip,
  ModalController,
  LoadingController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  closeOutline, 
  saveOutline, 
  timeOutline, 
  calendarOutline, 
  locationOutline, 
  checkmarkCircle,
  addOutline,
  trashOutline
} from 'ionicons/icons';
import { SupabaseService } from '../../../services/supabase/supabase.service';

interface DiaHorario {
  dia: number;
  nombre: string;
  seleccionado: boolean;
  hora_inicio: string;
  hora_fin: string;
  aula: string;
}

@Component({
  selector: 'app-agregar-horarios-multiple',
  templateUrl: './agregar-horarios-multiple.page.html',
  styleUrls: ['./agregar-horarios-multiple.page.scss'],
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
    IonInput,
    IonCheckbox,
    IonChip
  ]
})
export class AgregarHorariosMultiplePage implements OnInit {
  @Input() asignaturaId!: string;

  diasSemana: DiaHorario[] = [
    { dia: 1, nombre: 'Lunes', seleccionado: false, hora_inicio: '', hora_fin: '', aula: '' },
    { dia: 2, nombre: 'Martes', seleccionado: false, hora_inicio: '', hora_fin: '', aula: '' },
    { dia: 3, nombre: 'Miércoles', seleccionado: false, hora_inicio: '', hora_fin: '', aula: '' },
    { dia: 4, nombre: 'Jueves', seleccionado: false, hora_inicio: '', hora_fin: '', aula: '' },
    { dia: 5, nombre: 'Viernes', seleccionado: false, hora_inicio: '', hora_fin: '', aula: '' },
    { dia: 6, nombre: 'Sábado', seleccionado: false, hora_inicio: '', hora_fin: '', aula: '' }
  ];

  horasRapidas = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00'
  ];

  duraciones = [
    { label: '1h', minutos: 60 },
    { label: '1.5h', minutos: 90 },
    { label: '2h', minutos: 120 },
    { label: '3h', minutos: 180 }
  ];

  diaExpandido: number | null = null;

  constructor(
    private modalController: ModalController,
    private supabase: SupabaseService,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {
    addIcons({ 
      closeOutline, 
      saveOutline, 
      timeOutline, 
      calendarOutline, 
      locationOutline, 
      checkmarkCircle,
      addOutline,
      trashOutline
    });
  }

  ngOnInit() {}

  toggleDia(dia: DiaHorario) {
    if (dia.seleccionado) {
      // Deseleccionar
      dia.seleccionado = false;
      dia.hora_inicio = '';
      dia.hora_fin = '';
      dia.aula = '';
      this.diaExpandido = null;
    } else {
      // Seleccionar y expandir
      dia.seleccionado = true;
      this.diaExpandido = dia.dia;
    }
  }

  seleccionarHoraInicio(dia: DiaHorario, hora: string) {
    dia.hora_inicio = hora;
    // Auto-calcular hora fin con 1 hora por defecto
    if (!dia.hora_fin) {
      this.calcularHoraFin(dia, 60);
    }
  }

  seleccionarDuracion(dia: DiaHorario, minutos: number) {
    if (dia.hora_inicio) {
      this.calcularHoraFin(dia, minutos);
    }
  }

  calcularHoraFin(dia: DiaHorario, minutos: number) {
    if (!dia.hora_inicio) return;

    const [h, m] = dia.hora_inicio.split(':').map(Number);
    const totalMinutos = h * 60 + m + minutos;
    const horasFin = Math.floor(totalMinutos / 60) % 24;
    const minutosFin = totalMinutos % 60;
    
    dia.hora_fin = `${String(horasFin).padStart(2, '0')}:${String(minutosFin).padStart(2, '0')}`;
  }

  calcularDuracion(dia: DiaHorario): number {
    if (!dia.hora_inicio || !dia.hora_fin) return 0;

    const [h1, m1] = dia.hora_inicio.split(':').map(Number);
    const [h2, m2] = dia.hora_fin.split(':').map(Number);

    const minutos1 = h1 * 60 + m1;
    const minutos2 = h2 * 60 + m2;

    return minutos2 - minutos1;
  }

  async guardar() {
    const diasConHorarios = this.diasSemana.filter(d => 
      d.seleccionado && d.hora_inicio && d.hora_fin
    );
    
    if (diasConHorarios.length === 0) {
      await this.showToast('Debes configurar al menos un día', 'warning');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Guardando horarios...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const horariosParaInsertar = diasConHorarios.map(dia => ({
        asignatura_id: this.asignaturaId,
        dia_semana: dia.dia,
        hora_inicio: dia.hora_inicio,
        hora_fin: dia.hora_fin,
        aula: dia.aula || null,
        activo: true
      }));

      const { error } = await this.supabase
        .from('horarios')
        .insert(horariosParaInsertar);

      await loading.dismiss();

      if (error) throw error;

      await this.showToast(`✓ ${horariosParaInsertar.length} horario(s) guardado(s)`, 'success');
      
      this.modalController.dismiss({
        created: true,
        count: horariosParaInsertar.length
      });

    } catch (error: any) {
      await loading.dismiss();
      console.error('❌ Error:', error);
      await this.showToast('Error al guardar', 'danger');
    }
  }

  cerrar() {
    this.modalController.dismiss({ created: false });
  }

  formatHora(hora: string): string {
    if (!hora) return '';
    const [h, m] = hora.split(':');
    const horas = parseInt(h);
    const ampm = horas >= 12 ? 'PM' : 'AM';
    const h12 = horas % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  }

  hayDiasSeleccionados(): boolean {
    return this.diasSemana.some(d => d.seleccionado && d.hora_inicio && d.hora_fin);
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