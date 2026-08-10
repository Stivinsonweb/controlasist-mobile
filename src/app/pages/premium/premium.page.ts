import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DecorBlobsComponent } from '../../shared/components/decor-blobs/decor-blobs.component';

@Component({
  selector: 'app-premium',
  standalone: true,
  imports: [CommonModule, DecorBlobsComponent],
  template: `
    <div class="relative flex min-h-[70vh] items-center justify-center overflow-hidden rounded-3xl">
      <app-decor-blobs />
      <div class="card relative z-10 mx-auto max-w-lg p-10 text-center">
        <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl shadow-dark-soft"
             style="background: linear-gradient(135deg, var(--accent-from), var(--accent-to));">
          <svg class="h-8 w-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>
        <h1 class="mt-6 text-2xl font-extrabold" style="color: var(--text-primary);">
          Funciones <span class="text-gradient-accent">Premium</span>
        </h1>
        <p class="mt-3 text-sm leading-relaxed" style="color: var(--text-secondary);">
          Próximamente vivirán aquí funciones avanzadas para tu panel: reportes avanzados,
          notificaciones inteligentes y más herramientas para tu institución.
        </p>
        <div class="mt-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold"
             style="border-color: var(--border-subtle-2); background: var(--bg-surface-3); color: var(--text-muted);">
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M14.7 6.3a4 4 0 00-5.66 5.66L4 17l3 3 5.04-5.04a4 4 0 005.66-5.66l-2.12 2.12-2.83-2.83z" />
          </svg>
          En construcción — disponible más adelante
        </div>
      </div>
    </div>
  `,
})
export class PremiumPage {}
