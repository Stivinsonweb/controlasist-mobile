import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Muestra la foto de perfil si existe (`fotoUrl`); si no, cae al círculo/cuadro de iniciales ya usado en toda la app. */
@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
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

  get ringStyle() {
    return this.ring ? 'box-shadow: 0 0 0 2px var(--bg-surface), 0 0 0 4px var(--accent-from);' : '';
  }

  get shapeClass() {
    return this.shape === 'square' ? 'rounded-2xl' : 'rounded-full';
  }
}
