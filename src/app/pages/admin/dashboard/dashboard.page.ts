import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { 
  IonContent, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonButton,
  IonCard,
  IonCardContent,
  IonIcon,
  IonSpinner,
  IonMenu,
  IonMenuButton,
  IonMenuToggle,
  IonList,
  IonItem,
  IonLabel,
  IonButtons
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  peopleOutline,
  schoolOutline,
  personOutline,
  logOutOutline,
  menuOutline,
  gridOutline,
  barChartOutline,
  arrowForwardOutline
} from 'ionicons/icons';
import { SupabaseService } from '../../../services/supabase/supabase.service';
import { ToastService } from '../../../services/toast.service';
import { AuthService } from '../../../services/auth/auth.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonCard,
    IonCardContent,
    IonIcon,
    IonSpinner,
    IonMenu,
    IonMenuButton,
    IonMenuToggle,
    IonList,
    IonItem,
    IonLabel,
    IonButtons
  ]
})
export class DashboardPage implements OnInit {
  adminName: string = 'Administrador';
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
  ) {
    addIcons({
      peopleOutline,
      schoolOutline,
      personOutline,
      logOutOutline,
      menuOutline,
      gridOutline,
      barChartOutline,
      arrowForwardOutline
    });
  }

  ngOnInit() {
    console.log('✅ Dashboard de Administrador cargado');
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
  }
}