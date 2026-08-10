import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PwaInstallService } from '../../../core/services/pwa-install.service';

@Component({
  selector: 'app-install-pwa',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="showBanner()"
         class="fixed bottom-4 left-1/2 z-[9998] w-[92%] max-w-md -translate-x-1/2 animate-slide-up rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
      <div class="flex items-start gap-3">
        <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white">
          <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v11.25m0 0l-3.75-3.75M12 15.75l3.75-3.75M4.5 19.5h15" />
          </svg>
        </div>
        <div class="flex-1">
          <p class="text-sm font-semibold text-slate-900">Instala ControlAsist</p>
          <p class="mt-0.5 text-xs text-slate-500">Agrégala a tu pantalla de inicio y úsala como una app.</p>
          <div class="mt-3 flex gap-2">
            <button (click)="install()" class="btn-primary btn-sm">Instalar</button>
            <button (click)="dismiss()" class="btn-ghost btn-sm">Ahora no</button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class InstallPwaComponent {
  private dismissed = signal(!!sessionStorage.getItem('pwa-dismissed'));

  showBanner = computed(
    () => this.pwaInstall.canInstall() && !this.pwaInstall.isInstalled() && !this.dismissed()
  );

  constructor(private pwaInstall: PwaInstallService) {}

  async install() {
    await this.pwaInstall.promptInstall();
  }

  dismiss() {
    this.dismissed.set(true);
    sessionStorage.setItem('pwa-dismissed', '1');
  }
}
