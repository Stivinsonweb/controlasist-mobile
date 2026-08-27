import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface PuntoTendencia {
  fecha: string;
  valor: number;
}

/**
 * Línea de tendencia simple (SVG) — una sola serie (% de asistencia por clase), sin leyenda (el
 * título del bloque ya dice qué se mide). Línea de 2px, marcador >=8px con anillo de 2px del color
 * de superficie, valor directo en el último punto, grilla horizontal recesiva en 0/50/100.
 */
@Component({
  selector: 'app-tendencia-linea',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg *ngIf="puntos.length > 0" [attr.viewBox]="'0 0 ' + anchoTotal + ' 120'" class="w-full" style="overflow: visible;">
      <!-- Grilla recesiva en 0/50/100% -->
      <line *ngFor="let g of [0, 50, 100]" x1="0" [attr.x2]="anchoTotal" [attr.y1]="y(g)" [attr.y2]="y(g)" stroke="var(--border-subtle)" stroke-width="1" />
      <text *ngFor="let g of [0, 50, 100]" x="0" [attr.y]="y(g) - 3" class="fill-current text-[8px]" style="color: var(--text-muted); fill: var(--text-muted);">{{ g }}%</text>

      <!-- Línea -->
      <polyline [attr.points]="puntosSvg()" fill="none" stroke="var(--accent-from)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />

      <!-- Marcadores -->
      <g *ngFor="let p of puntos; let i = index">
        <circle [attr.cx]="x(i)" [attr.cy]="y(p.valor)" r="4.5" fill="var(--accent-from)" stroke="var(--bg-surface)" stroke-width="2">
          <title>{{ p.fecha }}: {{ p.valor }}%</title>
        </circle>
      </g>

      <!-- Valor directo en el último punto -->
      <text *ngIf="ultimo() as u" [attr.x]="x(puntos.length - 1)" [attr.y]="y(u.valor) - 10" text-anchor="end" class="text-[9px] font-semibold" style="fill: var(--text-primary);">
        {{ u.valor }}%
      </text>
    </svg>
    <p *ngIf="puntos.length === 0" class="text-xs" style="color: var(--text-muted);">Sin clases registradas todavía.</p>
  `,
})
export class TendenciaLineaComponent {
  @Input() puntos: PuntoTendencia[] = [];

  private margenIzq = 26;
  private margenDer = 8;

  get anchoTotal(): number {
    return Math.max(200, this.margenIzq + this.margenDer + (this.puntos.length - 1) * 40);
  }

  x(i: number): number {
    if (this.puntos.length <= 1) return this.margenIzq;
    const anchoUtil = this.anchoTotal - this.margenIzq - this.margenDer;
    return this.margenIzq + (i / (this.puntos.length - 1)) * anchoUtil;
  }

  y(valor: number): number {
    const arriba = 10;
    const abajo = 100;
    return abajo - (valor / 100) * (abajo - arriba);
  }

  puntosSvg(): string {
    return this.puntos.map((p, i) => `${this.x(i)},${this.y(p.valor)}`).join(' ');
  }

  ultimo(): PuntoTendencia | null {
    return this.puntos.length > 0 ? this.puntos[this.puntos.length - 1] : null;
  }
}
