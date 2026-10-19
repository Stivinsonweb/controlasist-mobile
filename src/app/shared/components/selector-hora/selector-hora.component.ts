import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

type Campo = 'inicio' | 'fin';
type Modo = 'hora' | 'minuto';

interface Marca {
  valor: number;
  label: string;
  x: number;
  y: number;
}

const CENTRO = 110;
const RADIO = 82;

function marcas(valores: number[], label: (v: number) => string): Marca[] {
  return valores.map((valor, i) => {
    const angulo = (i * 30 - 90) * (Math.PI / 180);
    return { valor, label: label(valor), x: CENTRO + RADIO * Math.cos(angulo), y: CENTRO + RADIO * Math.sin(angulo) };
  });
}

const MARCAS_HORA = marcas([12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], (v) => String(v));
const MARCAS_MINUTO = marcas([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55], (v) => String(v).padStart(2, '0'));

/**
 * Selector de hora de inicio y fin (o de una sola hora, con `soloInicio`) con reloj: se toca el campo, se elige la hora en la
 * esfera (con a. m./p. m.) y luego los minutos. Al terminar el inicio pasa solo al fin.
 * Trabaja con el mismo formato "HH:mm" (24 h) que guardaba el <input type="time">.
 */
@Component({
  selector: 'app-selector-hora',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="grid gap-3" [ngClass]="soloInicio ? 'grid-cols-1' : 'grid-cols-2'">
      <div *ngFor="let c of campos">
        <label class="mb-1.5 block text-sm font-medium text-slate-700">{{ etiqueta(c) }}</label>
        <button type="button" (click)="abrir(c)" class="input-field flex w-full items-center justify-between gap-2 text-left"
                [ngClass]="activo === c ? 'ring-2 ring-primary-400 border-primary-400' : ''">
          <span [ngClass]="valor(c) ? 'text-slate-900 font-medium' : 'text-slate-400'">{{ valor(c) ? formato12(valor(c)) : 'Seleccionar' }}</span>
          <svg class="h-4 w-4 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9" /><path stroke-linecap="round" d="M12 7v5l3 2" /></svg>
        </button>
      </div>
    </div>
    <p *ngIf="!soloInicio && inicio && fin && fin <= inicio" class="mt-1.5 text-xs font-medium text-red-600">La hora fin debe ser posterior a la hora inicio.</p>

    <div *ngIf="activo" class="mt-3 rounded-2xl border border-slate-200 p-4">
      <div class="flex items-center justify-center gap-3">
        <div class="flex items-baseline text-4xl font-bold tabular-nums">
          <button type="button" (click)="modo = 'hora'" class="rounded-lg px-1.5" [ngClass]="modo === 'hora' ? 'bg-primary-50 text-primary-600' : 'text-slate-400'">{{ hora12 }}</button>
          <span class="text-slate-300">:</span>
          <button type="button" (click)="modo = 'minuto'" class="rounded-lg px-1.5" [ngClass]="modo === 'minuto' ? 'bg-primary-50 text-primary-600' : 'text-slate-400'">{{ minutoTexto }}</button>
        </div>
        <div class="flex flex-col gap-1">
          <button type="button" (click)="setPm(false)" class="rounded-md px-2 py-0.5 text-xs font-semibold" [ngClass]="!pm ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-500'">a. m.</button>
          <button type="button" (click)="setPm(true)" class="rounded-md px-2 py-0.5 text-xs font-semibold" [ngClass]="pm ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-500'">p. m.</button>
        </div>
      </div>
      <p class="mt-1 text-center text-xs text-slate-500">{{ etiqueta(activo) }} · {{ modo === 'hora' ? 'elige la hora' : 'elige los minutos' }}</p>

      <svg viewBox="0 0 220 220" class="mx-auto mt-2 block w-full max-w-[240px] select-none">
        <circle cx="110" cy="110" r="106" class="fill-slate-100" />
        <line x1="110" y1="110" [attr.x2]="manecilla.x" [attr.y2]="manecilla.y" class="stroke-primary-600" stroke-width="2" />
        <circle cx="110" cy="110" r="4" class="fill-primary-600" />
        <g *ngFor="let m of marcasActuales" (click)="elegir(m.valor)" class="cursor-pointer">
          <circle [attr.cx]="m.x" [attr.cy]="m.y" r="17" [ngClass]="m.valor === seleccionActual ? 'fill-primary-600' : 'fill-transparent hover:fill-slate-200'" />
          <text [attr.x]="m.x" [attr.y]="m.y" text-anchor="middle" dominant-baseline="central" font-size="14" font-weight="600"
                [ngClass]="m.valor === seleccionActual ? 'fill-white' : 'fill-slate-700'" style="pointer-events: none;">{{ m.label }}</text>
        </g>
      </svg>

      <div class="mt-3 flex gap-2">
        <button type="button" (click)="limpiar()" class="btn-outline flex-1">Borrar</button>
        <button type="button" (click)="listo()" class="btn-primary flex-1">{{ activo === 'inicio' && !fin && !soloInicio ? 'Siguiente' : 'Listo' }}</button>
      </div>
    </div>
  `,
})
export class SelectorHoraComponent {
  @Input() inicio = '';
  @Input() fin = '';
  @Output() inicioChange = new EventEmitter<string>();
  @Output() finChange = new EventEmitter<string>();

  /** Una sola hora (p. ej. la hora límite de una entrega) en vez del par inicio/fin. */
  @Input() soloInicio = false;
  @Input() etiquetaInicio = 'Hora inicio';

  get campos(): Campo[] {
    return this.soloInicio ? ['inicio'] : ['inicio', 'fin'];
  }

  etiqueta(c: Campo) {
    return c === 'inicio' ? this.etiquetaInicio : 'Hora fin';
  }
  activo: Campo | null = null;
  modo: Modo = 'hora';
  hora24 = 8;
  minuto = 0;

  valor(c: Campo) {
    return c === 'inicio' ? this.inicio : this.fin;
  }

  formato12(hhmm: string) {
    const [h, m] = hhmm.split(':').map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'a. m.' : 'p. m.'}`;
  }

  get pm() {
    return this.hora24 >= 12;
  }

  get hora12() {
    return this.hora24 % 12 || 12;
  }

  get minutoTexto() {
    return String(this.minuto).padStart(2, '0');
  }

  get marcasActuales() {
    return this.modo === 'hora' ? MARCAS_HORA : MARCAS_MINUTO;
  }

  get seleccionActual() {
    return this.modo === 'hora' ? this.hora12 : this.minuto;
  }

  get manecilla() {
    const pasos = this.modo === 'hora' ? this.hora12 % 12 : this.minuto / 5;
    const angulo = (pasos * 30 - 90) * (Math.PI / 180);
    return { x: CENTRO + (RADIO - 17) * Math.cos(angulo), y: CENTRO + (RADIO - 17) * Math.sin(angulo) };
  }

  abrir(c: Campo) {
    this.activo = c;
    this.modo = 'hora';
    const actual = this.valor(c);
    if (actual) {
      const [h, m] = actual.split(':').map(Number);
      this.hora24 = h;
      this.minuto = m;
    } else if (c === 'fin' && this.inicio) {
      // Propone una hora después del inicio como punto de partida.
      const [h, m] = this.inicio.split(':').map(Number);
      this.hora24 = (h + 1) % 24;
      this.minuto = m;
    } else {
      this.hora24 = 8;
      this.minuto = 0;
    }
    this.emitir();
  }

  setPm(pm: boolean) {
    if (pm !== this.pm) this.hora24 = (this.hora24 + 12) % 24;
    this.emitir();
  }

  elegir(valor: number) {
    if (this.modo === 'hora') {
      this.hora24 = (valor % 12) + (this.pm ? 12 : 0);
      this.modo = 'minuto';
    } else {
      this.minuto = valor;
    }
    this.emitir();
  }

  listo() {
    if (this.activo === 'inicio' && !this.fin && !this.soloInicio) {
      this.abrir('fin');
      return;
    }
    this.activo = null;
  }

  limpiar() {
    if (this.activo === 'inicio') this.inicioChange.emit((this.inicio = ''));
    else this.finChange.emit((this.fin = ''));
    this.activo = null;
  }

  private emitir() {
    const hhmm = `${String(this.hora24).padStart(2, '0')}:${this.minutoTexto}`;
    if (this.activo === 'inicio') this.inicioChange.emit((this.inicio = hhmm));
    else if (this.activo === 'fin') this.finChange.emit((this.fin = hhmm));
  }
}
