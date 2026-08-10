import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Horario } from '../../../core/services/asignaturas.service';

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const COLORES_ESTADO: Record<string, string> = {
  realizada: '#10b981',
  cancelada: '#ef4444',
  aplazada: '#f59e0b',
  en_curso: '#3b82f6',
  pendiente: '#f59e0b',
  sin_registrar: '#f97316',
  programada: '#94a3b8',
};

const TEXTOS_ESTADO: Record<string, string> = {
  realizada: 'Realizada',
  cancelada: 'Cancelada',
  aplazada: 'Aplazada',
  en_curso: 'En curso',
  pendiente: 'Pendiente',
  sin_registrar: 'Sin registrar',
  programada: 'Programada',
};

/**
 * Grilla semanal (lunes a sábado) con el motor de derivación de estado de la app original:
 * si el horario tiene un estado guardado HOY se respeta; si no, se calcula comparando la
 * hora actual contra hora_inicio/hora_fin. Se refresca cada 60s para que "en_curso" /
 * "sin_registrar" avancen solos sin recargar la página.
 */
@Component({
  selector: 'app-calendario-clases',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <div *ngFor="let dia of [1,2,3,4,5,6]" class="min-w-0">
        <h4 class="mb-2 text-center text-xs font-bold uppercase tracking-wide" [style.color]="dia === diaHoy ? 'var(--text-primary)' : 'var(--text-muted)'">{{ diasSemana[dia] }}</h4>
        <div class="space-y-2 rounded-xl p-1.5" [style.background]="dia === diaHoy ? 'rgba(255,255,255,0.04)' : 'transparent'">
          <button
            type="button"
            *ngFor="let h of horariosPorDia(dia)"
            (click)="onClaseClick(h)"
            class="block w-full rounded-lg border-l-4 p-2.5 text-left transition-transform hover:-translate-y-0.5"
            style="background: var(--bg-surface-3); border-color: var(--border-subtle);"
            [style.border-left-color]="getColorEstado(getEstadoClase(h))"
          >
            <span class="block text-[11px] font-bold" [style.color]="getColorEstado(getEstadoClase(h))">
              {{ getTextoEstado(getEstadoClase(h)) }}
            </span>
            <span class="mt-1 block text-xs font-medium" style="color: var(--text-secondary);">{{ formatHora(h.hora_inicio) }} - {{ formatHora(h.hora_fin) }}</span>
            <span *ngIf="h.aula" class="mt-0.5 block text-[11px]" style="color: var(--text-muted);">{{ h.aula }}</span>
          </button>

          <p *ngIf="horariosPorDia(dia).length === 0" class="rounded-lg border border-dashed py-3 text-center text-[11px]" style="border-color: var(--border-subtle); color: var(--text-muted);">
            Sin clases
          </p>
        </div>
      </div>
    </div>
  `,
})
export class CalendarioClasesComponent implements OnInit, OnChanges, OnDestroy {
  @Input() horarios: Horario[] = [];
  @Output() claseClick = new EventEmitter<{ horario: Horario; estado: string; esHoy: boolean }>();

  diasSemana = DIAS_SEMANA;

  /** Día de la semana (0-6) usado por la plantilla para resaltar la columna de "hoy". */
  diaHoy = 0;

  private diaActual = 0;
  private horaActual = '';
  private fechaActual = '';
  private estadosHorarios = new Map<string, string>();
  private intervalId?: ReturnType<typeof setInterval>;

  ngOnInit() {
    this.actualizarFechaHora();
    this.procesarEstados();
    this.intervalId = setInterval(() => {
      this.actualizarFechaHora();
      this.procesarEstados();
    }, 60000);
  }

  ngOnChanges() {
    this.procesarEstados();
  }

  ngOnDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  private actualizarFechaHora() {
    const ahora = new Date();
    this.diaActual = ahora.getDay();
    this.diaHoy = this.diaActual;
    this.horaActual = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
    this.fechaActual = ahora.toISOString().split('T')[0];
  }

  private procesarEstados() {
    this.estadosHorarios.clear();
    for (const h of this.horarios) {
      if (h.id) this.estadosHorarios.set(h.id, this.calcularEstadoHorario(h));
    }
  }

  private calcularEstadoHorario(horario: Horario): string {
    if (horario.estado && horario.estado !== 'pendiente') {
      if (horario.fecha_ultima_actualizacion === this.fechaActual) {
        return horario.estado;
      }
    }

    const esHoy = horario.dia_semana === this.diaActual;
    if (!esHoy) return 'programada';

    if (this.horaActual < horario.hora_inicio) return 'pendiente';
    if (this.horaActual >= horario.hora_inicio && this.horaActual <= horario.hora_fin) return 'en_curso';
    if (this.horaActual > horario.hora_fin) return 'sin_registrar';
    return 'pendiente';
  }

  horariosPorDia(dia: number): Horario[] {
    return this.horarios.filter((h) => h.dia_semana === dia && h.activo).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
  }

  getEstadoClase(h: Horario): string {
    return (h.id && this.estadosHorarios.get(h.id)) || 'pendiente';
  }

  getColorEstado(estado: string): string {
    return COLORES_ESTADO[estado] || COLORES_ESTADO['programada'];
  }

  getTextoEstado(estado: string): string {
    return TEXTOS_ESTADO[estado] || TEXTOS_ESTADO['programada'];
  }

  formatHora(hora: string): string {
    if (!hora) return '';
    const [h, m] = hora.split(':');
    const horas = parseInt(h, 10);
    const ampm = horas >= 12 ? 'PM' : 'AM';
    const h12 = horas % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  }

  esHoy(h: Horario): boolean {
    return h.dia_semana === this.diaActual;
  }

  onClaseClick(h: Horario) {
    this.claseClick.emit({ horario: h, estado: this.getEstadoClase(h), esHoy: this.esHoy(h) });
  }
}
