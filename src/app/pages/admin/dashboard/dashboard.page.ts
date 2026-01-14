import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
<<<<<<< HEAD
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
=======
import { Router, RouterModule } from '@angular/router';
import { 
  IonContent, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
>>>>>>> 12b5483e3a772962cb6c43c35c1e4be0fc4d057f
  IonButton,
  IonCard,
  IonCardContent,
  IonIcon,
<<<<<<< HEAD
  IonBadge,
  IonRefresher,
  IonRefresherContent,
  IonSplitPane,
  IonMenu,
  IonMenuButton,
  IonButtons,
  IonList,
  IonItem,
  IonLabel,
  IonSearchbar,
  IonAvatar,
  IonSkeletonText,
  AlertController,
  MenuController
=======
  IonSpinner,
  IonMenu,
  IonMenuButton,
  IonMenuToggle,
  IonList,
  IonItem,
  IonLabel,
  IonButtons
>>>>>>> 12b5483e3a772962cb6c43c35c1e4be0fc4d057f
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  peopleOutline,
<<<<<<< HEAD
  people,
  schoolOutline,
  school,
  shieldCheckmarkOutline,
  shieldCheckmark,
  settingsOutline,
  logOutOutline,
  personOutline,
  gridOutline,
  eyeOutline,
  createOutline,
  chevronForwardOutline,
  refreshOutline,
  informationCircleOutline,
  flashOutline,
  mailOutline,
  callOutline,
  businessOutline,
  briefcaseOutline,
  barcodeOutline,
  statsChartOutline
=======
  schoolOutline,
  personOutline,
  logOutOutline,
  menuOutline,
  gridOutline,
  barChartOutline,
  arrowForwardOutline
>>>>>>> 12b5483e3a772962cb6c43c35c1e4be0fc4d057f
} from 'ionicons/icons';
import { SupabaseService } from '../../../services/supabase/supabase.service';
import { ToastService } from '../../../services/toast.service';
import { AuthService } from '../../../services/auth/auth.service';
import { SupabaseService } from '../../../services/supabase/supabase.service';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

interface Docente {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono?: string;
  entidad?: string;
  programa?: string;
  area?: string;
}

interface Estudiante {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  codigo?: string;
  telefono?: string;
  programa?: string;
}

interface Administrador {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono?: string;
  entidad?: string;
  programa?: string;
  area?: string;
  foto_url?: string;
  created_at?: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
<<<<<<< HEAD
    FormsModule,
=======
>>>>>>> 12b5483e3a772962cb6c43c35c1e4be0fc4d057f
    RouterModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonCard,
    IonCardContent,
    IonIcon,
<<<<<<< HEAD
    IonBadge,
    IonRefresher,
    IonRefresherContent,
    IonSplitPane,
    IonMenu,
    IonMenuButton,
    IonButtons,
    IonList,
    IonItem,
    IonLabel,
    IonSearchbar,
    IonAvatar,
    IonSkeletonText
=======
    IonSpinner,
    IonMenu,
    IonMenuButton,
    IonMenuToggle,
    IonList,
    IonItem,
    IonLabel,
    IonButtons
>>>>>>> 12b5483e3a772962cb6c43c35c1e4be0fc4d057f
  ]
})
export class DashboardPage implements OnInit {
  adminName: string = 'Administrador';
<<<<<<< HEAD
  totalDocentes: number = 0;
  totalEstudiantes: number = 0;
  totalAdmins: number = 0;
  selectedPage: string = 'dashboard';

  // Docentes
  docentes: Docente[] = [];
  docentesFiltrados: Docente[] = [];
  searchTermDocentes: string = '';
  loadingDocentes: boolean = false;

  // Estudiantes
  estudiantes: Estudiante[] = [];
  estudiantesFiltrados: Estudiante[] = [];
  searchTermEstudiantes: string = '';
  loadingEstudiantes: boolean = false;

  // Administradores
  administradores: Administrador[] = [];
  loadingAdmins: boolean = false;

  // Perfil
  adminPerfil: Administrador | null = null;
  loadingPerfil: boolean = false;

  // Chart
  dashboardChart: Chart | null = null;

