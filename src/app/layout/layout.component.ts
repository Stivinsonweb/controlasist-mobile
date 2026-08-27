import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { SwUpdate } from '@angular/service-worker';
import { AuthService, UserProfile } from '../core/services/auth.service';
import { ToastService } from '../core/services/toast.service';
import { ConfiguracionAppService } from '../core/services/configuracion-app.service';
import { environment } from '../../environments/environment';
import { AvatarComponent } from '../shared/components/avatar/avatar.component';
import { InstallPwaButtonComponent } from '../shared/components/install-pwa-button/install-pwa-button.component';
import { AccentThemeService } from '../core/services/accent-theme.service';
import { ThemeService, TemaPreferencia } from '../core/services/theme.service';
import { LogoComponent } from '../shared/components/logo/logo.component';

interface NavItem {
  label: string;
  route: string;
  icon: string; // svg path data
  roles: Array<'docente' | 'administrador' | 'estudiante'>;
  /** Si se indica, el ítem solo se muestra si el perfil tiene ALGUNO de estos flags en `true` (solo aplica a administradores). */
  permisos?: (keyof UserProfile)[];
  /** Ítem visible pero bloqueado (sección Premium aún no habilitada). */
  locked?: boolean;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, AvatarComponent, InstallPwaButtonComponent, LogoComponent],
  template: `
    <div class="flex h-screen w-full overflow-hidden" style="background: var(--bg-app);">
      <!-- Sidebar -->
      <aside
        class="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r transition-transform duration-200 lg:static lg:translate-x-0"
        style="background: var(--bg-surface); border-color: var(--border-subtle);"
        [class.-translate-x-full]="!sidebarOpen()">
        <div class="flex h-16 shrink-0 items-center gap-2 border-b px-5" style="border-color: var(--border-subtle);">
          <app-logo sizeClass="h-11 w-11 rounded-xl shadow-dark-soft" />
          <div>
            <p class="text-sm font-bold leading-none" style="color: var(--text-primary);">ControlAsist</p>
            <p class="text-[11px] capitalize" style="color: var(--text-muted);">Panel {{ role() }}</p>
          </div>
        </div>

        <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <ng-container *ngFor="let item of visibleItems()">
            <a *ngIf="!item.locked"
               [routerLink]="item.route"
               routerLinkActive="nav-active"
               [routerLinkActiveOptions]="{ exact: false }"
               class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
               style="color: var(--text-secondary);">
              <svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="item.icon" />
              </svg>
              {{ item.label }}
            </a>
            <a *ngIf="item.locked"
               [routerLink]="item.route"
               routerLinkActive="nav-active"
               [routerLinkActiveOptions]="{ exact: false }"
               class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
               style="color: var(--text-muted);">
              <svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="item.icon" />
              </svg>
              <span class="flex-1">{{ item.label }}</span>
              <svg class="h-4 w-4 shrink-0" aria-label="Función bloqueada" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <title>Próximamente</title>
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </a>
          </ng-container>
        </nav>

        <div class="border-t p-3" style="border-color: var(--border-subtle);">
          <app-install-pwa-button />
          <button (click)="logout()"
                  class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10">
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            Cerrar sesión
          </button>
          <p class="mt-2 flex items-center justify-center gap-1.5 text-center text-[11px]" style="color: var(--text-muted);">
            Desarrollado por Stivinson
            <a href="https://instagram.com/stivinson_fullstack" target="_blank" rel="noopener noreferrer"
               aria-label="Instagram de Stivinson" class="transition-colors hover:text-primary-400" style="color: var(--text-muted);">
              <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <rect x="3" y="3" width="18" height="18" rx="5" stroke-linecap="round" stroke-linejoin="round" />
                <circle cx="12" cy="12" r="4" stroke-linecap="round" stroke-linejoin="round" />
                <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none" />
              </svg>
            </a>
          </p>
        </div>
      </aside>

      <div *ngIf="sidebarOpen()" (click)="sidebarOpen.set(false)" class="fixed inset-0 z-30 bg-black/50 lg:hidden"></div>

      <!-- Main -->
      <div class="flex min-w-0 flex-1 flex-col">
        <div *ngIf="mostrarActualizacion()" class="flex shrink-0 items-center justify-between gap-3 bg-amber-500 px-4 py-2 text-sm font-medium text-white lg:px-6">
          <span>Hay una nueva versión de ControlAsist disponible.</span>
          <button (click)="actualizarAhora()" class="rounded-lg bg-white/20 px-3 py-1 text-xs font-bold hover:bg-white/30">Actualizar ahora</button>
        </div>
        <header class="flex h-16 shrink-0 items-center justify-between border-b px-4 lg:px-6" style="background: var(--bg-surface); border-color: var(--border-subtle);">
          <div class="flex min-w-0 items-center gap-3">
            <button (click)="sidebarOpen.set(!sidebarOpen())" class="shrink-0 rounded-lg p-2 hover:bg-white/5 lg:hidden" style="color: var(--text-secondary);">
              <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
              </svg>
            </button>
            <h1 class="truncate text-base font-bold" style="color: var(--text-primary);">{{ currentTitle() }}</h1>
          </div>
          <div class="flex items-center gap-3">
            <div class="relative">
              <button type="button" (click)="temaMenuAbierto.set(!temaMenuAbierto())" title="Apariencia"
                      class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-white/5" style="color: var(--text-secondary);">
                <svg *ngIf="tema() !== 'claro'" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.72 9.72 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
                <svg *ngIf="tema() === 'claro'" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-6.364-.386 1.591-1.591M3 12h2.25m.386-6.364 1.591 1.591M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <div *ngIf="temaMenuAbierto()" class="fixed inset-0 z-40" (click)="temaMenuAbierto.set(false)"></div>
              <div *ngIf="temaMenuAbierto()"
                   class="absolute right-0 top-11 z-50 w-40 overflow-hidden rounded-xl border shadow-dark-soft"
                   style="background: var(--bg-surface-2); border-color: var(--border-subtle-2);">
                <button *ngFor="let opt of opcionesTema" type="button" (click)="elegirTema(opt.valor)"
                        class="flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-white/5"
                        [style.color]="tema() === opt.valor ? 'var(--accent-from)' : 'var(--text-secondary)'">
                  {{ opt.label }}
                  <svg *ngIf="tema() === opt.valor" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                </button>
              </div>
            </div>
            <a routerLink="/guia" title="¿Cómo funciona?"
               class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-white/5" style="color: var(--text-secondary);">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zM12 17.25h.008v.008H12v-.008z" />
              </svg>
            </a>
            <div class="text-right hidden sm:block">
              <p class="text-sm font-semibold leading-none" style="color: var(--text-primary);">{{ nombreCompleto() }}</p>
              <p class="text-xs capitalize" style="color: var(--text-muted);">{{ role() }}</p>
            </div>
            <app-avatar [fotoUrl]="profile()?.foto_url" [iniciales]="iniciales()" colorFondo="var(--accent-from)" textColor="#ffffff" sizeClass="h-10 w-10 text-sm" [ring]="true" />
          </div>
        </header>

        <main class="flex-1 overflow-y-auto p-4 lg:p-8">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .nav-active {
      color: #fff !important;
      background: linear-gradient(135deg, var(--accent-from), var(--accent-to));
      box-shadow: 0 6px 18px -6px rgba(16, 185, 129, 0.5);
    }
    .nav-active:hover { color: #fff !important; }
    a:not(.nav-active):hover { background: rgba(255, 255, 255, 0.05); color: var(--text-primary) !important; }
  `],
})
export class LayoutComponent implements OnInit {
  sidebarOpen = signal(false);
  profile = signal<UserProfile | null>(null);
  currentTitle = signal('');
  mostrarActualizacion = signal(false);

