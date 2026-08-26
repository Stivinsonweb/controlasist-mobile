import { Injectable, signal } from '@angular/core';

export type TemaPreferencia = 'oscuro' | 'claro' | 'sistema';

const STORAGE_KEY = 'controlasist_tema_preferencia';

/**
 * Modo oscuro/claro/sistema (Funcionalidad 6). La preferencia vive en localStorage — el sistema
 * de diseño ya está construido 100% sobre variables CSS en :root (ver styles.scss), así que
 * aplicar el tema es solo poner `data-theme="light"|"dark"` en <html>; el resto de la app (que ya
 * usa var(--bg-*), var(--text-*), etc. en vez de colores fijos) se actualiza solo.
 * Se inicializa desde AppComponent para que aplique incluso antes de iniciar sesión (login,
 * registro) y no solo dentro del layout autenticado.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  preferencia = signal<TemaPreferencia>(this.leerPreferenciaGuardada());

  private mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  private mediaListener = () => this.aplicarSistema();

  init() {
    this.aplicar(this.preferencia());
  }

  setPreferencia(p: TemaPreferencia) {
    this.preferencia.set(p);
    localStorage.setItem(STORAGE_KEY, p);
    this.aplicar(p);
  }

  private leerPreferenciaGuardada(): TemaPreferencia {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      return v === 'claro' || v === 'oscuro' || v === 'sistema' ? v : 'oscuro';
    } catch {
      return 'oscuro';
    }
  }

  private aplicar(p: TemaPreferencia) {
    this.mediaQuery.removeEventListener('change', this.mediaListener);
    if (p === 'sistema') {
      this.mediaQuery.addEventListener('change', this.mediaListener);
      this.aplicarSistema();
    } else {
      document.documentElement.setAttribute('data-theme', p === 'claro' ? 'light' : 'dark');
    }
  }

  private aplicarSistema() {
    document.documentElement.setAttribute('data-theme', this.mediaQuery.matches ? 'dark' : 'light');
  }
}
