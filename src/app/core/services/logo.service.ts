import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

const BUCKET = 'logos-institucionales';

/** Sube el logo institucional que el docente configura para sus reportes exportables (punto 6). */
@Injectable({ providedIn: 'root' })
export class LogoService {
  constructor(private supabaseService: SupabaseService) {}

  private get storage() {
    return this.supabaseService.storage;
  }

  async subirLogo(file: File, docenteId: string): Promise<string> {
    const ext = file.name.split('.').pop();
    const ruta = `${docenteId}/logo.${ext}`;
    const { error } = await this.storage.from(BUCKET).upload(ruta, file, { cacheControl: '3600', upsert: true });
    if (error) throw error;
    return this.storage.from(BUCKET).getPublicUrl(ruta).data.publicUrl;
  }
}
