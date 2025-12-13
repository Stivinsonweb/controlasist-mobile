import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { 
  IonContent, 
  IonHeader, 
  IonToolbar, 
  IonTitle,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonAvatar,
  IonChip,
  IonLabel,
  IonGrid,
  IonRow,
  IonCol,
  IonRefresher,
  IonRefresherContent,
  LoadingController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  personCircleOutline,
  mailOutline,
  callOutline,
  businessOutline,
  schoolOutline,
  briefcaseOutline,
  addCircleOutline,
  bookOutline,
  peopleOutline,
  barChartOutline,
  logOutOutline,
  refreshOutline
} from 'ionicons/icons';
import { AuthService } from '../../services/auth/auth.service';
import { SupabaseService } from '../../services/supabase/supabase.service';

interface Asignatura {
  id: string;
  nombre: string;
  codigo: string;
  nivel: string;
  creditos: number;
  docente_id: string;
  created_at: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonAvatar,
    IonChip,
    IonLabel,
    IonGrid,
    IonRow,
    IonCol,
    IonRefresher,
    IonRefresherContent
  ]
})
export class HomePage implements OnInit {
  docente: any = null;
  asignaturas: Asignatura[] = [];
  loadingAsignaturas = true;

  constructor(
    private authService: AuthService,
    private supabase: SupabaseService,
    private router: Router,
    private loadingController: LoadingController
  ) {
    addIcons({
      personCircleOutline,
      mailOutline,
      callOutline,
      businessOutline,
      schoolOutline,
      briefcaseOutline,
      addCircleOutline,
      bookOutline,
      peopleOutline,
      barChartOutline,
      logOutOutline,
      refreshOutline
    });
  }

  async ngOnInit() {
    await this.loadDocenteInfo();
    await this.loadAsignaturas();
  }

  async loadDocenteInfo() {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      
      if (user) {
        const { data: docenteData } = await this.supabase
          .from('docentes')
          .select('*')
          .eq('user_id', user.id)
          .single();

        this.docente = docenteData;
        console.log('✅ Docente cargado:', this.docente);
      }
    } catch (error) {
      console.error('❌ Error cargando docente:', error);
    }
  }

  async loadAsignaturas() {
    this.loadingAsignaturas = true;
    
    try {
      if (!this.docente) {
        await this.loadDocenteInfo();
      }

      const { data, error } = await this.supabase
        .from('asignaturas')
        .select('*')
        .eq('docente_id', this.docente?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error cargando asignaturas:', error);
      } else {
        this.asignaturas = data || [];
        console.log('✅ Asignaturas cargadas:', this.asignaturas.length);
      }
    } catch (error) {
      console.error('❌ Error:', error);
    } finally {
      this.loadingAsignaturas = false;
    }
  }

  async handleRefresh(event: any) {
    await this.loadAsignaturas();
    event.target.complete();
  }

  crearAsignatura() {
    // TODO: Navegar a página de crear asignatura
    console.log('📝 Crear nueva asignatura');
  }

  verAsignatura(asignatura: Asignatura) {
    // TODO: Navegar a detalle de asignatura
    console.log('👁️ Ver asignatura:', asignatura);
  }

  logout() {
    this.authService.logout();
  }

  getInitials(): string {
    if (!this.docente) return 'U';
    const firstInitial = this.docente.nombres?.charAt(0)?.toUpperCase() || '';
    const lastInitial = this.docente.apellidos?.charAt(0)?.toUpperCase() || '';
    return `${firstInitial}${lastInitial}`;
  }

  getAvatarUrl(): string {
    if (this.docente?.foto_url) {
      return this.docente.foto_url;
    }
    const initials = this.getInitials();
    return `https://ui-avatars.com/api/?name=${initials}&background=3b82f6&color=fff&size=200&bold=true&rounded=true`;
  }
}