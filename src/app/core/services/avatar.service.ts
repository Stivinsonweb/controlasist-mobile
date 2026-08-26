import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

const BUCKET = 'avatares';

@Injectable({ providedIn: 'root' })
export class AvatarService {
  constructor(private supabaseService: SupabaseService) {}

  private get storage() {
    return this.supabaseService.storage;
  }

  /**
   * Lista la galería de avatares prediseñados para el rol dado.
   * Prioriza una carpeta dedicada por rol (`avatares/avatars/docentes` o `.../estudiantes`) si
   * ya se subieron ahí ilustraciones propias para ese rol. Mientras eso no exista, cae de vuelta
   * al set compartido histórico (`avatares/avatars`) pero partiéndolo de forma determinística
   * (par/impar) para que docente y estudiante no vean exactamente el mismo subconjunto.
   */
  async getDefaultAvatars(rol: 'docente' | 'estudiante'): Promise<string[]> {
    const carpetaRol = rol === 'docente' ? 'avatars/docentes' : 'avatars/estudiantes';
    const propios = await this.listarImagenes(carpetaRol);
    if (propios.length > 0) return propios;

    const compartidos = await this.listarImagenes('avatars');
    const resto = compartidos.filter((_, i) => (rol === 'docente' ? i % 2 === 0 : i % 2 === 1));
    return resto.length > 0 ? resto : compartidos;
  }

  private async listarImagenes(carpeta: string): Promise<string[]> {
    const { data, error } = await this.storage.from(BUCKET).list(carpeta, { limit: 50 });
    if (error || !data) return [];
    return data
      .filter((f) => /\.(png|jpe?g|gif|webp)$/i.test(f.name))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((f) => this.storage.from(BUCKET).getPublicUrl(`${carpeta}/${f.name}`).data.publicUrl);
  }

  /** Sube una foto propia y devuelve su URL pública. */
  async subirAvatar(file: File, entidadId: string, tipo: 'docente' | 'estudiante'): Promise<string> {
    const ext = file.name.split('.').pop();
    const ruta = `${tipo}s/${entidadId}/avatar.${ext}`;
    const { error } = await this.storage.from(BUCKET).upload(ruta, file, { cacheControl: '3600', upsert: true });
    if (error) throw error;
    return this.storage.from(BUCKET).getPublicUrl(ruta).data.publicUrl;
  }
}
