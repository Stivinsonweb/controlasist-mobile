import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';
import { LogoComponent } from '../logo/logo.component';

/**
 * Bloque "logo + ControlAsist" reutilizado en las pantallas de auth (login, registro
 * docente, registro estudiante, recuperar contraseña). Antes cada pantalla copiaba este
 * HTML por su cuenta y terminaban desalineadas entre sí (login centrado, registro a la
 * izquierda) — ahora hay una sola fuente de verdad para alineación/tamaño/color.
 */
@Component({
  selector: 'app-brand-header',
  standalone: true,
  imports: [NgClass, LogoComponent],
  template: `
    <div class="flex w-full items-center justify-center text-center" [ngClass]="gapClass">
      <app-logo [sizeClass]="logoSizeClass" />
      <span class="text-lg font-bold" [ngClass]="variant === 'light' ? 'text-slate-900' : 'text-white'">ControlAsist</span>
    </div>
  `,
})
export class BrandHeaderComponent {
  @Input() logoSizeClass = 'h-14 w-14 rounded-2xl shadow-dark-soft';
  @Input() gapClass = 'gap-2';
  /** 'dark' = texto blanco (fondo oscuro del panel de marca); 'light' = texto oscuro (tarjeta clara). */
  @Input() variant: 'dark' | 'light' = 'dark';
}
