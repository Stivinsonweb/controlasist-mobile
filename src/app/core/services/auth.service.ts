import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service';
import type { User } from '@supabase/supabase-js';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  nombres: string;
  apellidos: string;
  telefono?: string;
  entidad?: string;
  programa?: string;
  area?: string;
}

export interface RegisterEstudianteData {
  email: string;
  password: string;
  nombres: string;
  apellidos: string;
}

const AVATAR_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  nombres: string;
  apellidos: string;
  rol: 'docente' | 'administrador' | 'estudiante';
  telefono?: string;
  entidad?: string;
  programa?: string;
  area?: string;
  foto_url?: string;
  // Solo presentes cuando rol === 'docente' (punto 6: config del formato institucional de reportes).
  logo_institucional_url?: string;
  tema_acento?: string;
  formato_reporte_codigo?: string;
  formato_reporte_version?: string;
  formato_reporte_titulo?: string;
  formato_reporte_segunda_firma?: string;
  // Solo presentes cuando rol === 'administrador'.
  puede_cerrar_app?: boolean;
  puede_forzar_actualizacion?: boolean;
  puede_gestionar_docentes?: boolean;
  puede_ver_reportes?: boolean;
  puede_modificar_config?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  private currentProfileSubject = new BehaviorSubject<UserProfile | null>(null);
  public currentProfile$: Observable<UserProfile | null> = this.currentProfileSubject.asObservable();

  constructor(private supabase: SupabaseService, private router: Router) {
    this.checkSession();
  }

  async checkSession() {
    const { data: { user } } = await this.supabase.auth.getUser();
    this.currentUserSubject.next(user);
    if (user) {
      await this.resolveProfile(user.id);
    } else {
      this.currentProfileSubject.next(null);
    }
  }

  get currentProfileValue(): UserProfile | null {
    return this.currentProfileSubject.value;
  }

  /**
   * Determina el rol de un usuario probando administradores → docentes → estudiantes
   * (el rol no es una columna persistida, se infiere de en qué tabla existe una fila).
   * Usado tanto en login() como al restaurar una sesión existente (guards, checkSession).
   */
  async resolveProfile(userId: string): Promise<UserProfile | null> {
    const { data: admin } = await this.supabase
      .from('administradores').select('*').eq('user_id', userId).maybeSingle();
    if (admin) {
      const profile = { ...admin, rol: 'administrador' } as UserProfile;
      this.currentProfileSubject.next(profile);
      return profile;
    }

    const { data: docente } = await this.supabase
      .from('docentes').select('*').eq('user_id', userId).maybeSingle();
    if (docente) {
      const profile = { ...docente, rol: 'docente' } as UserProfile;
      this.currentProfileSubject.next(profile);
      return profile;
    }

    const { data: estudiante } = await this.supabase
      .from('estudiantes').select('*').eq('id', userId).maybeSingle();
    if (estudiante) {
      const profile = { ...estudiante, rol: 'estudiante' } as UserProfile;
      this.currentProfileSubject.next(profile);
      return profile;
    }

    return null;
  }

  async login(loginData: LoginData) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (error) throw error;

      this.currentUserSubject.next(data.user);
      const profile = await this.resolveProfile(data.user.id);
      if (profile) {
        return { success: true, user: data.user, profile };
      }

      throw new Error('Usuario no encontrado en el sistema');
    } catch (error: any) {
      console.error('Error en login:', error);

      if (error.message?.includes('Invalid login credentials')) {
        return { success: false, error: 'Correo o contraseña incorrectos. Verifica tus datos.' };
      }
      if (error.message?.includes('Email not confirmed')) {
        return { success: false, error: 'Debes confirmar tu correo electrónico antes de iniciar sesión.' };
      }
      return { success: false, error: error.message || 'Error al iniciar sesión' };
    }
  }

  async register(registerData: RegisterData & { foto_url?: string }) {
    try {
      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email: registerData.email,
        password: registerData.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No se pudo crear el usuario');

      const { data: docenteData, error: docenteError } = await this.supabase
        .from('docentes')
        .insert([{
          user_id: authData.user.id,
          email: registerData.email,
          nombres: registerData.nombres,
          apellidos: registerData.apellidos,
          telefono: registerData.telefono || null,
          entidad: registerData.entidad || null,
          programa: registerData.programa || null,
          area: registerData.area || null,
          foto_url: registerData.foto_url || null,
        }])
        .select()
        .single();

      if (docenteError) throw docenteError;

      return { success: true, user: authData.user, docente: docenteData };
    } catch (error: any) {
      console.error('Error en registro:', error);
      return { success: false, error: error.message || 'Error al crear la cuenta' };
    }
  }

  async registerEstudiante(data: RegisterEstudianteData) {
    try {
      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: { data: { nombres: data.nombres, apellidos: data.apellidos, tipo_usuario: 'estudiante' } },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No se pudo crear el usuario');

      const iniciales = `${(data.nombres[0] ?? '').toUpperCase()}${(data.apellidos[0] ?? '').toUpperCase()}`;
      const avatar_color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

      const { data: estudianteData, error: estudianteError } = await this.supabase
        .from('estudiantes')
        .insert([{
          id: authData.user.id,
          nombres: data.nombres,
          apellidos: data.apellidos,
          email: data.email,
          iniciales,
          avatar_color,
          activo: true,
        }])
        .select()
        .single();

      if (estudianteError) {
        // Evita dejar un usuario de Auth "huérfano" sin fila en estudiantes.
        await this.supabase.auth.signOut();
        throw estudianteError;
      }

      return { success: true, user: authData.user, estudiante: estudianteData };
    } catch (error: any) {
      console.error('Error en registro de estudiante:', error);
      if (error.message?.includes('already registered')) {
        return { success: false, error: 'Este correo ya está registrado' };
      }
      return { success: false, error: error.message || 'Error al crear la cuenta' };
    }
  }

  async forgotPassword(email: string) {
    try {
      const { data: docente } = await this.supabase
        .from('docentes').select('email, nombres, apellidos').eq('email', email).maybeSingle();
      const { data: admin } = await this.supabase
        .from('administradores').select('email, nombres, apellidos').eq('email', email).maybeSingle();
      const { data: estudiante } = await this.supabase
        .from('estudiantes').select('email, nombres, apellidos').eq('email', email).maybeSingle();

      if (!docente && !admin && !estudiante) {
        return { success: false, error: 'El correo electrónico no está registrado en el sistema' };
      }

      const redirectUrl = `${window.location.origin}/auth/reset-password`;

      const { error: resetError } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (resetError) {
        if (resetError.message.includes('User not found')) {
          return { success: false, error: 'No se encontró una cuenta asociada a este correo' };
        }
        throw resetError;
      }

      return {
        success: true,
        message: `Se ha enviado un correo de recuperación a ${email}. Revisa tu bandeja de entrada.`,
        profile: docente || admin || estudiante,
      };
    } catch (error: any) {
      console.error('Error en recuperación de contraseña:', error);
      if (error.message?.includes('rate limit')) {
        return { success: false, error: 'Demasiados intentos. Por favor espera unos minutos e intenta de nuevo' };
      }
      return { success: false, error: error.message || 'Error al enviar el correo de recuperación' };
    }
  }

  async updatePassword(newPassword: string) {
    try {
      const { error } = await this.supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      return { success: true, message: 'Contraseña actualizada exitosamente' };
    } catch (error: any) {
      console.error('Error actualizando contraseña:', error);
      return { success: false, error: error.message || 'Error al actualizar la contraseña' };
    }
  }

  async logout() {
    await this.supabase.auth.signOut();
    this.currentUserSubject.next(null);
    this.currentProfileSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  async getDocenteByUserId(userId: string) {
    const { data, error } = await this.supabase.from('docentes').select('*').eq('user_id', userId).single();
    if (error) { console.error('Error obteniendo docente:', error); return null; }
    return data;
  }

  async getAdminByUserId(userId: string) {
    const { data, error } = await this.supabase.from('administradores').select('*').eq('user_id', userId).single();
    if (error) { console.error('Error obteniendo administrador:', error); return null; }
    return data;
  }
}
