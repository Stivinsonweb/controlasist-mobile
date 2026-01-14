import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonBadge,
  IonAvatar,
  IonSearchbar,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  schoolOutline,
  school,
  eyeOutline,
  refreshOutline,
  mailOutline,
  callOutline,
  barcodeOutline,
  calendarOutline,
  searchOutline
} from 'ionicons/icons';
import { SupabaseService } from '../../../services/supabase/supabase.service';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Estudiante {
  id: string;
  email: string;
  nombres: string;
  apellidos: string;
  codigo?: string;
  telefono?: string;
  programa?: string;
  created_at: string;
}

@Component({
  selector: 'app-admin-estudiantes',
  templateUrl: './admin-estudiantes.page.html',
  styleUrls: ['./admin-estudiantes.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonCard,
    IonCardContent,
    IonBadge,
    IonAvatar,
    IonSearchbar,
    IonRefresher,
    IonRefresherContent,
    IonSkeletonText,
    CommonModule,
    FormsModule
  ]
})
export class AdminEstudiantesPage implements OnInit {
  estudiantes: Estudiante[] = [];
  estudiantesFiltrados: Estudiante[] = [];
  loading: boolean = true;
  searchTerm: string = '';

  constructor(private supabase: SupabaseService) {
    addIcons({
      schoolOutline,
      school,
      eyeOutline,
      refreshOutline,
      mailOutline,
      callOutline,
      barcodeOutline,
      calendarOutline,
      searchOutline
    });
  }

  async ngOnInit() {
    await this.loadEstudiantes();
  }

  async ionViewWillEnter() {
    await this.loadEstudiantes();
  }

  async loadEstudiantes() {
    this.loading = true;
    try {
      const { data, error } = await this.supabase
        .from('estudiantes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      this.estudiantes = data || [];
      this.estudiantesFiltrados = this.estudiantes;
      console.log('✅ Estudiantes cargados:', this.estudiantes.length);
    } catch (error) {
      console.error('❌ Error cargando estudiantes:', error);
      this.estudiantes = [];
      this.estudiantesFiltrados = [];
    } finally {
      this.loading = false;
    }
  }

  filterEstudiantes() {
    const term = this.searchTerm.toLowerCase().trim();

    if (!term) {
      this.estudiantesFiltrados = this.estudiantes;
      return;
    }

    this.estudiantesFiltrados = this.estudiantes.filter(estudiante => {
      const nombreCompleto = `${estudiante.nombres} ${estudiante.apellidos}`.toLowerCase();
      const email = estudiante.email.toLowerCase();
      const codigo = estudiante.codigo?.toLowerCase() || '';
      const programa = estudiante.programa?.toLowerCase() || '';

      return nombreCompleto.includes(term) ||
        email.includes(term) ||
        codigo.includes(term) ||
        programa.includes(term);
    });
  }

  async handleRefresh(event?: any) {
    await this.loadEstudiantes();
    if (event) {
      event.target.complete();
    }
  }

  getNombreCompleto(estudiante: Estudiante): string {
    return `${estudiante.nombres} ${estudiante.apellidos}`;
  }

  getAvatarUrl(estudiante: Estudiante): string {
    const initials = `${estudiante.nombres.charAt(0)}${estudiante.apellidos.charAt(0)}`;
    return `https://ui-avatars.com/api/?name=${initials}&background=f5576c&color=fff&size=200&bold=true&rounded=true`;
  }

  formatDate(dateString: string): string {
    try {
      return format(new Date(dateString), "d 'de' MMMM, yyyy", { locale: es });
    } catch {
      return 'Fecha no disponible';
    }
  }
}
