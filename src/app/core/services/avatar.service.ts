import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

const BUCKET = 'avatares';

@Injectable({ providedIn: 'root' })
export class AvatarService {
  constructor(private supabaseService: SupabaseService) {}

  private get storage() {
    return this.supabaseService.storage;
  }

  /** Lista la galería de avatares prediseñados subidos al bucket público `avatares/avatars`. */
  async getDefaultAvatars(): Promise<string[]> {
    const { data, error } = await this.storage.from(BUCKET).list('avatars', { limit: 50 });
    if (error || !data) {
      console.error('Error listando avatares por defecto:', error);
      return [];
    }
    return data
      .filter((f) => /\.(png|jpe?g|gif|webp)$/i.test(f.name))
      .map((f) => this.storage.from(BUCKET).getPublicUrl(`avatars/${f.name}`).data.publicUrl);
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
