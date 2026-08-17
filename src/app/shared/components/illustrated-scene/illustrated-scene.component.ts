import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SceneVariant =
  | 'ios-share'
  | 'ios-add-home'
  | 'ios-confirm'
  | 'android-menu'
  | 'android-install'
  | 'desktop-install'
  | 'crear-asignatura'
  | 'horarios'
  | 'tomar-asistencia'
  | 'gestionar-estudiantes'
  | 'reportes'
  | 'perfil'
  | 'inscribir'
  | 'ver-horario'
  | 'consultar-asistencia';

/**
 * Escena ilustrada reutilizable: un personaje simple (SVG, círculo + formas básicas) que
 * "sostiene" un prop distinto por escena, con una animación CSS en loop propia de cada
 * variante. Un solo componente data-driven (switch sobre `variant`) en vez de un SVG por
 * pantalla — así la guía de instalación (PWA) y la guía completa del sistema comparten el
 * mismo lenguaje visual sin duplicar código.
 */
@Component({
  selector: 'app-illustrated-scene',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col items-center text-center">
      <svg viewBox="0 0 220 170" class="h-44 w-44 sm:h-52 sm:w-52" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="110" cy="152" rx="70" ry="10" fill="currentColor" class="text-slate-100" />

        <!-- Personaje base: cabeza + cuerpo simple -->
        <g stroke="#0f172a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
          <circle cx="62" cy="58" r="20" fill="#fde68a" stroke="#0f172a" />
          <path d="M62 78 v10" />
          <path d="M45 132 C45 100 50 88 62 88 C74 88 79 100 79 132" fill="#10b981" stroke="#0f172a" />
          <path class="scene-arm" d="M79 100 C95 100 104 92 112 82" />
          <path d="M45 100 C36 100 30 106 26 116" />
        </g>

        <!-- Prop animado, específico por variante -->
        <g [ngSwitch]="variant">

          <g *ngSwitchCase="'ios-share'" class="scene-bounce" transform="translate(112,50)">
            <rect x="0" y="10" width="34" height="34" rx="8" fill="#ffffff" stroke="#3b82f6" stroke-width="3" />
            <path d="M17 32V12M9 20l8-8 8 8" fill="none" stroke="#3b82f6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
          </g>

          <g *ngSwitchCase="'ios-add-home'" transform="translate(105,38)">
            <rect x="0" y="0" width="80" height="52" rx="10" fill="#ffffff" stroke="#94a3b8" stroke-width="2.5" />
            <rect x="10" y="10" width="60" height="10" rx="3" fill="#e2e8f0" />
            <rect class="scene-highlight" x="10" y="26" width="60" height="14" rx="4" fill="#10b981" />
            <text x="40" y="36" text-anchor="middle" font-size="8" fill="#ffffff" font-weight="700">Agregar a inicio</text>
          </g>

          <g *ngSwitchCase="'ios-confirm'" transform="translate(115,45)">
            <rect x="0" y="0" width="60" height="26" rx="8" fill="#10b981" />
            <text x="30" y="17" text-anchor="middle" font-size="10" fill="#ffffff" font-weight="700">Agregar</text>
            <g class="scene-pop" transform="translate(66,-8)">
              <circle cx="10" cy="10" r="12" fill="#3b82f6" />
              <path d="M5 10l4 4 8-8" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
            </g>
          </g>

          <g *ngSwitchCase="'android-menu'" transform="translate(120,40)">
            <rect x="0" y="0" width="46" height="46" rx="10" fill="#ffffff" stroke="#94a3b8" stroke-width="2.5" />
            <circle class="scene-dot-1" cx="23" cy="13" r="3.5" fill="#0f172a" />
            <circle class="scene-dot-2" cx="23" cy="23" r="3.5" fill="#0f172a" />
            <circle class="scene-dot-3" cx="23" cy="33" r="3.5" fill="#0f172a" />
          </g>

          <g *ngSwitchCase="'android-install'" transform="translate(105,42)">
            <rect x="0" y="0" width="80" height="24" rx="7" fill="#ffffff" stroke="#94a3b8" stroke-width="2.5" />
            <text x="40" y="16" text-anchor="middle" font-size="9" fill="#334155" font-weight="600">Instalar app</text>
            <g class="scene-bounce-sm" transform="translate(58,-18)">
              <path d="M10 0v16m-6-6l6 6 6-6" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
            </g>
          </g>

          <g *ngSwitchCase="'desktop-install'" transform="translate(102,44)">
            <rect x="0" y="0" width="86" height="18" rx="5" fill="#ffffff" stroke="#94a3b8" stroke-width="2.2" />
            <circle class="scene-pulse-ring" cx="72" cy="9" r="10" fill="none" stroke="#10b981" stroke-width="2" />
            <path d="M72 4v9m-4-4l4 4 4-4" fill="none" stroke="#10b981" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
          </g>

          <g *ngSwitchCase="'crear-asignatura'" transform="translate(108,36)">
            <rect x="0" y="0" width="66" height="52" rx="6" fill="#ffffff" stroke="#94a3b8" stroke-width="2.5" />
            <line class="scene-line-1" x1="10" y1="14" x2="50" y2="14" stroke="#10b981" stroke-width="3" stroke-linecap="round" />
            <line class="scene-line-2" x1="10" y1="26" x2="56" y2="26" stroke="#10b981" stroke-width="3" stroke-linecap="round" />
            <line class="scene-line-3" x1="10" y1="38" x2="40" y2="38" stroke="#10b981" stroke-width="3" stroke-linecap="round" />
            <g class="scene-pencil" transform="translate(46,30)">
              <path d="M0 20L18 2l4 4L4 24l-6 1z" fill="#f59e0b" stroke="#0f172a" stroke-width="1.5" stroke-linejoin="round" />
            </g>
          </g>

          <g *ngSwitchCase="'horarios'" transform="translate(105,34)">
            <rect x="0" y="6" width="76" height="56" rx="8" fill="#ffffff" stroke="#94a3b8" stroke-width="2.5" />
            <line x1="0" y1="22" x2="76" y2="22" stroke="#94a3b8" stroke-width="2" />
            <rect x="10" y="0" width="6" height="14" rx="2" fill="#3b82f6" />
            <rect x="60" y="0" width="6" height="14" rx="2" fill="#3b82f6" />
            <rect class="scene-highlight" x="10" y="32" width="16" height="14" rx="3" fill="#10b981" />
            <rect x="32" y="32" width="16" height="14" rx="3" fill="#e2e8f0" />
            <rect x="54" y="32" width="16" height="14" rx="3" fill="#e2e8f0" />
            <rect x="10" y="48" width="16" height="10" rx="3" fill="#e2e8f0" />
          </g>

          <g *ngSwitchCase="'tomar-asistencia'" transform="translate(112,32)">
            <rect x="0" y="0" width="60" height="60" rx="8" fill="#ffffff" stroke="#94a3b8" stroke-width="2.5" />
            <g class="scene-check-1" transform="translate(8,8)"><rect width="14" height="14" rx="4" fill="#10b981" /><path d="M3 7l3 3 6-6" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></g>
            <g class="scene-check-2" transform="translate(8,26)"><rect width="14" height="14" rx="4" fill="#10b981" /><path d="M3 7l3 3 6-6" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></g>
            <g class="scene-check-3" transform="translate(8,44)"><rect width="14" height="14" rx="4" fill="#10b981" /><path d="M3 7l3 3 6-6" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></g>
            <line x1="30" y1="15" x2="52" y2="15" stroke="#e2e8f0" stroke-width="3" stroke-linecap="round" />
            <line x1="30" y1="33" x2="52" y2="33" stroke="#e2e8f0" stroke-width="3" stroke-linecap="round" />
            <line x1="30" y1="51" x2="52" y2="51" stroke="#e2e8f0" stroke-width="3" stroke-linecap="round" />
          </g>

          <g *ngSwitchCase="'gestionar-estudiantes'" transform="translate(104,42)">
            <circle class="scene-pop-1" cx="12" cy="12" r="11" fill="#3b82f6" />
            <circle class="scene-pop-2" cx="38" cy="12" r="11" fill="#10b981" />
            <circle class="scene-pop-3" cx="64" cy="12" r="11" fill="#f59e0b" />
            <rect x="0" y="30" width="82" height="8" rx="4" fill="#e2e8f0" />
            <rect x="0" y="42" width="60" height="8" rx="4" fill="#e2e8f0" />
          </g>

          <g *ngSwitchCase="'reportes'" transform="translate(110,34)">
            <rect x="0" y="0" width="70" height="60" rx="8" fill="#ffffff" stroke="#94a3b8" stroke-width="2.5" />
            <rect class="scene-bar-1" x="10" y="42" width="10" height="10" rx="2" fill="#3b82f6" />
            <rect class="scene-bar-2" x="28" y="30" width="10" height="22" rx="2" fill="#10b981" />
            <rect class="scene-bar-3" x="46" y="18" width="10" height="34" rx="2" fill="#3b82f6" />
          </g>

          <g *ngSwitchCase="'perfil'" transform="translate(118,40)">
            <circle cx="20" cy="20" r="20" fill="#e2e8f0" />
            <circle cx="20" cy="15" r="7" fill="#94a3b8" />
            <path d="M6 33c2-8 8-11 14-11s12 3 14 11" fill="#94a3b8" />
            <g class="scene-spin" transform="translate(30,28)">
              <path d="M8 0l1.8 3.2 3.6-.6-1 3.5 2.6 2.4-3.4 1.4L11 13l-3-2-3 2-.6-3.1-3.4-1.4L3.6 6l-1-3.5 3.6.6L8 0z" fill="#f59e0b" />
            </g>
          </g>

          <g *ngSwitchCase="'inscribir'" transform="translate(108,38)">
            <rect x="0" y="0" width="68" height="34" rx="8" fill="#ffffff" stroke="#94a3b8" stroke-width="2.5" />
            <text class="scene-code" x="34" y="22" text-anchor="middle" font-size="14" letter-spacing="3" fill="#10b981" font-weight="700">A3F9</text>
            <g class="scene-pop" transform="translate(50,-6)">
              <circle cx="10" cy="10" r="11" fill="#3b82f6" />
              <path d="M5 10.5l3.5 3.5L15 7" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
            </g>
          </g>

          <g *ngSwitchCase="'ver-horario'" transform="translate(105,34)">
            <rect x="0" y="6" width="76" height="56" rx="8" fill="#ffffff" stroke="#94a3b8" stroke-width="2.5" />
            <line x1="0" y1="22" x2="76" y2="22" stroke="#94a3b8" stroke-width="2" />
            <rect x="10" y="0" width="6" height="14" rx="2" fill="#3b82f6" />
            <rect x="60" y="0" width="6" height="14" rx="2" fill="#3b82f6" />
            <rect x="10" y="32" width="16" height="14" rx="3" fill="#e2e8f0" />
            <rect class="scene-pulse-cell" x="32" y="32" width="16" height="14" rx="3" fill="#10b981" />
            <rect x="54" y="32" width="16" height="14" rx="3" fill="#e2e8f0" />
          </g>

          <g *ngSwitchCase="'consultar-asistencia'" transform="translate(112,36)">
            <circle cx="26" cy="26" r="24" fill="none" stroke="#e2e8f0" stroke-width="6" />
            <circle class="scene-ring" cx="26" cy="26" r="24" fill="none" stroke="#10b981" stroke-width="6" stroke-linecap="round" stroke-dasharray="151" stroke-dashoffset="151" transform="rotate(-90 26 26)" />
            <text x="26" y="31" text-anchor="middle" font-size="13" fill="#0f172a" font-weight="800">92%</text>
          </g>

        </g>
      </svg>

      <h4 class="mt-1 text-base font-bold" [class.text-slate-900]="theme === 'light'" [style.color]="theme === 'dark' ? 'var(--text-primary)' : null">{{ title }}</h4>
      <p class="mt-1.5 max-w-xs text-sm" [class.text-slate-500]="theme === 'light'" [style.color]="theme === 'dark' ? 'var(--text-muted)' : null">{{ description }}</p>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .scene-arm { animation: scene-arm-wave 2.6s ease-in-out infinite; transform-origin: 79px 100px; }
    @keyframes scene-arm-wave { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(-6deg); } }

    .scene-bounce { animation: scene-bounce 1.4s ease-in-out infinite; }
    .scene-bounce-sm { animation: scene-bounce 1.2s ease-in-out infinite; }
    @keyframes scene-bounce { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(0, -6px); } }

    .scene-highlight, .scene-pulse-cell { animation: scene-glow 1.6s ease-in-out infinite; transform-origin: center; }
    @keyframes scene-glow { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }

    .scene-pop { animation: scene-pop-in 1.8s ease-in-out infinite; transform-origin: center; }
    @keyframes scene-pop-in { 0%, 20% { transform: scale(0) translate(66px,-8px); opacity: 0; } 40%, 80% { transform: scale(1) translate(66px,-8px); opacity: 1; } 100% { transform: scale(1) translate(66px,-8px); opacity: 1; } }

    .scene-dot-1, .scene-dot-2, .scene-dot-3 { animation: scene-dot-pulse 1.5s ease-in-out infinite; }
    .scene-dot-2 { animation-delay: .15s; }
    .scene-dot-3 { animation-delay: .3s; }
    @keyframes scene-dot-pulse { 0%, 100% { opacity: .35; } 50% { opacity: 1; } }

    .scene-pulse-ring { animation: scene-ring-pulse 1.6s ease-out infinite; transform-origin: 72px 9px; }
    @keyframes scene-ring-pulse { 0% { transform: scale(0.7); opacity: 1; } 100% { transform: scale(1.4); opacity: 0; } }

    .scene-pencil { animation: scene-write 1.8s ease-in-out infinite; transform-origin: 46px 30px; }
    @keyframes scene-write { 0%, 100% { transform: translate(0,0) rotate(0deg); } 50% { transform: translate(-3px,2px) rotate(-4deg); } }
    .scene-line-1, .scene-line-2, .scene-line-3 { animation: scene-line-draw 2.4s ease-in-out infinite; stroke-dasharray: 60; stroke-dashoffset: 60; }
    .scene-line-2 { animation-delay: .3s; }
    .scene-line-3 { animation-delay: .6s; }
    @keyframes scene-line-draw { 0% { stroke-dashoffset: 60; } 40%, 100% { stroke-dashoffset: 0; } }

    .scene-check-1, .scene-check-2, .scene-check-3 { animation: scene-check-pop 2.1s ease-in-out infinite; transform-origin: center; opacity: 0; }
    .scene-check-2 { animation-delay: .35s; }
    .scene-check-3 { animation-delay: .7s; }
    @keyframes scene-check-pop { 0%, 10% { opacity: 0; transform: scale(0); } 25%, 90% { opacity: 1; transform: scale(1); } 100% { opacity: 1; transform: scale(1); } }

    .scene-pop-1, .scene-pop-2, .scene-pop-3 { animation: scene-avatar-pop 2s ease-in-out infinite; transform-origin: center; opacity: 0; }
    .scene-pop-2 { animation-delay: .2s; }
    .scene-pop-3 { animation-delay: .4s; }
    @keyframes scene-avatar-pop { 0%, 10% { opacity: 0; transform: scale(0); } 30%, 100% { opacity: 1; transform: scale(1); } }

    .scene-bar-1, .scene-bar-2, .scene-bar-3 { animation: scene-grow-bar 1.8s ease-in-out infinite; transform-origin: bottom; }
    .scene-bar-2 { animation-delay: .15s; }
    .scene-bar-3 { animation-delay: .3s; }
    @keyframes scene-grow-bar { 0%, 100% { transform: scaleY(0.4); } 50% { transform: scaleY(1); } }

    .scene-spin { animation: scene-spin 3s linear infinite; transform-origin: 38px 36px; }
    @keyframes scene-spin { to { transform: rotate(360deg) translate(30px,28px); } }

    .scene-code { animation: scene-glow 2.2s ease-in-out infinite; }

    .scene-pulse-cell { animation: scene-glow 1.6s ease-in-out infinite; }

    .scene-ring { animation: scene-ring-fill 2.4s ease-in-out infinite; }
    @keyframes scene-ring-fill { 0% { stroke-dashoffset: 151; } 60%, 100% { stroke-dashoffset: 14; } }
  `],
})
export class IllustratedSceneComponent {
  @Input() variant!: SceneVariant;
  @Input() title = '';
  @Input() description = '';
  /** 'light' para tarjetas blancas (modales de instalación), 'dark' para el fondo oscuro de la app (guía del sistema). */
  @Input() theme: 'light' | 'dark' = 'light';
}
