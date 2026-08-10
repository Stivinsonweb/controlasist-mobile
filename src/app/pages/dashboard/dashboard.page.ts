import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';
import { AuthService } from '../../core/services/auth.service';

interface StatCard {
  label: string;
  value: number;
  icon: string;
  gradient: string;
  shadow: string;
  route: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.page.html',
})
export class DashboardPage implements OnInit {
  loading = signal(true);
  error = signal(false);
  stats = signal<StatCard[]>([]);
  nombre = signal('Administrador');

  constructor(private supabaseService: SupabaseService, private auth: AuthService) {}

  ngOnInit() {
    this.auth.currentProfile$.subscribe((p) => {
      if (p?.nombres) this.nombre.set(p.nombres);
    });
    this.loadStats();
  }

  async loadStats() {
    this.loading.set(true);
    this.error.set(false);
    try {
      const [{ count: docentes }, { count: estudiantes }, { count: administradores }] = await Promise.all([
        this.supabaseService.supabase.from('docentes').select('id', { count: 'exact', head: true }),
        this.supabaseService.supabase.from('estudiantes').select('id', { count: 'exact', head: true }),
        this.supabaseService.supabase.from('administradores').select('id', { count: 'exact', head: true }),
      ]);

      this.stats.set([
        {
          label: 'Docentes registrados',
          value: docentes ?? 0,
          icon: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
          gradient: 'linear-gradient(135deg, #10b981 0%, #0d9488 100%)',
          shadow: '0 10px 28px -10px rgba(16, 185, 129, 0.45)',
          route: '/admin/docentes',
        },
        {
          label: 'Estudiantes registrados',
          value: estudiantes ?? 0,
          icon: 'M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342',
          gradient: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
          shadow: '0 10px 28px -10px rgba(59, 130, 246, 0.45)',
          route: '/admin/estudiantes',
        },
        {
          label: 'Administradores',
          value: administradores ?? 0,
          icon: 'M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z',
          gradient: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
          shadow: '0 10px 28px -10px rgba(139, 92, 246, 0.45)',
          route: '/admin/perfil',
        },
      ]);
    } catch (e) {
      console.error('Error cargando estadísticas del dashboard', e);
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }
}
