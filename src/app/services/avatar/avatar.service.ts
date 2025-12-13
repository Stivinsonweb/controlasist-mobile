import { Injectable } from '@angular/core';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable({
  providedIn: 'root'
})
export class AvatarService {
  private readonly BUCKET_NAME = 'avatares';
  private readonly DEFAULT_AVATARS = [
    'avatars/avatar-1.png',
    'avatars/avatar-2.png',
    'avatars/avatar-3.png',
    'avatars/avatar-4.png',
    'avatars/avatar-5.png',
    'avatars/avatar-6.png',
    'avatars/avatar-7.png',
    'avatars/avatar-8.png',
    'avatars/avatar-9.png',
    'avatars/avatar-10.png',
  ];

  constructor(private supabase: SupabaseService) {}

  /**
   * Obtener lista de avatares por defecto del Storage
   */
  async getDefaultAvatars(): Promise<string[]> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.BUCKET_NAME)
        .list('avatars', {
          limit: 20,
          offset: 0,
        });

      if (error) {
        console.error('Error obteniendo avatares:', error);
        return this.getDefaultAvatarUrls();
      }

      if (!data || data.length === 0) {
        return this.getDefaultAvatarUrls();
      }

      // Obtener URLs públicas de los avatares
      const avatarUrls = data
        .filter(file => file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i))
        .map(file => {
          const { data: { publicUrl } } = this.supabase.storage
            .from(this.BUCKET_NAME)
            .getPublicUrl(`avatars/${file.name}`);
          return publicUrl;
        });

      return avatarUrls.length > 0 ? avatarUrls : this.getDefaultAvatarUrls();
    } catch (error) {
      console.error('Error obteniendo avatares:', error);
      return this.getDefaultAvatarUrls();
    }
  }

  /**
   * Generar URLs de avatares por defecto desde UI Avatars
   */
  getDefaultAvatarUrls(): string[] {
    const colors = [
      '3b82f6', // Azul
      '10b981', // Verde
      'f59e0b', // Naranja
      'ef4444', // Rojo
      '8b5cf6', // Púrpura
      'ec4899', // Rosa
      '06b6d4', // Cyan
      '84cc16'  // Lima
    ];

    return colors.map((color, index) => 
      `https://ui-avatars.com/api/?name=Avatar+${index + 1}&background=${color}&color=fff&size=200&bold=true`
    );
  }

  /**
   * Subir avatar personalizado
   */
  async uploadAvatar(file: File, userId: string, tipo: 'docente' | 'estudiante'): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${tipo}s/${userId}/avatar.${fileExt}`;

      // Subir archivo
      const { error: uploadError } = await this.supabase.storage
        .from(this.BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true // Reemplazar si ya existe
        });

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data: { publicUrl } } = this.supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error subiendo avatar:', error);
      return null;
    }
  }

  /**
   * Eliminar avatar
   */
  async deleteAvatar(userId: string, tipo: 'docente' | 'estudiante'): Promise<boolean> {
    try {
      const { error } = await this.supabase.storage
        .from(this.BUCKET_NAME)
        .remove([`${tipo}s/${userId}`]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error eliminando avatar:', error);
      return false;
    }
  }

  /**
   * Generar avatar de iniciales
   */
  generateInitialsAvatar(nombres: string, apellidos: string, color?: string): string {
    const initials = this.getInitials(nombres, apellidos);
    const bgColor = color || '3b82f6';
    return `https://ui-avatars.com/api/?name=${initials}&background=${bgColor}&color=fff&size=200&bold=true&rounded=true`;
  }

  /**
   * Obtener iniciales
   */
  getInitials(nombres: string, apellidos: string): string {
    const firstInitial = nombres?.charAt(0)?.toUpperCase() || '';
    const lastInitial = apellidos?.charAt(0)?.toUpperCase() || '';
    return `${firstInitial}${lastInitial}`;
  }
}