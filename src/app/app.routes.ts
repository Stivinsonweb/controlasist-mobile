import { Routes } from '@angular/router';
import { anyPermissionGuard, authGuard, guestGuard, permissionGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },

  // ===== AUTH (público) =====
  {
    path: 'auth/login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/auth/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'auth/register',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/auth/register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'auth/registro-estudiante',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/auth/registro-estudiante/registro-estudiante.page').then((m) => m.RegistroEstudiantePage),
  },
  {
    path: 'auth/reset-password',
    loadComponent: () => import('./pages/auth/reset-password/reset-password.page').then((m) => m.ResetPasswordPage),
  },

  // ===== Accesibles con o sin sesión (fuera del layout con sidebar) =====
  {
    path: 'guia',
    loadComponent: () => import('./pages/guia/guia.page').then((m) => m.GuiaPage),
  },
  {
    path: 'soporte',
    loadComponent: () => import('./pages/soporte/soporte.page').then((m) => m.SoportePage),
  },

  // ===== ÁREA PROTEGIDA (con layout / sidebar) =====
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/layout.component').then((m) => m.LayoutComponent),
    children: [
      { path: 'home', canActivate: [roleGuard('docente')], loadComponent: () => import('./pages/home/home.page').then((m) => m.HomeDocentePage) },
      { path: 'docente/perfil', canActivate: [roleGuard('docente')], loadComponent: () => import('./pages/docente/perfil/perfil.page').then((m) => m.DocentePerfilPage) },

      // Admin
      { path: 'admin/dashboard', canActivate: [roleGuard('administrador')], loadComponent: () => import('./pages/dashboard/dashboard.page').then((m) => m.DashboardPage) },
      { path: 'admin/perfil', canActivate: [roleGuard('administrador')], loadComponent: () => import('./pages/admin/admin-perfil/admin-perfil.page').then((m) => m.AdminPerfilPage) },
      { path: 'admin/estadisticas', canActivate: [roleGuard('administrador'), permissionGuard('puede_ver_reportes')], loadComponent: () => import('./pages/admin/admin-estadisticas/admin-estadisticas.page').then((m) => m.AdminEstadisticasPage) },
      { path: 'admin/docentes', canActivate: [roleGuard('administrador'), permissionGuard('puede_gestionar_docentes')], loadComponent: () => import('./pages/admin/admin-docentes/admin-docentes.page').then((m) => m.AdminDocentesPage) },
      { path: 'admin/estudiantes', canActivate: [roleGuard('administrador')], loadComponent: () => import('./pages/admin/admin-estudiantes/admin-estudiantes.page').then((m) => m.AdminEstudiantesPage) },
      { path: 'admin/configuracion', canActivate: [roleGuard('administrador'), anyPermissionGuard('puede_modificar_config', 'puede_cerrar_app', 'puede_forzar_actualizacion')], loadComponent: () => import('./pages/admin/admin-configuracion/admin-configuracion.page').then((m) => m.AdminConfiguracionPage) },

      // Asignaturas (docente)
      { path: 'asignaturas/crear', canActivate: [roleGuard('docente')], loadComponent: () => import('./pages/asignaturas/crear/crear.page').then((m) => m.CrearAsignaturaPage) },
      { path: 'asignaturas/detalle/:id', canActivate: [roleGuard('docente')], loadComponent: () => import('./pages/asignaturas/detalle/detalle.page').then((m) => m.DetalleAsignaturaPage) },
      { path: 'asignaturas/editar/:id', canActivate: [roleGuard('docente')], loadComponent: () => import('./pages/asignaturas/editar/editar.page').then((m) => m.EditarAsignaturaPage) },
      { path: 'reportes/:id', canActivate: [roleGuard('docente')], loadComponent: () => import('./pages/reportes/reportes.page').then((m) => m.ReportesPage) },

      // Estudiante
      { path: 'estudiante/home', canActivate: [roleGuard('estudiante')], loadComponent: () => import('./pages/estudiante/home/home.page').then((m) => m.EstudianteHomePage) },
      { path: 'estudiante/perfil', canActivate: [roleGuard('estudiante')], loadComponent: () => import('./pages/estudiante/perfil/perfil.page').then((m) => m.EstudiantePerfilPage) },
      { path: 'estudiante/inscribir', canActivate: [roleGuard('estudiante')], loadComponent: () => import('./pages/estudiante/inscribir/inscribir.page').then((m) => m.InscribirPage) },
      { path: 'estudiante/datos-inscripcion', canActivate: [roleGuard('estudiante')], loadComponent: () => import('./pages/estudiante/datos-inscripcion/datos-inscripcion.page').then((m) => m.DatosInscripcionPage) },

      // Premium (placeholder deshabilitado — ver core/config/premium.config.ts)
      { path: 'premium', loadComponent: () => import('./pages/premium/premium.page').then((m) => m.PremiumPage) },
    ],
  },

  { path: '**', redirectTo: 'auth/login' },
];
