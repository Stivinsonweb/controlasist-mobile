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
  IonCard,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  LoadingController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  keyOutline,
  searchOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  schoolOutline
} from 'ionicons/icons';
import { SupabaseService } from '../../../services/supabase/supabase.service';

@Component({
  selector: 'app-inscribir',
  templateUrl: './inscribir.page.html',
  styleUrls: ['./inscribir.page.scss'],
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
    IonCard,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput
  ]
})
export class InscribirPage implements OnInit {
  codigoAcceso: string = '';
  asignaturaEncontrada: any = null;
  buscando = false;

  constructor(
    private supabase: SupabaseService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({
      keyOutline,
      searchOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      schoolOutline
    });
  }

  ngOnInit() {}

  async buscarAsignatura() {
    if (!this.codigoAcceso || !this.codigoAcceso.trim()) {
      await this.showToast('Ingresa un código de acceso', 'warning');
      return;
    }

    this.buscando = true;
    const loading = await this.loadingCtrl.create({
      message: 'Buscando asignatura...'
    });
    await loading.present();

    try {
      const codigoLimpio = this.codigoAcceso.trim().toUpperCase();
      
      console.log('Buscando código:', codigoLimpio);

      const { data, error } = await this.supabase
        .from('asignaturas')
        .select('*')
        .eq('codigo_acceso', codigoLimpio)
        .eq('activa', true);

      console.log('Resultados:', data);
      console.log('Error:', error);

      await loading.dismiss();
      this.buscando = false;

      if (error) {
        console.error('Error buscando asignatura:', error);
        this.asignaturaEncontrada = null;
        this.cdr.detectChanges();
        await this.showToast('Error al buscar asignatura', 'danger');
        return;
      }

      if (!data || data.length === 0) {
        this.asignaturaEncontrada = null;
        this.cdr.detectChanges();
        await this.showToast('Código no válido o asignatura inactiva', 'danger');
        return;
      }

      const asignatura = data[0];

      if (asignatura.codigo_expira) {
        const fechaExpiracion = new Date(asignatura.codigo_expira);
        const hoy = new Date();
        
        if (fechaExpiracion < hoy) {
          this.asignaturaEncontrada = null;
          this.cdr.detectChanges();
          await this.showToast('Este código ha expirado', 'danger');
          return;
        }
      }

      this.asignaturaEncontrada = asignatura;
      this.cdr.detectChanges();
      await this.showToast('Asignatura encontrada', 'success');

    } catch (error) {
      await loading.dismiss();
      this.buscando = false;
      console.error('Error:', error);
      this.asignaturaEncontrada = null;
      this.cdr.detectChanges();
      await this.showToast('Error al buscar asignatura', 'danger');
    }
  }

  async inscribirse() {
    this.router.navigate(['/estudiante/datos-inscripcion'], {
      state: { asignatura: this.asignaturaEncontrada }
    });
  }

  limpiar() {
    this.codigoAcceso = '';
    this.asignaturaEncontrada = null;
    this.cdr.detectChanges();
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