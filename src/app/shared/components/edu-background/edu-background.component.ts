import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface IconoDecorativo {
  path: string;
  top: string;
  left: string;
  size: number;
  rotate: number;
}

const LIBRO = 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25';
const BIRRETE = 'M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347M8.288 14.212A5.25 5.25 0 0117.25 10.5c0-.184-.007-.366-.021-.547m-15.458.547A5.25 5.25 0 0016.25 10.5c0 .184-.007.366-.021.547M12 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489';
const LAPIZ = 'm16.862 4.487 1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zM19.5 7.125L16.862 4.487';
const BOMBILLA = 'M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18';

const ICONOS: IconoDecorativo[] = [
  { path: LIBRO, top: '6%', left: '8%', size: 72, rotate: -8 },
  { path: BIRRETE, top: '14%', left: '78%', size: 88, rotate: 6 },
  { path: LAPIZ, top: '32%', left: '38%', size: 56, rotate: -20 },
  { path: BOMBILLA, top: '48%', left: '90%', size: 64, rotate: 4 },
  { path: LIBRO, top: '62%', left: '14%', size: 60, rotate: 10 },
  { path: BIRRETE, top: '78%', left: '55%', size: 70, rotate: -6 },
  { path: LAPIZ, top: '8%', left: '52%', size: 48, rotate: 18 },
  { path: BOMBILLA, top: '86%', left: '20%', size: 56, rotate: -12 },
  { path: LIBRO, top: '38%', left: '68%', size: 50, rotate: 22 },
  { path: BIRRETE, top: '58%', left: '82%', size: 46, rotate: -16 },
  { path: LAPIZ, top: '90%', left: '85%', size: 60, rotate: 8 },
  { path: BOMBILLA, top: '20%', left: '22%', size: 42, rotate: -10 },
];

/** Fondo decorativo de iconos educativos en línea, muy sutil (4-6% opacidad), para pantallas de auth y estados vacíos. */
@Component({
  selector: 'app-edu-background',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <!--
        3 niveles a propósito: el exterior posiciona (top/left), el del medio aplica la
        rotación estática propia de cada ícono (inline style), y el SVG interior lleva SOLO
        la animación de flotación por CSS. Si la rotación y la animación vivieran en el mismo
        elemento, la animación (que también anima "transform") le ganaría en cascada al
        "rotate()" fijo y se perdería la orientación de cada ícono.
      -->
      <div *ngFor="let icono of iconos; let i = index" class="absolute" [style.top]="icono.top" [style.left]="icono.left">
        <div [style.transform]="'rotate(' + icono.rotate + 'deg)'">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.2"
            class="float-icon text-white/[0.06]"
            [style.width.px]="icono.size"
            [style.height.px]="icono.size"
            [style.animation-duration.s]="7 + (i % 4) * 0.8"
            [style.animation-delay.s]="(i % 6) * 1.1"
          >
            <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="icono.path" />
          </svg>
        </div>
      </div>
    </div>
  `,
})
export class EduBackgroundComponent {
  iconos = ICONOS;
}
