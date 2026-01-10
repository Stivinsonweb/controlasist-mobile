import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonInput,
  IonDatetime,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonToggle,
  ModalController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  closeOutline,
  copyOutline,
  shareSocialOutline,
  calendarOutline,
  refreshOutline,
  lockClosedOutline,
  checkmarkCircleOutline
} from 'ionicons/icons';
import { SupabaseService } from '../../services/supabase/supabase.service';

@Component({
  selector: 'app-codigo-acceso-modal',
  templateUrl: './codigo-acceso-modal.component.html',
  styleUrls: ['./codigo-acceso-modal.component.scss'],
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
    IonItem,
    IonLabel,
    IonInput,
    IonDatetime,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonToggle
  ]
})
export class CodigoAccesoModalComponent implements OnInit {
  @Input() asignatura: any;

  tieneExpiracion = false;
  fechaExpiracion: string = '';
  minDate: string = '';

  constructor(
    private modalCtrl: ModalController,
    private supabase: SupabaseService,
    private toastCtrl: ToastController
  ) {
    addIcons({
      closeOutline,
      copyOutline,
      shareSocialOutline,
      calendarOutline,
      refreshOutline,
      lockClosedOutline,
      checkmarkCircleOutline
    });
  }

  ngOnInit() {
    const today = new Date();
    this.minDate = today.toISOString();

    if (this.asignatura?.codigo_expira) {
      this.tieneExpiracion = true;
      this.fechaExpiracion = this.asignatura.codigo_expira;
    }
  }

  cerrar() {
    this.modalCtrl.dismiss();
  }

  async copiarCodigo() {
    try {
      await navigator.clipboard.writeText(this.asignatura.codigo_acceso);
      await this.showToast('Código copiado', 'success');
    } catch (error) {
      await this.showToast('Error al copiar', 'danger');
    }
  }

  async compartirCodigo() {
    const mensaje = `🎓 Únete a mi asignatura en ControlAsist

📚 ${this.asignatura.nombre}
👨‍🏫 Grupo ${this.asignatura.grupo}
📅 Periodo ${this.asignatura.periodo}

🔑 Código de acceso: ${this.asignatura.codigo_acceso}
${this.tieneExpiracion ? `⏰ Válido hasta: ${this.formatearFecha(this.fechaExpiracion)}` : ''}

Descarga la app e ingresa este código para inscribirte.`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Asignatura: ${this.asignatura.nombre}`,
          text: mensaje
        });
      } else {
        await navigator.clipboard.writeText(mensaje);
        await this.showToast('Mensaje copiado', 'success');
      }
    } catch (error) {
      console.error('Error compartiendo:', error);
    }
  }

  async regenerarCodigo() {
    try {
      const nuevoCodigo = this.generarCodigoAleatorio();

      const { error } = await this.supabase
        .from('asignaturas')
        .update({ 
          codigo_acceso: nuevoCodigo,
          updated_at: new Date().toISOString()
        })
        .eq('id', this.asignatura.id);

      if (error) throw error;

      this.asignatura.codigo_acceso = nuevoCodigo;
      await this.showToast('Código regenerado', 'success');
      
    } catch (error) {
      await this.showToast('Error al regenerar código', 'danger');
    }
  }

  async guardarExpiracion() {
    try {
      const { error } = await this.supabase
        .from('asignaturas')
        .update({
          codigo_expira: this.tieneExpiracion ? this.fechaExpiracion : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', this.asignatura.id);

      if (error) throw error;

      await this.showToast('Configuración guardada', 'success');
      this.modalCtrl.dismiss({ updated: true });
      
    } catch (error) {
      await this.showToast('Error al guardar', 'danger');
    }
  }

  generarCodigoAleatorio(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let codigo = '';
    for (let i = 0; i < 8; i++) {
      codigo += chars.charAt(Math.floor(Math.random() * chars.length));
      if (i === 3) codigo += '-';
    }
    return codigo;
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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