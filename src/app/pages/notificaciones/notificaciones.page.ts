import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NotificacionesService, Notificacion } from '../../core/services/notificaciones.service';
import { AuthService } from '../../core/services/auth.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { ToastService } from '../../core/services/toast.service';
import { NotificacionesPushToggleComponent } from '../../shared/components/notificaciones-push-toggle/notificaciones-push-toggle.component';

type Categoria = 'alertas' | 'clases' | 'premium' | 'cuenta' | 'otras';
type Filtro = 'todas' | 'no-leidas' | Categoria;

interface CategoriaInfo {
  label: string;
  color: string;
  /** Path SVG (24x24, stroke). */
  icono: string;
}

const CATEGORIAS: Record<Categoria, CategoriaInfo> = {
  alertas: {
    label: 'Alertas',
    color: '#ef4444',
    icono: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z',
  },
  clases: {
    label: 'Clases',
    color: '#3b82f6',
    icono: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5',
  },
  premium: {
    label: 'Premium',
    color: '#8b5cf6',
    icono: 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z',
  },
  cuenta: {
    label: 'Cuenta',
    color: '#10b981',
    icono: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
  },
  otras: {
    label: 'Otras',
    color: '#64748b',
    icono: 'M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0',
  },
};

const POR_PAGINA = 30;

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [CommonModule, RouterLink, NotificacionesPushToggleComponent],
  templateUrl: './notificaciones.page.html',
})
export class NotificacionesPage implements OnInit {
  loading = signal(true);
  cargandoMas = signal(false);
  hayMas = signal(false);
  notificaciones = signal<Notificacion[]>([]);
  filtro = signal<Filtro>('todas');
  rol: 'docente' | 'estudiante' = 'docente';
  usuarioId = '';

  noLeidas = computed(() => this.notificacionesService.noLeidas());

  /** Solo se muestran los filtros de categorías que tienen al menos una notificación cargada. */
  filtrosCategoria = computed(() => {
    const presentes = new Set(this.notificaciones().map((n) => this.categoria(n)));
    return (Object.keys(CATEGORIAS) as Categoria[]).filter((c) => presentes.has(c));
  });

  visibles = computed(() => {
    const f = this.filtro();
    return this.notificaciones().filter((n) =>
      f === 'todas' ? true : f === 'no-leidas' ? !n.leida : this.categoria(n) === f
    );
  });

  /** Agrupa por día: Hoy, Ayer o la fecha. */
  grupos = computed(() => {
    const grupos: { titulo: string; items: Notificacion[] }[] = [];
    for (const n of this.visibles()) {
      const titulo = this.tituloDia(n.created_at);
      const ultimo = grupos[grupos.length - 1];
      if (ultimo && ultimo.titulo === titulo) ultimo.items.push(n);
      else grupos.push({ titulo, items: [n] });
    }
    return grupos;
  });

  constructor(
    private notificacionesService: NotificacionesService,
    private authService: AuthService,
    private supabaseService: SupabaseService,
    private toast: ToastService
  ) {}

  async ngOnInit() {
    const perfil = this.authService.currentProfileValue;
    this.rol = perfil?.rol === 'estudiante' ? 'estudiante' : 'docente';
    const user = await this.supabaseService.getCurrentUser();
    this.usuarioId = user?.id || '';

    try {
      const lista = await this.notificacionesService.listar(POR_PAGINA);
      this.notificaciones.set(lista);
      this.hayMas.set(lista.length === POR_PAGINA);
      await this.notificacionesService.refrescarNoLeidas();
    } catch (e) {
      console.error('Error cargando notificaciones:', e);
      this.toast.error('No se pudieron cargar tus notificaciones');
    } finally {
      this.loading.set(false);
    }
  }

  async cargarMas() {
    this.cargandoMas.set(true);
    try {
      const lista = await this.notificacionesService.listar(POR_PAGINA, this.notificaciones().length);
      this.notificaciones.update((actual) => [...actual, ...lista]);
      this.hayMas.set(lista.length === POR_PAGINA);
    } catch {
      this.toast.error('No se pudieron cargar más notificaciones');
    } finally {
      this.cargandoMas.set(false);
    }
  }

  categoria(n: Notificacion): Categoria {
    if (n.tipo.startsWith('riesgo_asistencia')) return 'alertas';
    if (n.tipo === 'recordatorio_clase') return 'clases';
    if (n.tipo.startsWith('premium')) return 'premium';
    if (n.tipo.startsWith('verificacion')) return 'cuenta';
    return 'otras';
  }

  info(n: Notificacion): CategoriaInfo {
    return CATEGORIAS[this.categoria(n)];
  }

  labelFiltro(c: Categoria): string {
    return CATEGORIAS[c].label;
  }

  /** A dónde lleva "Ver" según el tipo y el rol. */
  enlace(n: Notificacion): string | null {
    const c = this.categoria(n);
    if (c === 'alertas') return this.rol === 'estudiante' ? '/estudiante/asistencia' : '/home';
    if (c === 'clases') return this.rol === 'estudiante' ? '/estudiante/home' : '/home';
    if (c === 'premium' && this.rol === 'docente') return '/premium';
    if (c === 'cuenta' && this.rol === 'docente') return '/docente/perfil';
    return null;
  }

  async marcarLeida(n: Notificacion) {
    if (n.leida) return;
    try {
      await this.notificacionesService.marcarLeida(n.id);
      this.notificaciones.update((lista) => lista.map((x) => (x.id === n.id ? { ...x, leida: true } : x)));
      this.notificacionesService.noLeidas.update((c) => Math.max(0, c - 1));
    } catch {
      // No crítico.
    }
  }

  async marcarTodasLeidas() {
    try {
      await this.notificacionesService.marcarTodasLeidas();
      this.notificaciones.update((lista) => lista.map((x) => ({ ...x, leida: true })));
      this.toast.success('Todas las notificaciones quedaron como leídas');
    } catch {
      this.toast.error('No se pudieron marcar como leídas');
    }
  }

  async eliminar(n: Notificacion, event: Event) {
    event.stopPropagation();
    try {
      await this.notificacionesService.eliminar(n.id);
      this.notificaciones.update((lista) => lista.filter((x) => x.id !== n.id));
      if (!n.leida) this.notificacionesService.noLeidas.update((c) => Math.max(0, c - 1));
    } catch {
      this.toast.error('No se pudo eliminar la notificación');
    }
  }

  private tituloDia(fecha: string): string {
    const d = new Date(fecha);
    const hoy = new Date();
    const ayer = new Date();
    ayer.setDate(hoy.getDate() - 1);
    if (d.toDateString() === hoy.toDateString()) return 'Hoy';
    if (d.toDateString() === ayer.toDateString()) return 'Ayer';
    return d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: d.getFullYear() === hoy.getFullYear() ? undefined : 'numeric' });
  }

  hora(fecha: string): string {
    return new Date(fecha).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' });
  }
}
