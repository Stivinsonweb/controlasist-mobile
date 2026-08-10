import { Injectable } from '@angular/core';
import { getAccentPalette } from '../../shared/utils/subject-theme.util';

/**
 * Aplica el tema de acento elegido por el docente (--accent-from/--accent-to en :root)
 * usado por el sidebar activo, botones de gradiente dinámico, avatar ring, etc.
 * Se invoca desde LayoutComponent apenas se resuelve el perfil, y desde la página de
 * perfil del docente al cambiar de tema para que se vea el cambio al instante.
 */
@Injectable({ providedIn: 'root' })
export class AccentThemeService {
  apply(temaId: string | null | undefined) {
    const palette = getAccentPalette(temaId);
    document.documentElement.style.setProperty('--accent-from', palette.from);
    document.documentElement.style.setProperty('--accent-to', palette.to);
  }
}
