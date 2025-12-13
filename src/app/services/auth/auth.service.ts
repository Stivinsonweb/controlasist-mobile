import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { SupabaseService } from '../supabase/supabase.service';
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

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  nombres: string;
  apellidos: string;
  rol: 'docente' | 'administrador';
  telefono?: string;
  entidad?: string;
  programa?: string;
  area?: string;
  foto_url?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  constructor(
    private supabase: SupabaseService,
    private router: Router
  ) {
    this.checkSession();
  }

  async checkSession() {
    const { data: { user } } = await this.supabase.auth.getUser();
    this.currentUserSubject.next(user);
  }

  async login(loginData: LoginData) {
    try {
      console.log('🔐 Intentando login con:', loginData.email);
      
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (error) {
        console.error('❌ Error en signInWithPassword:', error);
        throw error;
      }

      console.log('✅ Autenticación exitosa, user_id:', data.user.id);

      // PRIMERO: Buscar en administradores
      console.log('🔍 Buscando en tabla administradores...');
      const { data: admin, error: adminError } = await this.supabase
        .from('administradores')
        .select('*')
        .eq('user_id', data.user.id)
        .maybeSingle();

      console.log('📊 Admin encontrado:', admin);
      console.log('⚠️ Error admin (si hay):', adminError);

      if (admin) {
        console.log('✅ Usuario es ADMINISTRADOR');
        this.currentUserSubject.next(data.user);
        return {
          success: true,
          user: data.user,
          profile: { ...admin, rol: 'administrador' } as UserProfile
        };
      }

      // SEGUNDO: Buscar en docentes
      console.log('🔍 Buscando en tabla docentes...');
      const { data: docente, error: docenteError } = await this.supabase
        .from('docentes')
        .select('*')
        .eq('user_id', data.user.id)
        .maybeSingle();

      console.log('📊 Docente encontrado:', docente);
      console.log('⚠️ Error docente (si hay):', docenteError);

      if (docente) {
        console.log('✅ Usuario es DOCENTE');
        this.currentUserSubject.next(data.user);
        return {
          success: true,
          user: data.user,
          profile: { ...docente, rol: 'docente' } as UserProfile
        };
      }

      console.error('❌ Usuario NO encontrado en administradores ni docentes');
      throw new Error('Usuario no encontrado en el sistema');

    } catch (error: any) {
      console.error('❌ Error en login:', error);
      
      if (error.message.includes('Invalid login credentials')) {
        return {
          success: false,
          error: 'Correo o contraseña incorrectos. Verifica tus datos.'
        };
      }
      
      if (error.message.includes('Email not confirmed')) {
        return {
          success: false,
          error: 'Debes confirmar tu correo electrónico antes de iniciar sesión.'
        };
      }
      
      return {
        success: false,
        error: error.message || 'Error al iniciar sesión'
      };
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
        .insert([
          {
            user_id: authData.user.id,
            email: registerData.email,
            nombres: registerData.nombres,
            apellidos: registerData.apellidos,
            telefono: registerData.telefono || null,
            entidad: registerData.entidad || null,
            programa: registerData.programa || null,
            area: registerData.area || null,
            foto_url: registerData.foto_url || null,
          }
        ])
        .select()
        .single();

      if (docenteError) throw docenteError;

      return {
        success: true,
        user: authData.user,
        docente: docenteData
      };
    } catch (error: any) {
      console.error('Error en registro:', error);
      return {
        success: false,
        error: error.message || 'Error al crear la cuenta'
      };
    }
  }

  async forgotPassword(email: string) {
    try {
      const { data: docente } = await this.supabase
        .from('docentes')
        .select('email, nombres, apellidos')
        .eq('email', email)
        .maybeSingle();

      const { data: admin } = await this.supabase
        .from('administradores')
        .select('email, nombres, apellidos')
        .eq('email', email)
        .maybeSingle();

      if (!docente && !admin) {
        return {
          success: false,
          error: 'El correo electrónico no está registrado en el sistema'
        };
      }

      const redirectUrl = `${window.location.origin}/auth/reset-password`;
      console.log('🔗 Redirect URL:', redirectUrl);

      const { error: resetError } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (resetError) {
        if (resetError.message.includes('User not found')) {
          return {
            success: false,
            error: 'No se encontró una cuenta asociada a este correo'
          };
        }
        throw resetError;
      }

      return {
        success: true,
        message: `Se ha enviado un correo de recuperación a ${email}. Revisa tu bandeja de entrada.`,
        profile: docente || admin
      };
    } catch (error: any) {
      console.error('Error en recuperación de contraseña:', error);
      
      if (error.message.includes('Email not confirmed')) {
        return {
          success: false,
          error: 'Debes confirmar tu correo electrónico antes de restablecer la contraseña'
        };
      }
      
      if (error.message.includes('rate limit')) {
        return {
          success: false,
          error: 'Demasiados intentos. Por favor espera unos minutos e intenta de nuevo'
        };
      }
      
      return {
        success: false,
        error: error.message || 'Error al enviar el correo de recuperación'
      };
    }
  }

  async updatePassword(newPassword: string) {
    try {
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      return {
        success: true,
        message: 'Contraseña actualizada exitosamente'
      };
    } catch (error: any) {
      console.error('Error actualizando contraseña:', error);
      return {
        success: false,
        error: error.message || 'Error al actualizar la contraseña'
      };
    }
  }

  async logout() {
    await this.supabase.auth.signOut();
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  async getDocenteByUserId(userId: string) {
    const { data, error } = await this.supabase
      .from('docentes')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error obteniendo docente:', error);
      return null;
    }

    return data;
  }

  async getAdminByUserId(userId: string) {
    const { data, error } = await this.supabase
      .from('administradores')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error obteniendo administrador:', error);
      return null;
    }

    return data;
  }

  async checkEmailExists(email: string): Promise<boolean> {
    const { data: docente } = await this.supabase
      .from('docentes')
      .select('email')
      .eq('email', email)
      .single();

    const { data: admin } = await this.supabase
      .from('administradores')
      .select('email')
      .eq('email', email)
      .single();

    return !!(docente || admin);
  }
}