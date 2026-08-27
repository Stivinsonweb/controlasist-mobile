import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface BarraRanking {
  label: string;
  valor: number;
}

/**
 * Ranking de barras horizontales — una magnitud (ej. % de asistencia), un solo hue, sin leyenda
 * (una sola serie: el título del bloque ya dice qué se mide). Valor en la punta de cada barra,
 * como pide la especificación de marcas. El color se puede pasar (ej. el acento del docente);
 * por defecto usa el verde de "presente" del propio sistema de estados.
 */
@Component({
  selector: 'app-ranking-barras',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-2.5">
      <div *ngFor="let b of datos" class="flex items-center gap-3">
        <span class="w-28 shrink-0 truncate text-xs" style="color: var(--text-secondary);" [title]="b.label">{{ b.label }}</span>
        <div class="h-4 flex-1 overflow-hidden rounded-full" style="background: var(--bg-surface-2);">
          <div class="h-full rounded-full transition-all" [style.width.%]="pct(b.valor)" [style.background]="colorBarra(b.valor)"></div>
        </div>
        <span class="w-10 shrink-0 text-right text-xs font-semibold" style="color: var(--text-primary);">{{ b.valor }}{{ sufijo }}</span>
      </div>
      <p *ngIf="datos.length === 0" class="text-xs" style="color: var(--text-muted);">Sin datos suficientes todavía.</p>
    </div>
  `,
})
export class RankingBarrasComponent {
  @Input() datos: BarraRanking[] = [];
  @Input() color = 'var(--accent-from)';
  @Input() sufijo = '%';
  /** Si se define, las barras por debajo de este valor se pintan en rojo (alerta) en vez del color normal. */
  @Input() umbralAlerta: number | null = null;
  @Input() maximo = 100;

  pct(valor: number): number {
    return this.maximo > 0 ? Math.min(100, (valor / this.maximo) * 100) : 0;
  }

  colorBarra(valor: number): string {
    if (this.umbralAlerta !== null && valor < this.umbralAlerta) return '#ef4444';
    return this.color;
  }
}