  constructor(
    private authService: AuthService,
    private supabase: SupabaseService,
    private router: Router,
    private alertController: AlertController,
    private menuController: MenuController
=======
  loading = false;
  
  estadisticas = {
    totalDocentes: 0,
    totalEstudiantes: 0,
    totalAdministradores: 0
  };

  admin: any = {
    nombres: 'Administrador',
    apellidos: '',
    email: 'admin@example.com',
    rol: 'administrador'
  };

  constructor(
    private authService: AuthService,
    private supabaseService: SupabaseService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef,
    private router: Router
>>>>>>> 12b5483e3a772962cb6c43c35c1e4be0fc4d057f
  ) {
    // Register Chart.js components
    Chart.register(...registerables);
    addIcons({
      peopleOutline,
<<<<<<< HEAD
      people,
      schoolOutline,
      school,
      shieldCheckmarkOutline,
      shieldCheckmark,
      settingsOutline,
      logOutOutline,
      personOutline,
      gridOutline,
      eyeOutline,
      createOutline,
      chevronForwardOutline,
      refreshOutline,
      informationCircleOutline,
      flashOutline,
      mailOutline,
      callOutline,
      businessOutline,
      briefcaseOutline,
      barcodeOutline,
      statsChartOutline
=======
      schoolOutline,
      personOutline,
      logOutOutline,
      menuOutline,
      gridOutline,
      barChartOutline,
      arrowForwardOutline
>>>>>>> 12b5483e3a772962cb6c43c35c1e4be0fc4d057f
    });
  }

  async ngOnInit() {
    console.log('✅ Dashboard de Administrador cargado');
<<<<<<< HEAD
    await this.loadAllData();
    // Inicializar gráfica después de cargar datos
    setTimeout(() => this.initDashboardChart(), 500);
  }

  async ionViewWillEnter() {
    await this.loadAllData();
  }

  async loadAllData() {
    await this.loadAdminInfo();
    await this.loadStatistics();
  }

  async loadAdminInfo() {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();

      if (!user) {
        console.error('❌ No hay usuario autenticado');
        this.router.navigate(['/auth/login']);
        return;
      }

      const { data: adminData, error } = await this.supabase
        .from('administradores')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (adminData) {
        this.adminName = `${adminData.nombres} ${adminData.apellidos}`;
        console.log('✅ Administrador cargado:', this.adminName);
      }
    } catch (error) {
      console.error('❌ Error cargando información del admin:', error);
    }
  }

  async loadStatistics() {
    try {
      // Contar docentes
      const { count: docentesCount } = await this.supabase
        .from('docentes')
        .select('*', { count: 'exact', head: true });
      this.totalDocentes = docentesCount || 0;

      // Contar estudiantes
      const { count: estudiantesCount } = await this.supabase
        .from('estudiantes')
        .select('*', { count: 'exact', head: true });
      this.totalEstudiantes = estudiantesCount || 0;

      // Contar administradores
      const { count: adminsCount } = await this.supabase
        .from('administradores')
        .select('*', { count: 'exact', head: true });
      this.totalAdmins = adminsCount || 0;

      console.log('📊 Estadísticas cargadas:', {
        docentes: this.totalDocentes,
        estudiantes: this.totalEstudiantes,
        admins: this.totalAdmins
      });
    } catch (error) {
      console.error('❌ Error cargando estadísticas:', error);
    }
  }

  async handleRefresh(event?: any) {
    console.log('🔄 Refrescando datos...');

    // Solo recargar estadísticas generales
    await this.loadStatistics();

    // Recargar datos de la página actual solamente
    switch (this.selectedPage) {
      case 'dashboard':
        // Dashboard ya tiene las estadísticas
        break;
      case 'docentes':
        await this.loadDocentes();
        break;
      case 'estudiantes':
        await this.loadEstudiantes();
        break;
      case 'administradores':
        await this.loadAdministradores();
        break;
      case 'perfil':
        await this.loadPerfil();
        break;
    }

    if (event) {
      event.target.complete();
    }
  }

  async selectPage(page: string) {
    this.selectedPage = page;
    this.menuController.close();

    // Cargar datos según la página seleccionada SOLO si no están ya cargados
    switch (page) {
      case 'dashboard':
        // Dashboard ya tiene estadísticas cargadas
        break;
      case 'docentes':
        if (this.docentes.length === 0) {
          await this.loadDocentes();
        }
        break;
      case 'estudiantes':
        if (this.estudiantes.length === 0) {
          await this.loadEstudiantes();
        }
        break;
      case 'administradores':
        if (this.administradores.length === 0) {
          await this.loadAdministradores();
        }
        break;
      case 'perfil':
        if (!this.adminPerfil) {
          await this.loadPerfil();
        }
        break;
    }
  }

