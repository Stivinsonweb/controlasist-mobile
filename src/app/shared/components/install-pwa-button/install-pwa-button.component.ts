import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PwaInstallService } from '../../../core/services/pwa-install.service';
import { GuideStep, InstallGuideComponent } from '../install-guide/install-guide.component';

const PASOS_IOS: GuideStep[] = [
  { variant: 'ios-share', title: 'Toca "Compartir"', description: 'En la barra de Safari, toca el ícono del cuadrado con la flecha hacia arriba.' },
  { variant: 'ios-add-home', title: 'Agregar a inicio', description: 'Desplázate en el menú y selecciona "Agregar a pantalla de inicio".' },
  { variant: 'ios-confirm', title: 'Confirma', description: 'Toca "Agregar" en la esquina superior derecha y listo.' },
];

const PASOS_ANDROID: GuideStep[] = [
  { variant: 'android-menu', title: 'Abre el menú', description: 'Toca el ícono de tres puntos, arriba a la derecha del navegador.' },
  { variant: 'android-install', title: 'Instalar aplicación', description: 'Selecciona "Instalar aplicación" en el menú y confirma.' },
];

const PASOS_DESKTOP: GuideStep[] = [
  { variant: 'desktop-install', title: 'Instala desde la barra de direcciones', description: 'Toca el ícono de instalación (monitor con flecha) al final de la barra de direcciones.' },
];

@Component({
  selector: 'app-install-pwa-button',
  standalone: true,
  imports: [CommonModule, InstallGuideComponent],
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
        <div class="mt-4">
          <app-install-guide [steps]="pasosIos" />
        </div>
        <button (click)="showIosModal.set(false)" class="btn-primary mt-6 w-full">Entendido</button>
      </div>
    </div>

    <!-- Modal fallback (navegador sin beforeinstallprompt: Android o escritorio) -->
    <div *ngIf="showGenericModal()" class="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 p-4" (click)="showGenericModal.set(false)">
      <div class="w-full max-w-sm rounded-2xl bg-white p-6 shadow-card" (click)="$event.stopPropagation()">
        <h3 class="text-lg font-bold text-slate-900">Instalar ControlAsist</h3>
        <p class="mt-1 text-sm text-slate-500">Sigue estos pasos para agregarla a tu dispositivo:</p>
        <div class="mt-4">
          <app-install-guide [steps]="pwaInstall.isAndroid() ? pasosAndroid : pasosDesktop" />
        </div>
        <button (click)="showGenericModal.set(false)" class="btn-primary mt-6 w-full">Entendido</button>
      </div>
    </div>
  `,
})
export class InstallPwaButtonComponent {
  showIosModal = signal(false);
  showGenericModal = signal(false);

  pasosIos = PASOS_IOS;
  pasosAndroid = PASOS_ANDROID;
  pasosDesktop = PASOS_DESKTOP;

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
