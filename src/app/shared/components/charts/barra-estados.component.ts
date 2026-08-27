import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SegmentoBarra {
  label: string;
  valor: number;
  color: string;
}

/**
 * Barra horizontal apilada por estado (presente/tarde/justificado/ausente, o cualquier serie de
 * conteos) — un solo track, un segmento por color con hueco de 2px entre ellos (nunca un borde),
 * extremos redondeados solo en las puntas del stack completo, y leyenda con conteo debajo
 * (nunca solo color: cada segmento ya trae su etiqueta en la leyenda).
 */
@Component({
  selector: 'app-barra-estados',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex h-4 w-full gap-[2px] overflow-hidden rounded-full" [style.background]="fijoClaro ? '#f1f5f9' : 'var(--bg-surface-2)'">
      <div
        *ngFor="let s of segmentosVisibles(); let first = first; let last = last"
        class="h-full transition-all"
        [style.width.%]="pct(s.valor)"
        [style.background]="s.color"
        [class.rounded-l-full]="first"
        [class.rounded-r-full]="last"
        [attr.title]="s.label + ': ' + s.valor"
      ></div>
    </div>
    <div class="mt-2 flex flex-wrap gap-x-3 gap-y-1">
      <span *ngFor="let s of segmentos" class="inline-flex items-center gap-1.5 text-[11px]" [style.color]="fijoClaro ? '#64748b' : 'var(--text-muted)'">
        <span class="h-2 w-2 shrink-0 rounded-full" [style.background]="s.color"></span>
        {{ s.label }}: <strong [style.color]="fijoClaro ? '#334155' : 'var(--text-secondary)'">{{ s.valor }}</strong>
      </span>
    </div>
  `,
})
export class BarraEstadosComponent {
  @Input() segmentos: SegmentoBarra[] = [];
  /** true cuando el componente vive dentro de un `<app-dialog>` u otra tarjeta siempre-clara, que no sigue el tema oscuro/claro de la app. */
  @Input() fijoClaro = false;

  segmentosVisibles(): SegmentoBarra[] {
    return this.segmentos.filter((s) => s.valor > 0);
  }

  private total(): number {
    return this.segmentos.reduce((sum, s) => sum + s.valor, 0);
  }

  pct(valor: number): number {
    const total = this.total();
    return total > 0 ? (valor / total) * 100 : 0;
  }
}
