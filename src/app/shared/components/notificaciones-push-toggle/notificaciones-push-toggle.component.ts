import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PushNotificationsService } from '../../../core/services/push-notifications.service';
import { ToastService } from '../../../core/services/toast.service';

/**
 * Botón "Activar recordatorios de clase" (Funcionalidad 5) para las páginas de perfil de docente
 * y estudiante. A propósito NO se muestra ni pide permiso automáticamente al entrar a la app —
 * solo cuando el usuario lo activa explícitamente aquí, en un lugar con contexto.
 */
@Component({
  selector: 'app-notificaciones-push-toggle',
  standalone: true,
  imports: [CommonModule],
  // Sin esto el host queda `display: inline` (default de los custom elements) y el
  // `margin-top` que le da `space-y-6` en la página de perfil no tiene ningún efecto —
  // por eso quedaba pegado a la tarjeta anterior.
  host: { style: 'display: block;' },
  template: `
    <div class="card p-6">
      <div class="flex items-center justify-between gap-4">
        <div>
          <h3 class="text-base font-bold" style="color: var(--text-primary);">Recordatorios de clase</h3>
          <p class="mt-1 text-sm" style="color: var(--text-muted);">
            Recibe una notificación en tu navegador antes de que empiece cada clase, incluso con la app cerrada.
          </p>
        </div>
        <button
          *ngIf="soportado()"
          type="button"
          (click)="toggle()"
          [disabled]="cargando()"
          class="relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50"
          [style.background]="suscrito() ? 'var(--accent-from)' : 'var(--border-subtle-2)'">
          <span class="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all" [style.left]="suscrito() ? '22px' : '2px'"></span>
        </button>
      </div>
      <p *ngIf="!soportado()" class="mt-2 text-xs" style="color: var(--text-muted);">
        Tu navegador no soporta notificaciones push, o necesitas instalar ControlAsist como app para activarlas.
      </p>
    </div>
  `,
})
export class NotificacionesPushToggleComponent implements OnInit {
  @Input({ required: true }) usuarioId!: string;
  @Input({ required: true }) rol!: 'docente' | 'estudiante';

  soportado = signal(false);
  suscrito = signal(false);
  cargando = signal(false);

  constructor(private pushService: PushNotificationsService, private toast: ToastService) {}

  async ngOnInit() {
    this.soportado.set(this.pushService.soportado);
    if (this.soportado()) {
      this.suscrito.set(await this.pushService.yaSuscrito());
    }
  }

  async toggle() {
    this.cargando.set(true);
    try {
      if (this.suscrito()) {
        await this.pushService.desactivar(this.usuarioId);
        this.suscrito.set(false);
        this.toast.success('Recordatorios de clase desactivados');
      } else {
        await this.pushService.activar(this.usuarioId, this.rol);
        this.suscrito.set(true);
        this.toast.success('Recordatorios de clase activados');
      }
    } catch (e: any) {
      console.error('Error activando/desactivando notificaciones push:', e);
      this.toast.error(e.message || 'No se pudo cambiar la preferencia de notificaciones');
    } finally {
      this.cargando.set(false);
    }
  }
}
