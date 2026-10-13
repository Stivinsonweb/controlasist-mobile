import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Muestra la foto de perfil si existe (`fotoUrl`); si no, cae al círculo/cuadro de iniciales ya usado en toda la app. */
@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="relative inline-flex shrink-0">
      <img *ngIf="fotoUrl" [src]="fotoUrl" [class]="sizeClass + ' ' + shapeClass + ' shrink-0 object-cover'" [style]="ringStyle" [alt]="iniciales" />
      <div
        *ngIf="!fotoUrl"
        [class]="sizeClass + ' ' + shapeClass + ' shrink-0 flex items-center justify-center font-bold'"
        [style]="ringStyle"
        [style.backgroundColor]="colorFondo"
        [style.color]="textColor"
      >
        {{ iniciales }}
      </div>
      <span
        *ngIf="premium"
        class="pointer-events-none absolute -bottom-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-1.5 text-[8px] font-extrabold uppercase leading-[14px] tracking-wide text-white shadow-sm"
        style="background: linear-gradient(135deg, #f59e0b, #d97706); box-shadow: 0 0 0 1.5px var(--bg-surface);"
      >
        Premium
      </span>
    </span>
  `,
})
export class AvatarComponent {
  @Input() fotoUrl?: string | null;
  @Input() iniciales = '';
  @Input() colorFondo = '#10b981';
  @Input() textColor = '#ffffff';
  @Input() sizeClass = 'h-10 w-10 text-sm';
  @Input() shape: 'circle' | 'square' = 'circle';
  /** Borde de color coincidente con el tema de acento (usado en header/clusters de estudiantes). */
  @Input() ring = false;
  /** Muestra la etiqueta "Premium" sobre el avatar (docentes con Premium activo). */
  @Input() premium = false;

  get ringStyle() {
    return this.ring ? 'box-shadow: 0 0 0 2px var(--bg-surface), 0 0 0 4px var(--accent-from);' : '';
  }

  get shapeClass() {
    return this.shape === 'square' ? 'rounded-2xl' : 'rounded-full';
  }
}
