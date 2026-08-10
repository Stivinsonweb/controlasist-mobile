import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Renderiza el ícono temático de una asignatura (ver shared/utils/subject-icons.ts) como
 * SVG inline en línea/stroke, mismo estilo visual que los íconos del sidebar. Sin emojis,
 * sin librería externa — cada categoría es un pequeño set de formas SVG básicas.
 */
@Component({
  selector: 'app-subject-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg [class]="sizeClass" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <ng-container [ngSwitch]="icono">

        <!-- libro -->
        <path *ngSwitchCase="'libro'" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />

        <!-- calculadora -->
        <ng-container *ngSwitchCase="'calculadora'">
          <rect x="6" y="3" width="12" height="18" rx="2" />
          <line x1="8.5" y1="6.5" x2="15.5" y2="6.5" />
          <circle cx="9" cy="11" r="0.6" fill="currentColor" stroke="none" />
          <circle cx="12" cy="11" r="0.6" fill="currentColor" stroke="none" />
          <circle cx="15" cy="11" r="0.6" fill="currentColor" stroke="none" />
          <circle cx="9" cy="14.5" r="0.6" fill="currentColor" stroke="none" />
          <circle cx="12" cy="14.5" r="0.6" fill="currentColor" stroke="none" />
          <circle cx="15" cy="14.5" r="0.6" fill="currentColor" stroke="none" />
          <circle cx="9" cy="18" r="0.6" fill="currentColor" stroke="none" />
          <circle cx="12" cy="18" r="0.6" fill="currentColor" stroke="none" />
          <circle cx="15" cy="18" r="0.6" fill="currentColor" stroke="none" />
        </ng-container>

        <!-- codigo -->
        <ng-container *ngSwitchCase="'codigo'">
          <polyline points="9,8 5,12 9,16" />
          <polyline points="15,8 19,12 15,16" />
        </ng-container>

        <!-- pincel -->
        <ng-container *ngSwitchCase="'pincel'">
          <line x1="4" y1="20" x2="13.5" y2="10.5" />
          <circle cx="16" cy="8" r="2.5" />
        </ng-container>

        <!-- musica -->
        <ng-container *ngSwitchCase="'musica'">
          <circle cx="6" cy="18" r="2.5" />
          <circle cx="16.5" cy="16" r="2.5" />
          <line x1="8.5" y1="18" x2="8.5" y2="5" />
          <line x1="19" y1="16" x2="19" y2="3" />
          <line x1="8.5" y1="5" x2="19" y2="3" />
        </ng-container>

        <!-- ciencia -->
        <ng-container *ngSwitchCase="'ciencia'">
          <path d="M9 3h6M10 3v5.5L5.3 17.2a2 2 0 001.75 3h9.9a2 2 0 001.75-3L14 8.5V3" />
          <line x1="7.5" y1="14.5" x2="16.5" y2="14.5" />
        </ng-container>

        <!-- idiomas -->
        <ng-container *ngSwitchCase="'idiomas'">
          <circle cx="12" cy="12" r="9" />
          <ellipse cx="12" cy="12" rx="4" ry="9" />
          <line x1="3" y1="12" x2="21" y2="12" />
        </ng-container>

        <!-- deportes (medalla) -->
        <ng-container *ngSwitchCase="'deportes'">
          <line x1="9" y1="3" x2="10.5" y2="10.5" />
          <line x1="15" y1="3" x2="13.5" y2="10.5" />
          <circle cx="12" cy="16" r="5" />
        </ng-container>

        <!-- historia -->
        <ng-container *ngSwitchCase="'historia'">
          <polyline points="3,10 12,4 21,10" />
          <line x1="4" y1="10" x2="20" y2="10" />
          <line x1="6" y1="10" x2="6" y2="19" />
          <line x1="10" y1="10" x2="10" y2="19" />
          <line x1="14" y1="10" x2="14" y2="19" />
          <line x1="18" y1="10" x2="18" y2="19" />
          <line x1="4" y1="21" x2="20" y2="21" />
        </ng-container>

        <!-- negocios -->
        <ng-container *ngSwitchCase="'negocios'">
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
          <line x1="3" y1="12" x2="21" y2="12" />
        </ng-container>

        <!-- diseno -->
        <path *ngSwitchCase="'diseno'" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zM19.5 7.125L16.862 4.487" />

        <!-- ingenieria -->
        <path *ngSwitchCase="'ingenieria'" d="M14.7 6.3a4 4 0 00-5.66 5.66L4 17l3 3 5.04-5.04a4 4 0 005.66-5.66l-2.12 2.12-2.83-2.83z" />

        <!-- salud -->
        <ng-container *ngSwitchCase="'salud'">
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </ng-container>

        <!-- otro (fallback) -->
        <path *ngSwitchDefault d="M6 4h12v16l-6-4-6 4V4z" />

      </ng-container>
    </svg>
  `,
})
export class SubjectIconComponent {
  @Input() icono: string | null | undefined = 'libro';
  @Input() sizeClass = 'h-6 w-6';
}
