import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Insignia de "docente verificado" — check azul estilo redes sociales, con tooltip. */
@Component({
  selector: 'app-verificado-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg *ngIf="mostrar" [class]="sizeClass" viewBox="0 0 24 24" fill="#3b82f6" [attr.aria-label]="'Docente verificado'">
      <title>Docente verificado</title>
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M9.653 2.996c.878-1.024 2.474-1.024 3.352 0a1.94 1.94 0 001.887.599c1.31-.312 2.542.75 2.475 2.094a1.94 1.94 0 001.212 1.876c1.253.508 1.685 2.07.855 3.146a1.94 1.94 0 000 2.578c.83 1.077.398 2.638-.855 3.146a1.94 1.94 0 00-1.212 1.876c.067 1.345-1.165 2.406-2.475 2.094a1.94 1.94 0 00-1.887.599c-.878 1.024-2.474 1.024-3.352 0a1.94 1.94 0 00-1.887-.599c-1.31.312-2.542-.75-2.475-2.094a1.94 1.94 0 00-1.212-1.876c-1.253-.508-1.685-2.07-.855-3.146a1.94 1.94 0 000-2.578c-.83-1.077-.398-2.638.855-3.146A1.94 1.94 0 004.29 5.689c-.067-1.345 1.165-2.406 2.475-2.094.696.166 1.43-.062 1.887-.599z"
      />
      <path fill-rule="evenodd" clip-rule="evenodd" d="M15.03 9.53a.75.75 0 00-1.06-1.06l-3.72 3.72-1.22-1.22a.75.75 0 00-1.06 1.06l1.75 1.75a.75.75 0 001.06 0l4.25-4.25z" fill="white" />
    </svg>
  `,
})
export class VerificadoBadgeComponent {
  @Input() mostrar = false;
  @Input() sizeClass = 'h-4 w-4';
}
