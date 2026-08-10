import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PwaInstallService {
  private deferredPrompt: any = null;

  /** true si el navegador disparó beforeinstallprompt y aún no se ha usado. */
  canInstall = signal(false);
  /** true si la app ya corre en modo standalone (instalada). */
  isInstalled = signal(this.detectStandalone());
  /** true en Safari/iOS, donde no existe beforeinstallprompt y hay que guiar manualmente. */
  isIOS = signal(this.detectIOS());

  constructor() {
    window.addEventListener('beforeinstallprompt', (event: any) => {
      event.preventDefault();
      this.deferredPrompt = event;
      this.canInstall.set(true);
    });

    window.addEventListener('appinstalled', () => {
      this.isInstalled.set(true);
      this.canInstall.set(false);
      this.deferredPrompt = null;
    });

    window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
      this.isInstalled.set(e.matches);
    });
  }

  private detectStandalone(): boolean {
    return (
      window.matchMedia?.('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    );
  }

  private detectIOS(): boolean {
    const ua = window.navigator.userAgent;
    const isAppleDevice = /iPad|iPhone|iPod/.test(ua) || (ua.includes('Macintosh') && 'ontouchend' in document);
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
    return isAppleDevice && isSafari;
  }

  async promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
    if (!this.deferredPrompt) return 'unavailable';
    this.deferredPrompt.prompt();
    const choice = await this.deferredPrompt.userChoice;
    this.deferredPrompt = null;
    this.canInstall.set(false);
    return choice.outcome;
  }
}