  // Docentes
  async loadDocentes() {
    this.loadingDocentes = true;
    try {
      const { data, error } = await this.supabase
        .from('docentes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      this.docentes = data || [];
      this.docentesFiltrados = this.docentes;
    } catch (error) {
      console.error('❌ Error cargando docentes:', error);
    } finally {
      this.loadingDocentes = false;
    }
  }

  filterDocentes() {
    const term = this.searchTermDocentes.toLowerCase().trim();
    if (!term) {
      this.docentesFiltrados = this.docentes;
      return;
    }
    this.docentesFiltrados = this.docentes.filter(d =>
      `${d.nombres} ${d.apellidos}`.toLowerCase().includes(term) ||
      d.email.toLowerCase().includes(term) ||
      d.entidad?.toLowerCase().includes(term)
    );
  }

  getDocenteAvatar(docente: Docente): string {
    const initials = `${docente.nombres.charAt(0)}${docente.apellidos.charAt(0)}`;
    return `https://ui-avatars.com/api/?name=${initials}&background=667eea&color=fff&size=200&bold=true&rounded=true`;
  }

  // Estudiantes
  async loadEstudiantes() {
    this.loadingEstudiantes = true;
    try {
      const { data, error } = await this.supabase
        .from('estudiantes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      this.estudiantes = data || [];
      this.estudiantesFiltrados = this.estudiantes;
    } catch (error) {
      console.error('❌ Error cargando estudiantes:', error);
    } finally {
      this.loadingEstudiantes = false;
    }
  }

  filterEstudiantes() {
    const term = this.searchTermEstudiantes.toLowerCase().trim();
    if (!term) {
      this.estudiantesFiltrados = this.estudiantes;
      return;
    }
    this.estudiantesFiltrados = this.estudiantes.filter(e =>
      `${e.nombres} ${e.apellidos}`.toLowerCase().includes(term) ||
      e.email.toLowerCase().includes(term) ||
      e.codigo?.toLowerCase().includes(term) ||
      e.programa?.toLowerCase().includes(term)
    );
  }

  getEstudianteAvatar(estudiante: Estudiante): string {
    const initials = `${estudiante.nombres.charAt(0)}${estudiante.apellidos.charAt(0)}`;
    return `https://ui-avatars.com/api/?name=${initials}&background=f5576c&color=fff&size=200&bold=true&rounded=true`;
  }

  // Administradores
  async loadAdministradores() {
    this.loadingAdmins = true;
    try {
      const { data, error } = await this.supabase
        .from('administradores')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      this.administradores = data || [];
    } catch (error) {
      console.error('❌ Error cargando administradores:', error);
    } finally {
      this.loadingAdmins = false;
    }
  }

  getAdminAvatar(admin: Administrador): string {
    if (admin.foto_url) return admin.foto_url;
    const initials = `${admin.nombres.charAt(0)}${admin.apellidos.charAt(0)}`;
    return `https://ui-avatars.com/api/?name=${initials}&background=4facfe&color=fff&size=200&bold=true&rounded=true`;
  }

  // Perfil
  async loadPerfil() {
    this.loadingPerfil = true;
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        this.router.navigate(['/auth/login']);
        return;
      }

      const { data, error } = await this.supabase
        .from('administradores')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      this.adminPerfil = data;
    } catch (error) {
      console.error('❌ Error cargando perfil:', error);
    } finally {
      this.loadingPerfil = false;
    }
  }

  getPerfilAvatar(): string {
    if (this.adminPerfil?.foto_url) return this.adminPerfil.foto_url;
    if (this.adminPerfil) {
      const initials = `${this.adminPerfil.nombres.charAt(0)}${this.adminPerfil.apellidos.charAt(0)}`;
      return `https://ui-avatars.com/api/?name=${initials}&background=10b981&color=fff&size=200&bold=true&rounded=true`;
    }
    return '';
  }

