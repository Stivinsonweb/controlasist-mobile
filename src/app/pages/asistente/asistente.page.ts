import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AsisPreferenciasService } from '../../core/services/asis-preferencias.service';
import { AsisChatComponent } from '../../shared/components/mascota-asistente/asis-chat.component';
import { AsisAnimalComponent } from '../../shared/components/mascota-asistente/asis-animal.component';

/** Página de Asis en el panel: historial de conversaciones a la izquierda y el chat a la derecha. */
@Component({
  selector: 'app-asistente',
  standalone: true,
  imports: [CommonModule, RouterLink, AsisChatComponent, AsisAnimalComponent],
  template: `
    <div class="mx-auto max-w-6xl animate-fade-in">
      <div class="mb-4">
        <h1 class="text-xl font-bold" style="color: var(--text-primary);">Asis, tu <span class="text-gradient-accent">asistente</span></h1>
        <p class="mt-1 text-sm" style="color: var(--text-muted);">
          Revisa tus conversaciones, retoma cualquiera y personaliza a Asis (animal y sonido) con el botón de la paleta.
        </p>
      </div>
      <ng-container *ngIf="auth.currentProfile$ | async as p">
        <app-asis-chat *ngIf="p.rol !== 'docente' || p.premium_activo; else soloPremium" [pagina]="true" [rol]="$any(p.rol)" [nombre]="p.nombres">
          <div avatar class="avatar"><app-asis-animal [animal]="prefs.animal()" [tam]="40"></app-asis-animal></div>
        </app-asis-chat>
      </ng-container>

      <!-- Docente sin Premium -->
      <ng-template #soloPremium>
        <div class="card mx-auto max-w-xl p-8 text-center">
          <app-asis-animal [animal]="prefs.animal()" [tam]="96"></app-asis-animal>
          <p class="mt-3 text-lg font-bold" style="color: var(--text-primary);">Asis es parte de Premium</p>
          <p class="mt-2 text-sm" style="color: var(--text-muted);">
            Con Premium, Asis te dice quién está en riesgo, te lee los reportes de asistencia y crea asignaturas,
            horarios y actividades por ti (siempre con tu confirmación). Si nunca has usado Premium, pruébalo gratis por 1 mes.
          </p>
          <a routerLink="/premium" class="btn-primary mt-5 inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold">Activar Premium</a>
        </div>
      </ng-template>
    </div>
  `,
  styles: [
    `.avatar { width: 44px; height: 44px; border-radius: 14px; background: rgba(255, 255, 255, .2); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }`,
  ],
})
export class AsistentePage {
  constructor(public auth: AuthService, public prefs: AsisPreferenciasService) {}
}
