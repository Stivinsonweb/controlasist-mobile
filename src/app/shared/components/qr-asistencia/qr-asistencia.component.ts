import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import QRCode from 'qrcode';
import { AsistenciaQrService, MarcaQr, QR_VENTANA_MS, SesionQr } from '../../../core/services/asistencia-qr.service';
import { ToastService } from '../../../core/services/toast.service';

export interface EstudianteQr {
  estudiante_id: string;
  nombres: string;
  apellidos: string;
}

/**
 * Pantalla completa para "Pasar lista con QR": muestra un código que cambia cada 20 s (para
 * proyectarlo en el aula) y la lista en vivo de quién ya marcó. Al terminar devuelve las marcas;
 * la página de la asignatura las aplica a la lista de "Tomar asistencia" para que el docente
 * revise y guarde como siempre.
 */
@Component({
  selector: 'app-qr-asistencia',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-[70] flex flex-col overflow-y-auto bg-white text-slate-900" #contenedor>
      <!-- Barra superior -->
      <div class="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-6">
        <div class="min-w-0">
          <p class="truncate text-base font-bold">{{ nombreAsignatura }}</p>
          <p class="text-xs text-slate-500">Pasar lista con QR · {{ fecha }} · {{ horaInicio }} - {{ horaFin }}</p>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          <button type="button" (click)="pantallaCompleta()" class="hidden rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 sm:block">
            Pantalla completa
          </button>
          <button type="button" (click)="cancelar()" class="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">Cerrar</button>
          <button type="button" (click)="terminar()" [disabled]="terminando()" class="btn-primary btn-sm">
            {{ terminando() ? 'Aplicando...' : 'Terminar y revisar' }}
          </button>
        </div>
      </div>

      <div *ngIf="cargando()" class="flex flex-1 items-center justify-center">
        <svg class="h-8 w-8 animate-spin text-primary-600" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
      </div>

      <div *ngIf="!cargando()" class="grid flex-1 grid-cols-1 gap-6 p-4 sm:p-6 lg:grid-cols-[1fr_340px]">
        <!-- QR -->
        <div class="flex flex-col items-center justify-center">
          <p class="mb-3 text-center text-lg font-bold sm:text-2xl">Escanea con la cámara de tu celular</p>
          <div class="rounded-3xl border-4 p-3 transition-colors" [style.borderColor]="marcarComo() === 'tarde' ? '#f59e0b' : '#10b981'">
            <img *ngIf="qrDataUrl()" [src]="qrDataUrl()" alt="Código QR de asistencia" class="block h-auto w-[min(70vh,82vw)] max-w-[560px]" />
          </div>
          <!-- Cuenta regresiva hasta el siguiente código -->
          <div class="mt-4 h-1.5 w-[min(70vh,82vw)] max-w-[560px] overflow-hidden rounded-full bg-slate-100">
            <div class="h-full rounded-full transition-[width] duration-200 ease-linear" [style.width.%]="progreso()"
                 [style.backgroundColor]="marcarComo() === 'tarde' ? '#f59e0b' : '#10b981'"></div>
          </div>
          <p class="mt-2 text-xs text-slate-500">El código cambia cada {{ segundosVentana }} segundos. También pueden escanearlo desde la app: <b>Inicio → Escanear QR</b>.</p>
        </div>

        <!-- Panel lateral -->
        <div class="flex flex-col gap-4">
          <div class="rounded-2xl bg-slate-50 p-4 text-center">
            <p class="text-4xl font-extrabold">{{ marcas().length }}<span class="text-xl font-bold text-slate-400"> / {{ estudiantes.length }}</span></p>
            <p class="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">estudiantes han marcado</p>
          </div>

          <div class="rounded-2xl border border-slate-200 p-4">
            <p class="text-xs font-semibold text-slate-600">Los que escaneen desde ahora quedan como:</p>
            <div class="mt-2 grid grid-cols-2 gap-1.5">
              <button type="button" (click)="cambiarMarcarComo('presente')" class="rounded-lg py-2 text-sm font-semibold transition-colors"
                      [style.backgroundColor]="marcarComo() === 'presente' ? '#10b981' : '#f1f5f9'" [style.color]="marcarComo() === 'presente' ? '#fff' : '#475569'">Presente</button>
              <button type="button" (click)="cambiarMarcarComo('tarde')" class="rounded-lg py-2 text-sm font-semibold transition-colors"
                      [style.backgroundColor]="marcarComo() === 'tarde' ? '#f59e0b' : '#f1f5f9'" [style.color]="marcarComo() === 'tarde' ? '#fff' : '#475569'">Tarde</button>
            </div>
          </div>

          <div class="min-h-0 flex-1 rounded-2xl border border-slate-200 p-4">
            <p class="text-xs font-semibold text-slate-600">Ya marcaron</p>
            <p *ngIf="marcas().length === 0" class="mt-3 text-sm text-slate-400">Aún nadie. Los nombres aparecen aquí al instante.</p>
            <ul class="mt-2 max-h-[40vh] space-y-1.5 overflow-y-auto">
              <li *ngFor="let m of marcasRecientes()" class="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-sm">
                <span class="min-w-0 truncate font-medium">{{ nombre(m.estudiante_id) }}</span>
                <span class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase text-white" [style.backgroundColor]="m.estado === 'tarde' ? '#f59e0b' : '#10b981'">{{ m.estado }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class QrAsistenciaComponent implements OnInit, OnDestroy {
  @Input({ required: true }) asignaturaId!: string;
  @Input() nombreAsignatura = '';
  @Input({ required: true }) fecha!: string;
  @Input({ required: true }) horaInicio!: string;
  @Input({ required: true }) horaFin!: string;
  @Input() estudiantes: EstudianteQr[] = [];
  /** Al terminar: marcas de los estudiantes que escanearon. */
  @Output() terminado = new EventEmitter<MarcaQr[]>();
  @Output() cerrado = new EventEmitter<void>();

  @ViewChild('contenedor') contenedor?: ElementRef<HTMLElement>;

  readonly segundosVentana = QR_VENTANA_MS / 1000;
  cargando = signal(true);
  terminando = signal(false);
  qrDataUrl = signal<string | null>(null);
  progreso = signal(100);
  marcas = signal<MarcaQr[]>([]);
  marcarComo = signal<'presente' | 'tarde'>('presente');

  private sesion: SesionQr | null = null;
  private tokenMostrado = '';
  private timerQr: ReturnType<typeof setInterval> | null = null;
  private timerMarcas: ReturnType<typeof setInterval> | null = null;

  constructor(private qrService: AsistenciaQrService, private toast: ToastService) {}

  async ngOnInit() {
    try {
      this.sesion = await this.qrService.iniciarSesion(this.asignaturaId, this.fecha, this.horaInicio, this.horaFin);
      this.marcarComo.set(this.sesion.marcar_como);
      await Promise.all([this.actualizarQr(), this.actualizarMarcas()]);
      this.timerQr = setInterval(() => this.actualizarQr(), 250);
      this.timerMarcas = setInterval(() => this.actualizarMarcas(), 3000);
    } catch (e: any) {
      console.error('Error iniciando la sesión QR:', e);
      this.toast.error(e.message || 'No se pudo iniciar el QR de asistencia');
      this.cerrado.emit();
    } finally {
      this.cargando.set(false);
    }
  }

  ngOnDestroy() {
    if (this.timerQr) clearInterval(this.timerQr);
    if (this.timerMarcas) clearInterval(this.timerMarcas);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }

  private async actualizarQr() {
    if (!this.sesion) return;
    const { token, restanteMs } = await this.qrService.tokenActual(this.sesion);
    this.progreso.set((restanteMs / QR_VENTANA_MS) * 100);
    if (token === this.tokenMostrado) return;
    this.tokenMostrado = token;
    const url = this.qrService.urlMarcar(this.sesion.id, token);
    this.qrDataUrl.set(await QRCode.toDataURL(url, { width: 720, margin: 1, errorCorrectionLevel: 'M' }));
  }

  private async actualizarMarcas() {
    if (!this.sesion) return;
    try {
      this.marcas.set(await this.qrService.listarMarcas(this.sesion.id));
    } catch {
      // Se reintenta en el siguiente ciclo.
    }
  }

  marcasRecientes(): MarcaQr[] {
    return [...this.marcas()].reverse();
  }

  nombre(estudianteId: string): string {
    const e = this.estudiantes.find((x) => x.estudiante_id === estudianteId);
    return e ? `${e.nombres} ${e.apellidos}` : 'Estudiante';
  }

  async cambiarMarcarComo(valor: 'presente' | 'tarde') {
    if (!this.sesion || this.marcarComo() === valor) return;
    const anterior = this.marcarComo();
    this.marcarComo.set(valor);
    try {
      await this.qrService.cambiarMarcarComo(this.sesion.id, valor);
    } catch {
      this.marcarComo.set(anterior);
      this.toast.error('No se pudo cambiar');
    }
  }

  pantallaCompleta() {
    this.contenedor?.nativeElement.requestFullscreen?.().catch(() => {});
  }

  /** Cierra la sesión (nadie más puede marcar) y entrega las marcas a la lista. */
  async terminar() {
    if (!this.sesion) return;
    this.terminando.set(true);
    try {
      await this.actualizarMarcas();
      await this.qrService.cerrarSesion(this.sesion.id);
      this.terminado.emit(this.marcas());
    } catch (e: any) {
      this.toast.error(e.message || 'No se pudo terminar la sesión QR');
    } finally {
      this.terminando.set(false);
    }
  }

  /** Cierra la pantalla sin aplicar: la sesión sigue abierta y se retoma al volver a abrirla. */
  cancelar() {
    this.cerrado.emit();
  }
}
