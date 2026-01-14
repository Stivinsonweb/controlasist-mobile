import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full',
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./pages/auth/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./pages/auth/register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'auth/registro-estudiante',
    loadComponent: () => import('./pages/auth/registro-estudiante/registro-estudiante.page').then((m) => m.RegistroEstudiantePage),
  },
  {
    path: 'estudiante/home',
    loadComponent: () => import('./pages/estudiantes/home/home.page').then((m) => m.HomeEstudiantePage),
  },
  {
    path: 'estudiante/perfil',
    loadComponent: () => import('./pages/estudiantes/perfil/perfil.page').then((m) => m.PerfilEstudiantePage),
  },
  {
    path: 'estudiante/inscribir',
    loadComponent: () => import('./pages/estudiantes/inscribir/inscribir.page').then((m) => m.InscribirPage),
  },
  {
    path: 'estudiante/datos-inscripcion',
    loadComponent: () => import('./pages/estudiantes/datos-inscripcion/datos-inscripcion.page').then((m) => m.DatosInscripcionPage),
  },
  {
    path: 'auth/reset-password',
    loadComponent: () => import('./pages/auth/reset-password/reset-password.page').then((m) => m.ResetPasswordPage),
  },
  {
    path: 'admin/dashboard',
    loadComponent: () => import('./pages/admin/dashboard/dashboard.page').then((m) => m.DashboardPage),
  },
  {
    path: 'asignaturas/crear',
    loadComponent: () => import('./pages/asignaturas/crear/crear.page').then((m) => m.CrearPage),
  },
  {
    path: 'asignaturas/detalle/:id',
    loadComponent: () => import('./pages/asignaturas/detalle/detalle.page').then((m) => m.DetallePage),
  },
  {
    path: 'asignaturas/editar/:id',
    loadComponent: () => import('./pages/asignaturas/editar/editar.page').then((m) => m.EditarPage),
  },
  {
    path: 'reportes/:id',
    loadComponent: () => import('./pages/reportes/reportes.page').then((m) => m.ReportesPage),
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage),
  },  {
    path: 'admin-perfil',
    loadComponent: () => import('./pages/admin/admin-perfil/admin-perfil.page').then( m => m.AdminPerfilPage)
  },
  {
    path: 'admin-docentes',
    loadComponent: () => import('./pages/admin/admin-docentes/admin-docentes.page').then( m => m.AdminDocentesPage)
  },
  {
    path: 'admin-estudiantes',
    loadComponent: () => import('./pages/admin/admin-estudiantes/admin-estudiantes.page').then( m => m.AdminEstudiantesPage)
  },
  {
    path: 'admin-usuarios',
    loadComponent: () => import('./pages/admin/admin-usuarios/admin-usuarios.page').then( m => m.AdminUsuariosPage)
  },

];