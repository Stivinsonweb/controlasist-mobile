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
    path: 'home',
    loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage),
  },
];