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
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  settingsOutline,
  shieldCheckmark,
  shieldCheckmarkOutline,
  eyeOutline,
  refreshOutline,
  mailOutline,
  callOutline,
  businessOutline,
  schoolOutline,
  briefcaseOutline,
  calendarOutline
} from 'ionicons/icons';
import { SupabaseService } from '../../../services/supabase/supabase.service';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Administrador {
  id: string;
  user_id: string;
  email: string;
  nombres: string;
  apellidos: string;
  telefono?: string;
  entidad?: string;
  programa?: string;
  area?: string;
  foto_url?: string;
  created_at: string;
}

@Component({
  selector: 'app-admin-usuarios',
  templateUrl: './admin-usuarios.page.html',
  styleUrls: ['./admin-usuarios.page.scss'],
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
    IonRefresher,
    IonRefresherContent,
    IonSkeletonText,
    CommonModule,
    FormsModule
  ]
})
export class AdminUsuariosPage implements OnInit {
  administradores: Administrador[] = [];
  loading: boolean = true;

  constructor(private supabase: SupabaseService) {
    addIcons({
      settingsOutline,
      shieldCheckmark,
      shieldCheckmarkOutline,
      eyeOutline,
      refreshOutline,
      mailOutline,
      callOutline,
      businessOutline,
      schoolOutline,
      briefcaseOutline,
      calendarOutline
    });
  }

  async ngOnInit() {
    await this.loadAdministradores();
  }

  async ionViewWillEnter() {
    await this.loadAdministradores();
  }

  async loadAdministradores() {
    this.loading = true;
    try {
      const { data, error } = await this.supabase
        .from('administradores')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      this.administradores = data || [];
      console.log('✅ Administradores cargados:', this.administradores.length);
    } catch (error) {
      console.error('❌ Error cargando administradores:', error);
      this.administradores = [];
    } finally {
      this.loading = false;
    }
  }

  async handleRefresh(event?: any) {
    await this.loadAdministradores();
    if (event) {
      event.target.complete();
    }
  }

  getNombreCompleto(admin: Administrador): string {
    return `${admin.nombres} ${admin.apellidos}`;
  }

  getAvatarUrl(admin: Administrador): string {
    if (admin.foto_url) {
      return admin.foto_url;
    }
    const initials = `${admin.nombres.charAt(0)}${admin.apellidos.charAt(0)}`;
    return `https://ui-avatars.com/api/?name=${initials}&background=4facfe&color=fff&size=200&bold=true&rounded=true`;
  }

  formatDate(dateString: string): string {
    try {
      return format(new Date(dateString), "d 'de' MMMM, yyyy", { locale: es });
    } catch {
      return 'Fecha no disponible';
    }
  }
}
