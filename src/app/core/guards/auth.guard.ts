import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';
import { AuthService, type UserProfile } from '../services/auth.service';

export const authGuard: CanActivateFn = async () => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  const session = await supabase.getSession();
  if (session) return true;

  router.navigate(['/auth/login']);
  return false;
};

export const guestGuard: CanActivateFn = async () => {
  const supabase = inject(SupabaseService);
  const authService = inject(AuthService);
  const router = inject(Router);

  const session = await supabase.getSession();
  if (!session) return true;

  const profile = await authService.resolveProfile(session.user.id);
  router.navigate([profile ? homeForRol(profile.rol) : '/auth/login']);
  return false;
};

function homeForRol(rol: UserProfile['rol']): string {
  if (rol === 'estudiante') return '/estudiante/home';
  if (rol === 'administrador') return '/admin/dashboard';
  return '/home';
}

/** Restringe una ruta a uno o más roles, resolviendo el rol de la sesión activa. */
export const roleGuard = (...roles: UserProfile['rol'][]): CanActivateFn => {
  return async () => {
    const supabase = inject(SupabaseService);
    const authService = inject(AuthService);
    const router = inject(Router);

    const session = await supabase.getSession();
    if (!session) {
      router.navigate(['/auth/login']);
      return false;
    }

    const profile = await authService.resolveProfile(session.user.id);
    if (profile && roles.includes(profile.rol)) return true;

    router.navigate([profile ? homeForRol(profile.rol) : '/auth/login']);
    return false;
  };
};

/** Restringe una ruta de administrador a quienes tengan el flag de permiso en `true`. */
export const permissionGuard = (flag: keyof UserProfile): CanActivateFn => {
  return async () => {
    const supabase = inject(SupabaseService);
    const authService = inject(AuthService);
    const router = inject(Router);

    const session = await supabase.getSession();
    if (!session) {
      router.navigate(['/auth/login']);
      return false;
    }

    const profile = await authService.resolveProfile(session.user.id);
    if (profile?.rol === 'administrador' && profile[flag]) return true;

    router.navigate([profile ? homeForRol(profile.rol) : '/auth/login']);
    return false;
  };
};

/** Igual que `permissionGuard` pero basta con que se cumpla alguno de los flags indicados. */
export const anyPermissionGuard = (...flags: (keyof UserProfile)[]): CanActivateFn => {
  return async () => {
    const supabase = inject(SupabaseService);
    const authService = inject(AuthService);
    const router = inject(Router);

    const session = await supabase.getSession();
    if (!session) {
      router.navigate(['/auth/login']);
      return false;
    }

    const profile = await authService.resolveProfile(session.user.id);
    if (profile?.rol === 'administrador' && flags.some((f) => profile[f])) return true;

    router.navigate([profile ? homeForRol(profile.rol) : '/auth/login']);
    return false;
  };
};
