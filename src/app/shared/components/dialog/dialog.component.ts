import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Overlay genérico reutilizable en lugar de los modales de Ionic de la app original.
 * El padre sigue controlando su propio flag `open`; este componente solo aporta el
 * chrome (overlay + tarjeta animada) y notifica cierre por backdrop/Escape via (closed).
 */
@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      *ngIf="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      (click)="closed.emit()"
    >
      <div
        class="w-full max-h-[90vh] overflow-y-auto modal-enter rounded-3xl bg-white p-6 shadow-2xl"
        [ngClass]="sizeClass"
        (click)="$event.stopPropagation()"
      >
        <ng-content></ng-content>
      </div>
    </div>
  `,
})
export class DialogComponent {
  @Input() open = false;
  @Input() size: 'sm' | 'md' | 'lg' = 'sm';
  @Output() closed = new EventEmitter<void>();

  get sizeClass() {
    return { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }[this.size];
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.open) this.closed.emit();
  }
}