  temaMenuAbierto = signal(false);
  opcionesTema: Array<{ valor: TemaPreferencia; label: string }> = [
    { valor: 'oscuro', label: 'Oscuro' },
    { valor: 'claro', label: 'Claro' },
    { valor: 'sistema', label: 'Sistema' },
  ];

  private navItems: NavItem[] = [
    { label: 'Dashboard', route: '/admin/dashboard', icon: 'M3.75 6a2.25 2.25 0 012.25-2.25h12A2.25 2.25 0 0120.25 6v12a2.25 2.25 0 01-2.25 2.25h-12A2.25 2.25 0 013.75 18V6zM3.75 12h16.5', roles: ['administrador'] },
    { label: 'Inicio', route: '/home', icon: 'M2.25 12l8.954-8.955a1.5 1.5 0 012.122 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75', roles: ['docente'] },
    { label: 'Mis asignaturas', route: '/home', icon: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25', roles: ['docente'] },
    { label: 'Docentes', route: '/admin/docentes', icon: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z', roles: ['administrador'], permisos: ['puede_gestionar_docentes'] },
    { label: 'Premium', route: '/admin/premium', icon: 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z', roles: ['administrador'], permisos: ['puede_gestionar_docentes'] },
    { label: 'Estudiantes', route: '/admin/estudiantes', icon: 'M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342', roles: ['administrador'] },
    { label: 'Estadísticas', route: '/admin/estadisticas', icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z', roles: ['administrador'], permisos: ['puede_ver_reportes'] },
    { label: 'Configuración', route: '/admin/configuracion', icon: 'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28z M15 12a3 3 0 11-6 0 3 3 0 016 0z', roles: ['administrador'], permisos: ['puede_modificar_config', 'puede_cerrar_app', 'puede_forzar_actualizacion'] },
    { label: 'Mi perfil', route: '/docente/perfil', icon: 'M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z', roles: ['docente'] },
    { label: 'Mi perfil', route: '/admin/perfil', icon: 'M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z', roles: ['administrador'] },
    { label: 'Inicio', route: '/estudiante/home', icon: 'M2.25 12l8.954-8.955a1.5 1.5 0 012.122 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75', roles: ['estudiante'] },
    { label: 'Mi asistencia', route: '/estudiante/asistencia', icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z', roles: ['estudiante'] },
    { label: 'Inscribir asignatura', route: '/estudiante/inscribir', icon: 'M12 4.5v15m7.5-7.5h-15', roles: ['estudiante'] },
    { label: 'Mi perfil', route: '/estudiante/perfil', icon: 'M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z', roles: ['estudiante'] },
    // TEMPORAL: Premium abierto a todos los docentes hasta conectar Wompi — ver PARTE 2 del
    // contexto. `PREMIUM_ENABLED`/`locked` se ignoran a propósito mientras tanto; cuando Wompi
    // esté listo, volver a `locked: !PREMIUM_ENABLED` y restaurar el chequeo de premium_activo.
    // También exclusivo de docente (antes aparecía para los 3 roles).
    { label: 'Premium', route: '/premium', icon: 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.456-2.456L14.25 6l1.035-.259a3.375 3.375 0 002.456-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z', roles: ['docente'], locked: false },
  ];

  constructor(
    private auth: AuthService,
    private router: Router,
    private toast: ToastService,
    private configuracionService: ConfiguracionAppService,
    private accentTheme: AccentThemeService,
    private themeService: ThemeService,
    private swUpdate: SwUpdate
  ) {}

  tema() {
    return this.themeService.preferencia();
  }

  elegirTema(p: TemaPreferencia) {
    this.themeService.setPreferencia(p);
    this.temaMenuAbierto.set(false);
  }

  ngOnInit() {
    this.auth.currentProfile$.subscribe((p) => {
      this.profile.set(p);
      this.accentTheme.apply(p?.rol === 'docente' ? p.tema_acento : null);
    });
    this.updateTitle(this.router.url);
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe((e) => {
      this.updateTitle((e as NavigationEnd).urlAfterRedirects);
    });

    this.configuracionService.obtener()
      .then((config) => {
        if (config?.requiere_actualizacion && config.version_actual && config.version_actual !== environment.appVersion) {
          this.mostrarActualizacion.set(true);
        }
      })
      .catch((e) => console.error('Error verificando versión de la app:', e));

    this.iniciarDeteccionActualizacionesPWA();
  }

  /**
   * El Service Worker de Angular por defecto solo revisa si hay una versión nueva del build al
   * navegar, y aunque la descargue en segundo plano, NO la aplica hasta el siguiente arranque
   * completo de la app — en una PWA instalada que se queda "reanudada" en segundo plano (no se
   * cierra de verdad), eso hacía que el usuario nunca viera los cambios. Aquí se revisa
   * activamente (al iniciar, al volver de segundo plano, y cada 15 min) y en cuanto hay una
   * versión lista se reutiliza el mismo banner de "Actualizar ahora" — sin esto, tocaba cerrar y
   * volver a abrir la app varias veces para que sirviera.
   */
  private iniciarDeteccionActualizacionesPWA() {
    if (!this.swUpdate.isEnabled) return;

    this.swUpdate.versionUpdates.pipe(filter((evt) => evt.type === 'VERSION_READY')).subscribe(() => {
      this.mostrarActualizacion.set(true);
    });

    const revisar = () => this.swUpdate.checkForUpdate().catch(() => {});
    revisar();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') revisar();
    });
    setInterval(revisar, 15 * 60 * 1000);
  }

  async actualizarAhora() {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((r) => r.unregister()));
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
    window.location.reload();
  }

  private updateTitle(url: string) {
    const match = this.navItems.find((i) => url.startsWith(i.route));
    this.currentTitle.set(match?.label ?? 'ControlAsist');
  }

  role() {
    return this.profile()?.rol ?? '';
  }

  nombreCompleto() {
    const p = this.profile();
    return p ? `${p.nombres ?? ''} ${p.apellidos ?? ''}`.trim() : 'Usuario';
  }

  iniciales() {
    const p = this.profile();
    if (!p) return 'U';
    return `${(p.nombres?.[0] ?? '').toUpperCase()}${(p.apellidos?.[0] ?? '').toUpperCase()}`;
  }

  visibleItems() {
    const r = this.role();
    const p = this.profile();
    return this.navItems.filter((i) => {
      if (!i.roles.includes(r as any)) return false;
      if (!i.permisos) return true;
      return i.permisos.some((flag) => p?.[flag]);
    });
  }

  async logout() {
    await this.auth.logout();
    this.toast.info('Sesión cerrada correctamente');
  }
}
