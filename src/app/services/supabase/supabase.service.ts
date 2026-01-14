import { Injectable } from "@angular/core";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { environment } from "../../../environments/environment";

@Injectable({
  providedIn: "root",
})
export class SupabaseService {
  public supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  }

  get client() {
    return this.supabase;
  }

  get auth() {
    return this.supabase.auth;
  }

  get from() {
    return this.supabase.from.bind(this.supabase);
  }

  get storage() {
    return this.supabase.storage;
  }

  rpc(functionName: string, params?: any) {
    return this.supabase.rpc(functionName, params);
  }

  // Obtener usuario actual autenticado
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser();
      if (error) {
        console.error('Error obteniendo usuario:', error);
        return null;
      }
      return user;
    } catch (error) {
      console.error('Error en getCurrentUser:', error);
      return null;
    }
  }

  // Obtener sesión actual
  async getSession() {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession();
      if (error) {
        console.error('Error obteniendo sesión:', error);
        return null;
      }
      return session;
    } catch (error) {
      console.error('Error en getSession:', error);
      return null;
    }
  }

  // Cerrar sesión
  async logout() {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) {
        console.error('Error cerrando sesión:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error en logout:', error);
      return false;
    }
  }
}