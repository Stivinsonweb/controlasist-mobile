import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PwaInstallService } from '../../../core/services/pwa-install.service';

@Component({
  selector: 'app-install-pwa-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      *ngIf="!pwaInstall.isInstalled()"
      (click)="onClick()"
      class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100">
      <svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v11.25m0 0l-3.75-3.75M12 15.75l3.75-3.75M4.5 19.5h15" />
      </svg>
      Instalar app
    </button>

    <div *ngIf="pwaInstall.isInstalled()" class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-emerald-600">
      <svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
      </svg>
      App instalada
    </div>

    <!-- Modal instrucciones iOS -->
    <div *ngIf="showIosModal()" class="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 p-4" (click)="showIosModal.set(false)">
      <div class="w-full max-w-sm rounded-2xl bg-white p-6 shadow-card" (click)="$event.stopPropagation()">
        <h3 class="text-lg font-bold text-slate-900">Instalar en tu iPhone/iPad</h3>
        <p class="mt-1 text-sm text-slate-500">Safari no permite instalar apps automáticamente. Sigue estos pasos:</p>
        <ol class="mt-4 space-y-3 text-sm text-slate-700">
          <li class="flex items-start gap-3">
            <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">1</span>
            <span class="flex items-center gap-2">
              Toca el botón <strong>Compartir</strong>
              <svg class="h-5 w-5 shrink-0 text-primary-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v13.5m0-13.5l-3.75 3.75M12 3l3.75 3.75M4.5 13.5v5.25A2.25 2.25 0 006.75 21h10.5a2.25 2.25 0 002.25-2.25V13.5" />
              </svg>
              en la barra de Safari.
            </span>
          </li>
          <li class="flex items-start gap-3">
            <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">2</span>
            <span>Desplázate y selecciona <strong>"Agregar a pantalla de inicio"</strong>.</span>
          </li>
          <li class="flex items-start gap-3">
            <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">3</span>
            <span>Confirma tocando <strong>"Agregar"</strong> arriba a la derecha.</span>
          </li>
        </ol>
        <button (click)="showIosModal.set(false)" class="btn-primary mt-6 w-full">Entendido</button>
      </div>
    </div>

    <!-- Modal fallback genérico (navegador sin soporte nativo) -->
    <div *ngIf="showGenericModal()" class="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 p-4" (click)="showGenericModal.set(false)">
      <div class="w-full max-w-sm rounded-2xl bg-white p-6 shadow-card" (click)="$event.stopPropagation()">
        <h3 class="text-lg font-bold text-slate-900">Instalar ControlAsist</h3>
        <p class="mt-2 text-sm text-slate-500">
          Tu navegador aún no ofreció la instalación automática. Busca la opción
          <strong>"Instalar aplicación"</strong> o <strong>"Agregar a pantalla de inicio"</strong>
          en el menú de tu navegador (usualmente el ícono ⋮ o el menú de compartir).
        </p>
        <button (click)="showGenericModal.set(false)" class="btn-primary mt-6 w-full">Entendido</button>
      </div>
    </div>
  `,
})
export class InstallPwaButtonComponent {
  showIosModal = signal(false);
  showGenericModal = signal(false);

  constructor(public pwaInstall: PwaInstallService) {}

  async onClick() {
    if (this.pwaInstall.isIOS()) {
      this.showIosModal.set(true);
      return;
    }
    if (this.pwaInstall.canInstall()) {
      await this.pwaInstall.promptInstall();
      return;
    }
    this.showGenericModal.set(true);
  }
}
