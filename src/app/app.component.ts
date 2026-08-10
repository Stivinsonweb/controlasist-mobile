import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from './shared/components/toast/toast.component';
import { InstallPwaComponent } from './shared/components/install-pwa/install-pwa.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastContainerComponent, InstallPwaComponent],
  template: `
    <router-outlet></router-outlet>
    <app-toast-container></app-toast-container>
    <app-install-pwa></app-install-pwa>
  `,
})
export class AppComponent {}
