import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { SupabaseService } from "../supabase/supabase.service";
import { BehaviorSubject } from "rxjs";

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  nombres: string;
  apellidos: string;
  cedula: string;
  tipo_documento?: string;
  programa?: string;
  area?: string;
}

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private supabase: SupabaseService, private router: Router) {
    this.checkSession();
  }

  async checkSession() {
    try {
      const {
        data: { session },
      } = await this.supabase.auth.getSession();
      if (session) {
        this.currentUserSubject.next(session.user);
        return session.user;
      }
      return null;
    } catch (error) {
      console.error("Error verificando sesión:", error);
      return null;
    }
  }

  async login(loginData: LoginData) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (error) throw error;

      if (data.user) {
        this.currentUserSubject.next(data.user);
        const docenteData = await this.getDocenteByUserId(data.user.id);

        return {
          success: true,
          user: data.user,
          docente: docenteData,
        };
      }

      throw new Error("No se pudo iniciar sesión");
    } catch (error: any) {
      console.error("Error en login:", error);
      return {
        success: false,
        error: error.message || "Error al iniciar sesión",
      };
    }
  }

  async register(registerData: RegisterData & { foto_url?: string }) {
    try {
      // Verificar si la cédula ya existe
      const { data: existingDocente } = await this.supabase
        .from("docentes")
        .select("cedula")
        .eq("cedula", registerData.cedula)
        .single();

      if (existingDocente) {
        throw new Error("La cédula ya está registrada");
      }

      // Crear usuario en Auth
      const { data: authData, error: authError } =
        await this.supabase.auth.signUp({
          email: registerData.email,
          password: registerData.password,
        });

      if (authError) throw authError;
      if (!authData.user) throw new Error("No se pudo crear el usuario");

      // Crear registro en la tabla docentes CON AVATAR
      const { data: docenteData, error: docenteError } = await this.supabase
        .from("docentes")
        .insert([
          {
            user_id: authData.user.id,
            email: registerData.email,
            nombres: registerData.nombres,
            apellidos: registerData.apellidos,
            cedula: registerData.cedula,
            tipo_documento: registerData.tipo_documento || "CC",
            programa: registerData.programa,
            area: registerData.area,
            foto_url: registerData.foto_url || null, // ← AVATAR
          },
        ])
        .select()
        .single();

      if (docenteError) throw docenteError;

      return {
        success: true,
        user: authData.user,
        docente: docenteData,
      };
    } catch (error: any) {
      console.error("Error en registro:", error);
      return {
        success: false,
        error: error.message || "Error al crear la cuenta",
      };
    }
  }
  /**
   * RECUPERAR CONTRASEÑA - Validar email y enviar correo
   */
  async forgotPassword(email: string) {
    try {
      // PASO 1: Verificar si el email existe en la tabla docentes
      const { data: docente, error: docenteError } = await this.supabase
        .from("docentes")
        .select("email, nombres, apellidos")
        .eq("email", email)
        .single();

      if (docenteError || !docente) {
        return {
          success: false,
          error: "El correo electrónico no está registrado en el sistema",
        };
      }

      // PASO 2: Enviar email de recuperación
      const { error: resetError } =
        await this.supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        });

      if (resetError) {
        // Si el error es porque el email no existe en Auth
        if (resetError.message.includes("User not found")) {
          return {
            success: false,
            error: "No se encontró una cuenta asociada a este correo",
          };
        }
        throw resetError;
      }

      return {
        success: true,
        message: `Se ha enviado un correo de recuperación a ${email}. Revisa tu bandeja de entrada.`,
        docente: docente,
      };
    } catch (error: any) {
      console.error("Error en recuperación de contraseña:", error);

      // Mensajes de error más específicos
      if (error.message.includes("Email not confirmed")) {
        return {
          success: false,
          error:
            "Debes confirmar tu correo electrónico antes de restablecer la contraseña",
        };
      }

      if (error.message.includes("rate limit")) {
        return {
          success: false,
          error:
            "Demasiados intentos. Por favor espera unos minutos e intenta de nuevo",
        };
      }

      return {
        success: false,
        error: error.message || "Error al enviar el correo de recuperación",
      };
    }
  }

  async updatePassword(newPassword: string) {
    try {
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      return {
        success: true,
        message: "Contraseña actualizada exitosamente",
      };
    } catch (error: any) {
      console.error("Error actualizando contraseña:", error);
      return {
        success: false,
        error: error.message || "Error al actualizar la contraseña",
      };
    }
  }

  async logout() {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;

      this.currentUserSubject.next(null);
      this.router.navigate(["/auth/login"]);

      return { success: true };
    } catch (error: any) {
      console.error("Error en logout:", error);
      return {
        success: false,
        error: error.message || "Error al cerrar sesión",
      };
    }
  }

  async getDocenteByUserId(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from("docentes")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error obteniendo docente:", error);
      return null;
    }
  }

  /**
   * Verificar si un email existe en la base de datos
   */
  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from("docentes")
        .select("email")
        .eq("email", email)
        .single();

      return !error && !!data;
    } catch (error) {
      console.error("Error verificando email:", error);
      return false;
    }
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  getCurrentUser() {
    return this.currentUserSubject.value;
  }
}
