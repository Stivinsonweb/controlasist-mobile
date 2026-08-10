import { Component, Input } from '@angular/core';

/**
 * Logo de marca de ControlAsist — SVG inline (no imagen externa) para que escale nítido en
 * cualquier tamaño y hereda el fondo oscuro #0b1220 con esquinas redondeadas del diseño
 * original. Reemplaza el badge "CA" anterior en sidebar/header y las 4 pantallas de auth.
 * Fuente de verdad también usada por scripts/generate-icons.js para el favicon/manifest
 * (public/icons/logo.svg) — si el diseño cambia, actualizar ambos en conjunto.
 *
 * Estructura en 2 capas a propósito:
 * - El <div> exterior recibe `sizeClass` (tamaño/rx/shadow) y centra el SVG con flexbox.
 *   El <svg> NUNCA lleva el tamaño/redondeo directamente: es `display:inline` por defecto,
 *   lo que reserva espacio extra bajo la línea base (igual que un carácter de texto) y lo
 *   desplaza visualmente hacia abajo/izquierda dentro de contenedores flex — por eso se ve
 *   "descentrado". `display:block` + `h-full w-full` dentro de un padre flex centrado lo
 *   elimina de raíz.
 * - El arco (`.logo-arc`) rota con `transform-box: view-box` + `transform-origin: 80px 80px`
 *   (el centro real del anillo en coordenadas del viewBox), NO `fill-box`+`center`: al ser un
 *   arco parcial (no un círculo completo), su propio bounding box está descentrado respecto
 *   al anillo, así que "fill-box + center" lo hacía rotar alrededor del centro de ESE cuadro
 *   torcido en vez del centro real del círculo — eso producía el giro "errático".
 */
@Component({
  selector: 'app-logo',
  standalone: true,
  template: `
    <div [class]="sizeClass" style="display: flex; align-items: center; justify-content: center; overflow: hidden;">
      <svg
        viewBox="0 0 160 160"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
        [attr.aria-label]="'ControlAsist'"
        role="img"
        style="display: block; width: 100%; height: 100%;"
      >
        <defs>
          <linearGradient [attr.id]="gradId" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#10b981"/>
            <stop offset="1" stop-color="#3b82f6"/>
          </linearGradient>
        </defs>
        <rect width="160" height="160" rx="28" fill="#0b1220"/>
        <circle cx="80" cy="80" r="46" fill="none" stroke="#1e293b" stroke-width="5"/>
        <path class="logo-arc" d="M80 34 A46 46 0 0 1 121 102" fill="none" [attr.stroke]="'url(#' + gradId + ')'" stroke-width="5" stroke-linecap="round"/>
        <circle cx="66" cy="72" r="8" fill="none" stroke="#ffffff" stroke-width="3"/>
        <path d="M54 96 C54 84 59 79 66 79 C73 79 78 84 78 96" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
        <circle cx="92" cy="72" r="8" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.6"/>
        <path d="M80 96 C80 84 85 79 92 79 C99 79 104 84 104 96" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.6"/>
      </svg>
    </div>
  `,
})
export class LogoComponent {
  @Input() sizeClass = 'h-9 w-9 rounded-xl';
  /** Id único del gradiente: dos <app-logo> en la misma página no deben compartir el mismo <linearGradient id>. */
  gradId = `logoGrad-${Math.random().toString(36).slice(2)}`;
}
