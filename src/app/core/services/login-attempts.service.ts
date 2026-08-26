import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

const MAX_INTENTOS = 5;
const BLOQUEO_MINUTOS = 5;

export interface EstadoBloqueo {
  bloqueado: boolean;
  minutosRestantes: number;
}

/**
 * Contador propio de intentos fallidos de login por correo, ya que Supabase Auth solo aplica
 * rate limiting genérico a nivel de proyecto (no bloqueo por cuenta configurable desde el cliente).
 */
@Injectable({ providedIn: 'root' })
export class LoginAttemptsService {
  constructor(private supabaseService: SupabaseService) {}

  private get supabase() {
    return this.supabaseService.supabase;
  }

  async verificarBloqueo(email: string): Promise<EstadoBloqueo> {
    const { data } = await this.supabase.from('intentos_login').select('bloqueado_hasta').eq('email', email.toLowerCase()).maybeSingle();
    if (!data?.bloqueado_hasta) return { bloqueado: false, minutosRestantes: 0 };

    const restanteMs = new Date(data.bloqueado_hasta).getTime() - Date.now();
    if (restanteMs <= 0) return { bloqueado: false, minutosRestantes: 0 };
    return { bloqueado: true, minutosRestantes: Math.ceil(restanteMs / 60000) };
  }

  async registrarFallo(email: string): Promise<EstadoBloqueo> {
    const correo = email.toLowerCase();
    const { data: existente } = await this.supabase.from('intentos_login').select('intentos').eq('email', correo).maybeSingle();
    const intentos = (existente?.intentos || 0) + 1;
    const bloqueado_hasta = intentos >= MAX_INTENTOS ? new Date(Date.now() + BLOQUEO_MINUTOS * 60000).toISOString() : null;

    await this.supabase.from('intentos_login').upsert({ email: correo, intentos, bloqueado_hasta, actualizado_en: new Date().toISOString() });

    return bloqueado_hasta ? { bloqueado: true, minutosRestantes: BLOQUEO_MINUTOS } : { bloqueado: false, minutosRestantes: 0 };
  }

  async registrarExito(email: string) {
    await this.supabase.from('intentos_login').delete().eq('email', email.toLowerCase());
  }
}
