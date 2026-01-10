import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
  IonSkeletonText,
  IonSegment,
  IonSegmentButton,
  IonBadge,
  IonSelect,
  IonSelectOption,
  LoadingController,
  AlertController,
  ModalController, IonItem } from '@ionic/angular/standalone';
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
  refreshOutline,
  codeOutline,
  chevronForwardOutline,
  calendarOutline,
  createOutline,
  funnelOutline,
  desktopOutline
} from 'ionicons/icons';
import { AuthService } from '../../services/auth/auth.service';
import { SupabaseService } from '../../services/supabase/supabase.service';
import { EditarPage } from '../perfil/editar/editar.page';

interface Asignatura {
  id: string;
  nombre: string;
  codigo: string;
  grupo: string;
  nivel: string;
  periodo: string;
  creditos: number;
  modalidad: string;
  color: string;
  activa: boolean;
  docente_id: string;
  created_at: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonItem, 
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
    IonRefresherContent,
    IonSkeletonText,
    IonSegment,
    IonSegmentButton,
    IonBadge,
    IonSelect,
    IonSelectOption
  ]
})
export class HomePage implements OnInit {
  docente: any = null;
  asignaturas: Asignatura[] = [];
  asignaturasFiltradas: Asignatura[] = [];
  loadingProfile = true;
  loadingAsignaturas = true;
  
  // Filtros
  periodos: string[] = [];
  periodoSeleccionado: string = 'todos';

  constructor(
    private authService: AuthService,
    private supabase: SupabaseService,
    private router: Router,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private modalController: ModalController,
    private cdr: ChangeDetectorRef
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
      refreshOutline,
      codeOutline,
      chevronForwardOutline,
      calendarOutline,
      createOutline,
      funnelOutline,
      desktopOutline
    });
  }

  async ngOnInit() {
    await this.loadAllData();
  }

  async ionViewWillEnter() {
    await this.loadAllData();
  }

  async loadAllData() {
    console.log('🔄 Iniciando carga de datos...');
    
    await this.loadDocenteInfo();
    await this.loadAsignaturas();
    
    console.log('✅ Carga completada');
  }

  async loadDocenteInfo() {
    this.loadingProfile = true;
    
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      
      if (!user) {
        console.error('❌ No hay usuario autenticado');
        this.router.navigate(['/auth/login']);
        return;
      }

      console.log('👤 Usuario ID:', user.id);

      const { data: docenteData, error } = await this.supabase
        .from('docentes')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      this.docente = docenteData;
      console.log('✅ Docente cargado:', this.docente);
      
      this.cdr.detectChanges();
      
    } catch (error) {
      console.error('❌ Error cargando docente:', error);
      await this.showAlert('Error', 'No se pudo cargar la información del perfil');
    } finally {
      this.loadingProfile = false;
      this.cdr.detectChanges();
    }
  }

  async editarPerfil() {
    const modal = await this.modalController.create({
      component: EditarPage,
      componentProps: {
        docente: this.docente
      },
      breakpoints: [0, 0.5, 0.75, 0.95],
      initialBreakpoint: 0.95
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    
    if (data?.updated) {
      // Recargar información del docente
      this.docente = data.data;
      this.cdr.detectChanges();
    }
  }

  async loadAsignaturas() {
    this.loadingAsignaturas = true;
    
    try {
      if (!this.docente?.id) {
        console.warn('⚠️ No hay docente_id disponible, esperando...');
        this.asignaturas = [];
        this.asignaturasFiltradas = [];
        return;
      }

      console.log('📚 Buscando asignaturas para docente_id:', this.docente.id);

      const { data, error } = await this.supabase
        .from('asignaturas')
        .select('*')
        .eq('activa', true)
        .eq('docente_id', this.docente.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error en query:', error);
        throw error;
      }

      this.asignaturas = data || [];
      console.log('✅ Asignaturas cargadas:', this.asignaturas.length);
      console.log('📊 Datos:', this.asignaturas);

      // Extraer periodos únicos
      this.extraerPeriodos();
      
      // Aplicar filtro inicial
      this.filtrarAsignaturas();
      
      this.cdr.detectChanges();
      
    } catch (error) {
      console.error('❌ Error cargando asignaturas:', error);
      this.asignaturas = [];
      this.asignaturasFiltradas = [];
    } finally {
      this.loadingAsignaturas = false;
      this.cdr.detectChanges();
    }
  }

  extraerPeriodos() {
    const periodosUnicos = [...new Set(this.asignaturas.map(a => a.periodo))];
    this.periodos = periodosUnicos.sort().reverse(); // Más reciente primero
    
    // Si hay periodos, seleccionar el más reciente por defecto
    if (this.periodos.length > 0 && this.periodoSeleccionado === 'todos') {
      this.periodoSeleccionado = this.periodos[0];
    }
    
    console.log('📅 Periodos encontrados:', this.periodos);
  }

  filtrarAsignaturas() {
    if (this.periodoSeleccionado === 'todos') {
      this.asignaturasFiltradas = this.asignaturas;
    } else {
      this.asignaturasFiltradas = this.asignaturas.filter(
        a => a.periodo === this.periodoSeleccionado
      );
    }
    
    console.log('🔍 Asignaturas filtradas:', this.asignaturasFiltradas.length);
    this.cdr.detectChanges();
  }

  onPeriodoChange(event: any) {
    this.periodoSeleccionado = event.detail.value;
    this.filtrarAsignaturas();
  }

  getAsignaturasPorPeriodo(periodo: string): number {
    return this.asignaturas.filter(a => a.periodo === periodo).length;
  }

  async handleRefresh(event: any) {
    console.log('🔄 Refrescando datos...');
    await this.loadAllData();
    event.target.complete();
  }

  crearAsignatura() {
    this.router.navigate(['/asignaturas/crear']);
  }

  verAsignatura(asignatura: Asignatura) {
    // TODO: Navegar a detalle de asignatura
    this.router.navigate(['/asignaturas/detalle', asignatura.id]);
  }

  async logout() {
    const alert = await this.alertController.create({
      header: 'Cerrar sesión',
      message: '¿Estás seguro que deseas cerrar sesión?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Sí, cerrar sesión',
          role: 'confirm',
          handler: () => {
            this.authService.logout();
          }
        }
      ]
    });
    await alert.present();
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
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

  getNombreCompleto(): string {
    if (!this.docente) return 'Cargando...';
    return `${this.docente.nombres} ${this.docente.apellidos}`;
  }
}