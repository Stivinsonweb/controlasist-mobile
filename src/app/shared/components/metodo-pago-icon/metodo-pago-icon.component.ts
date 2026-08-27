import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MetodoPagoTipo, catalogoMetodo } from '../../utils/metodos-pago.util';

/**
 * Ícono genérico por método de pago (celular para billeteras, banco para cuentas) coloreado con
 * un acento distintivo por entidad — no son los logos oficiales de Nequi/Bancolombia/etc., serían
 * marcas registradas de terceros.
 */
@Component({
  selector: 'app-metodo-pago-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="flex shrink-0 items-center justify-center rounded-full" [class]="sizeClass" [style.background]="color">
      <svg *ngIf="esCelular" class="h-1/2 w-1/2 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="7" y="2" width="10" height="20" rx="2" />
        <path stroke-linecap="round" d="M11 18h2" />
      </svg>
      <svg *ngIf="!esCelular" class="h-1/2 w-1/2 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3 21h18M4 21V10.5M20 21V10.5M2.25 10.5L12 3l9.75 7.5M8 21v-6a1 1 0 011-1h6a1 1 0 011 1v6" />
      </svg>
    </span>
  `,
})
export class MetodoPagoIconComponent {
  @Input() tipo: MetodoPagoTipo = 'otro';
  @Input() sizeClass = 'h-8 w-8';

  get color(): string {
    return catalogoMetodo(this.tipo).color;
  }

  get esCelular(): boolean {
    return this.tipo === 'nequi' || this.tipo === 'daviplata';
  }
}
