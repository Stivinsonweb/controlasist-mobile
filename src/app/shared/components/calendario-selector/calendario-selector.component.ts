import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

interface DiaMes {
  dia: number;
  fecha: Date;
  esHoy: boolean;
  esMesActual: boolean;
  seleccionado: boolean;
}

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DIAS_SEMANA_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function formatearFecha(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

/**
 * Selector de fecha en grilla mensual (42 celdas). Bloquea meses/fechas anteriores al mes/día
 * actual — no hay límite hacia adelante, a diferencia del selector de la app original que
 * también bloqueaba avanzar más allá del año en curso (una restricción sin motivo de negocio).
 */
@Component({
  selector: 'app-calendario-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rounded-xl border border-slate-200 p-3">
      <div class="flex items-center justify-between">
        <button type="button" (click)="mesAnterior()" [disabled]="!puedeRetroceder()" class="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30">
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
        </button>
        <p class="text-sm font-semibold text-slate-800">{{ nombreMes }} {{ anio }}</p>
        <button type="button" (click)="mesSiguiente()" class="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
        </button>
      </div>

      <div class="mt-2 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-400">
        <span *ngFor="let d of diasSemanaCortos">{{ d }}</span>
      </div>

      <div class="mt-1 grid grid-cols-7 gap-1">
        <button
          type="button"
          *ngFor="let d of diasMes"
          (click)="seleccionarDia(d)"
          [disabled]="!d.esMesActual || esFechaPasada(d)"
          class="flex h-8 items-center justify-center rounded-lg text-xs transition-colors disabled:cursor-not-allowed"
          [ngClass]="{
            'text-slate-300': !d.esMesActual,
            'text-slate-300 line-through': d.esMesActual && esFechaPasada(d),
            'text-slate-700 hover:bg-slate-100': d.esMesActual && !esFechaPasada(d) && !d.seleccionado,
            'bg-primary-600 text-white font-semibold hover:bg-primary-600': d.seleccionado,
            'ring-1 ring-primary-400': d.esHoy && !d.seleccionado
          }"
        >
          {{ d.dia }}
        </button>
      </div>
    </div>
  `,
})
export class CalendarioSelectorComponent implements OnInit, OnChanges {
  @Input() fechaSeleccionada?: string | null;
  @Output() fechaSeleccionadaChange = new EventEmitter<string>();

  mesActual = new Date();
  diasMes: DiaMes[] = [];
  nombreMes = '';
  anio = new Date().getFullYear();
  diasSemanaCortos = DIAS_SEMANA_CORTOS;

  ngOnInit() {
    this.generarCalendario();
  }

  ngOnChanges() {
    this.generarCalendario();
  }

  private generarCalendario() {
    const anio = this.mesActual.getFullYear();
    const mes = this.mesActual.getMonth();
    this.nombreMes = MESES[mes];
    this.anio = anio;

    const primerDia = new Date(anio, mes, 1);
    const ultimoDia = new Date(anio, mes + 1, 0);
    const diasEnMes = ultimoDia.getDate();
    const primerDiaSemana = primerDia.getDay();

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    this.diasMes = [];

    const diasMesAnterior = new Date(anio, mes, 0).getDate();
    for (let i = primerDiaSemana - 1; i >= 0; i--) {
      const dia = diasMesAnterior - i;
      this.diasMes.push({ dia, fecha: new Date(anio, mes - 1, dia), esHoy: false, esMesActual: false, seleccionado: false });
    }

    for (let dia = 1; dia <= diasEnMes; dia++) {
      const fecha = new Date(anio, mes, dia);
      const fechaStr = formatearFecha(fecha);
      this.diasMes.push({
        dia,
        fecha,
        esHoy: fecha.getTime() === hoy.getTime(),
        esMesActual: true,
        seleccionado: this.fechaSeleccionada === fechaStr,
      });
    }

    const diasRestantes = 42 - this.diasMes.length;
    for (let dia = 1; dia <= diasRestantes; dia++) {
      this.diasMes.push({ dia, fecha: new Date(anio, mes + 1, dia), esHoy: false, esMesActual: false, seleccionado: false });
    }
  }

  mesAnterior() {
    if (!this.puedeRetroceder()) return;
    this.mesActual = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() - 1, 1);
    this.generarCalendario();
  }

  mesSiguiente() {
    this.mesActual = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() + 1, 1);
    this.generarCalendario();
  }

  puedeRetroceder(): boolean {
    const hoy = new Date();
    return this.mesActual.getFullYear() > hoy.getFullYear() || (this.mesActual.getFullYear() === hoy.getFullYear() && this.mesActual.getMonth() > hoy.getMonth());
  }

  esFechaPasada(d: DiaMes): boolean {
    if (!d.esMesActual) return false;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return d.fecha < hoy;
  }

  seleccionarDia(d: DiaMes) {
    if (!d.esMesActual || this.esFechaPasada(d)) return;
    this.diasMes.forEach((x) => (x.seleccionado = false));
    d.seleccionado = true;
    const fechaStr = formatearFecha(d.fecha);
    this.fechaSeleccionada = fechaStr;
    this.fechaSeleccionadaChange.emit(fechaStr);
  }
}