  getPageTitle(): string {
    const titles: { [key: string]: string } = {
      'dashboard': 'Panel de Administración',
      'docentes': 'Docentes Registrados',
      'estudiantes': 'Estudiantes Registrados',
      'administradores': 'Administradores del Sistema',
      'perfil': 'Mi Perfil'
    };
    return titles[this.selectedPage] || 'Dashboard';
  }

  getPageIcon(): string {
    const icons: { [key: string]: string } = {
      'dashboard': 'grid-outline',
      'docentes': 'people-outline',
      'estudiantes': 'school-outline',
      'administradores': 'shield-checkmark-outline',
      'perfil': 'person-outline'
    };
    return icons[this.selectedPage] || 'grid-outline';
  }

  initDashboardChart() {
    const canvas = document.getElementById('dashboardChart') as HTMLCanvasElement;
    if (!canvas) {
      console.warn('Canvas no encontrado, reintentando...');
      setTimeout(() => this.initDashboardChart(), 500);
      return;
    }

    // Destruir gráfica anterior si existe
    if (this.dashboardChart) {
      this.dashboardChart.destroy();
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: ['Docentes', 'Estudiantes', 'Administradores'],
        datasets: [{
          data: [this.totalDocentes, this.totalEstudiantes, this.totalAdmins],
          backgroundColor: [
            'rgba(102, 126, 234, 0.8)',  // Púrpura para docentes
            'rgba(245, 87, 108, 0.8)',   // Rosa para estudiantes
            'rgba(79, 172, 254, 0.8)'    // Azul para administradores
          ],
          borderColor: [
            'rgba(102, 126, 234, 1)',
            'rgba(245, 87, 108, 1)',
            'rgba(79, 172, 254, 1)'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = this.totalDocentes + this.totalEstudiantes + this.totalAdmins;
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    };

    this.dashboardChart = new Chart(ctx, config);
  }

  ngOnDestroy() {
    if (this.dashboardChart) {
      this.dashboardChart.destroy();
    }
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
=======
    this.loadDashboard();
  }

  async loadDashboard() {
    this.loading = true;
    console.log('🔄 Iniciando carga del dashboard...');
    
    try {
      // Cargar estadísticas
      console.log('📊 Cargando estadísticas...');
      await this.loadEstadisticas();
      
      // Cargar admin
      console.log('👤 Cargando datos del admin...');
      const user = await this.supabaseService.getCurrentUser();
      console.log('Usuario obtenido:', user?.id);
      
      if (user) {
        const { data: adminData } = await this.supabaseService.supabase
          .from('administradores')
          .select('nombres, apellidos, email, rol, puede_cerrar_app')
          .eq('user_id', user.id)
          .maybeSingle();

        if (adminData) {
          this.admin = adminData;
          this.adminName = adminData.nombres || 'Administrador';
          console.log('✅ Admin cargado:', this.admin);
        }
      }
      
      console.log('✅ Dashboard cargado completamente');
    } catch (error) {
      console.error('❌ Error cargando dashboard:', error);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
      console.log('🎉 Loading:', this.loading);
    }
  }

  async loadEstadisticas() {
    try {
      // Total de docentes
      const { count: docentes } = await this.supabaseService.supabase
        .from('docentes')
        .select('id', { count: 'exact', head: true });

      // Total de estudiantes
      const { count: estudiantes } = await this.supabaseService.supabase
        .from('estudiantes')
        .select('id', { count: 'exact', head: true });

      // Total de administradores
      const { count: administradores } = await this.supabaseService.supabase
        .from('administradores')
        .select('id', { count: 'exact', head: true });

      this.estadisticas = {
        totalDocentes: docentes || 0,
        totalEstudiantes: estudiantes || 0,
        totalAdministradores: administradores || 0
      };

      console.log('📊 Estadísticas cargadas:', this.estadisticas);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  }

  // 🆕 NUEVO: Método para navegar a estadísticas
  goToEstadisticas() {
    console.log('📊 Navegando a estadísticas...');
    this.router.navigate(['/admin/estadisticas']);
  }

  async logout() {
    try {
      this.loading = true;
      await this.authService.logout();
      this.toastService.showSuccess('Sesión cerrada correctamente');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      this.toastService.showError('Error al cerrar sesión');
    } finally {
      this.loading = false;
    }
  }

  getInitials(nombre: string): string {
    if (!nombre) return 'A';
    return nombre
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
>>>>>>> 12b5483e3a772962cb6c43c35c1e4be0fc4d057f
  }
}