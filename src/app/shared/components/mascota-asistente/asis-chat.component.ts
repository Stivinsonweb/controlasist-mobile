import { AfterViewChecked, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';
import { ANIMALES_ASIS, AnimalAsis, AsisPreferenciasService, SONIDOS_ASIS, SonidoAsis } from '../../../core/services/asis-preferencias.service';
import { AsisAnimalComponent } from './asis-animal.component';

interface Propuesta {
  accion: string;
  titulo: string;
  resumen: [string, string][];
}

interface MensajeAsis {
  id?: string;
  rol: 'user' | 'assistant';
  contenido: string;
  propuesta?: Propuesta | null;
  propuesta_estado?: 'pendiente' | 'confirmada' | 'cancelada' | null;
  created_at?: string;
  /** Mensaje local (no guardado), p. ej. un error de conexión. */
  local?: boolean;
}

interface Conversacion {
  id: string;
  titulo: string;
  updated_at: string;
}

type Vista = 'chat' | 'historial' | 'personalizar';

const SUGERENCIAS = {
  docente: ['¿Qué clases tengo hoy?', '¿Quién está en riesgo por fallas?', 'Dame el reporte de asistencia de una asignatura', 'Crea una asignatura nueva'],
  estudiante: ['¿Cuántas faltas tengo?', '¿Cuál es mi horario?', '¿Qué actividades tengo pendientes?', '¿Cómo marco asistencia con el QR?'],
};

/** Si la última conversación se usó hace menos de esto, al abrir el chat se retoma. */
const RETOMAR_HORAS = 12;

/**
 * Chat de Asis: conversa con la Edge Function `asistente-chat`, guarda el historial en la base
 * (asistente_conversaciones / asistente_mensajes) y muestra las propuestas de cambios con
 * Confirmar / Cancelar. El historial se puede ver y cualquier conversación se puede retomar.
 * En `pagina` (ruta /asistente) el historial queda siempre visible a la izquierda.
 * Desde "Personalizar" se cambia el animal de la mascota y su sonido.
 */
@Component({
  selector: 'app-asis-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, AsisAnimalComponent],
  template: `
    <div class="chat" [class.pagina]="pagina">
      <!-- Cabecera -->
      <div class="cabecera">
        <ng-content select="[avatar]"></ng-content>
        <div class="min-w-0 flex-1">
          <p class="titulo">Asis · tu asistente</p>
          <p class="sub">{{ vista() === 'historial' ? 'Tus conversaciones' : vista() === 'personalizar' ? 'Personaliza a tu asistente' : (usoTexto() || 'Pregúntame lo que necesites') }}</p>
        </div>
        <button type="button" class="icono" [class.solo-movil]="pagina" (click)="cambiarVista(vista() === 'historial' ? 'chat' : 'historial')"
                [attr.aria-label]="vista() === 'historial' ? 'Volver al chat' : 'Ver historial'" [title]="vista() === 'historial' ? 'Volver al chat' : 'Historial'">
          <svg *ngIf="vista() !== 'historial'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/></svg>
          <svg *ngIf="vista() === 'historial'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <button type="button" class="icono" (click)="cambiarVista(vista() === 'personalizar' ? 'chat' : 'personalizar')" aria-label="Personalizar a Asis" title="Personalizar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r="1.5"/><circle cx="17.5" cy="10.5" r="1.5"/><circle cx="8.5" cy="7.5" r="1.5"/><circle cx="6.5" cy="12.5" r="1.5"/><path d="M12 2a10 10 0 0 0 0 20c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.4A5.6 5.6 0 0 0 22 9.8C22 5.5 17.5 2 12 2z"/></svg>
        </button>
        <button type="button" class="icono" (click)="nueva()" aria-label="Nueva conversación" title="Nueva conversación">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
        </button>
        <button *ngIf="!pagina" type="button" class="icono" (click)="cerrar.emit()" aria-label="Cerrar" title="Cerrar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
      </div>

      <div class="contenido">
        <!-- Historial fijo a la izquierda (solo en la página, pantallas medianas en adelante) -->
        <aside *ngIf="pagina" class="lateral">
          <p class="lateral-titulo">Tus conversaciones</p>
          <ng-container *ngTemplateOutlet="listaConversaciones"></ng-container>
        </aside>

        <section class="principal">
          <!-- Historial -->
          <div *ngIf="vista() === 'historial'" class="cuerpo">
            <ng-container *ngTemplateOutlet="listaConversaciones"></ng-container>
          </div>

          <!-- Personalizar -->
          <div *ngIf="vista() === 'personalizar'" class="cuerpo">
            <p class="seccion">Elige tu animal</p>
            <div class="animales">
              <button *ngFor="let a of animales" type="button" class="animal" [class.elegido]="animalElegido === a.valor" (click)="elegirAnimal(a.valor)">
                <app-asis-animal [animal]="a.valor" [tam]="56"></app-asis-animal>
                <span>{{ a.nombre }}</span>
              </button>
            </div>
            <p class="seccion">Sonido</p>
            <div class="sonidos">
              <div *ngFor="let s of sonidos" class="sonido" [class.elegido]="sonidoElegido === s.valor">
                <button type="button" class="sonido-elegir" (click)="sonidoElegido = s.valor; probar(s.valor)">
                  <span class="radio"></span>{{ s.nombre }}
                </button>
                <button *ngIf="s.valor !== 'ninguno'" type="button" class="sonido-probar" (click)="probar(s.valor)" aria-label="Escuchar" title="Escuchar">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                </button>
              </div>
            </div>
            <button type="button" class="guardar" [disabled]="guardandoPrefs()" (click)="guardarPreferencias()">{{ guardandoPrefs() ? 'Guardando…' : 'Guardar' }}</button>
          </div>

          <!-- Conversación -->
          <div *ngIf="vista() === 'chat'" class="cuerpo" #cuerpo>
            <div *ngIf="cargandoMensajes()" class="vacio">Cargando conversación…</div>

            <div *ngIf="!cargandoMensajes() && mensajes().length === 0" class="bienvenida">
              <app-asis-animal [animal]="prefs.animal()" [tam]="72"></app-asis-animal>
              <p class="hola">¡Hola{{ primerNombre ? ', ' + primerNombre : '' }}!</p>
              <p class="texto-bienvenida">{{ rol === 'docente'
                ? 'Puedo consultar tus clases, reportes y estudiantes en riesgo, y crear o editar asignaturas, horarios y actividades (siempre te pido confirmación).'
                : 'Puedo decirte tus faltas, tu horario y tus actividades pendientes, y explicarte cómo usar la app.' }}</p>
              <div class="sugerencias">
                <button *ngFor="let s of sugerencias" type="button" class="sugerencia" (click)="enviar(s)">{{ s }}</button>
              </div>
            </div>

            <ng-container *ngFor="let m of mensajes()">
              <div class="burbuja" [class.usuario]="m.rol === 'user'" [class.error]="m.local">
                <div [innerHTML]="formatear(m.contenido)"></div>
              </div>
              <div *ngIf="m.propuesta" class="propuesta" [class.cerrada]="m.propuesta_estado !== 'pendiente'">
                <p class="propuesta-titulo">{{ m.propuesta.titulo }}</p>
                <dl>
                  <ng-container *ngFor="let fila of m.propuesta.resumen">
                    <dt>{{ fila[0] }}</dt><dd>{{ fila[1] }}</dd>
                  </ng-container>
                </dl>
                <div *ngIf="m.propuesta_estado === 'pendiente'" class="propuesta-botones">
                  <button type="button" class="btn-cancelar" [disabled]="procesando() === m.id" (click)="responderPropuesta(m, 'cancelar')">Cancelar</button>
                  <button type="button" class="btn-confirmar" [disabled]="procesando() === m.id" (click)="responderPropuesta(m, 'confirmar')">{{ procesando() === m.id ? 'Haciendo…' : 'Confirmar' }}</button>
                </div>
                <p *ngIf="m.propuesta_estado === 'confirmada'" class="estado ok">✓ Confirmado</p>
                <p *ngIf="m.propuesta_estado === 'cancelada'" class="estado">Cancelado</p>
              </div>
            </ng-container>

            <div *ngIf="enviando()" class="burbuja escribiendo"><span></span><span></span><span></span></div>
          </div>

          <!-- Escribir -->
          <form *ngIf="vista() === 'chat'" class="pie" (ngSubmit)="enviar()">
            <textarea [(ngModel)]="texto" name="texto" rows="1" maxlength="2000" placeholder="Escribe tu pregunta…" [disabled]="enviando()"
                      (keydown.enter)="enterEnviar($event)"></textarea>
            <button type="submit" class="enviar" [disabled]="enviando() || !texto.trim()" aria-label="Enviar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/></svg>
            </button>
          </form>
        </section>
      </div>
    </div>

    <ng-template #listaConversaciones>
      <p *ngIf="cargandoLista() && conversaciones().length === 0" class="vacio">Cargando…</p>
      <p *ngIf="!cargandoLista() && conversaciones().length === 0" class="vacio">Aún no tienes conversaciones con Asis.</p>
      <ul class="lista">
        <li *ngFor="let c of conversaciones()" class="item" [class.activa]="c.id === conversacionId()">
          <button type="button" class="item-abrir" (click)="abrirConversacion(c)">
            <span class="item-titulo">{{ c.titulo }}</span>
            <span class="item-fecha">{{ fechaCorta(c.updated_at) }}</span>
          </button>
          <button type="button" class="item-borrar" (click)="borrar(c)" aria-label="Borrar conversación" title="Borrar">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
          </button>
        </li>
      </ul>
    </ng-template>
  `,
  styles: [
    `
      .chat { display: flex; flex-direction: column; height: min(580px, calc(100vh - 150px)); }
      .chat.pagina { height: calc(100vh - 190px); min-height: 460px; border-radius: 22px; overflow: hidden; box-shadow: 0 0 0 1px var(--border-subtle, #E2E8F0); }
      .cabecera { display: flex; align-items: center; gap: 8px; padding: 12px 10px 12px 14px; background: linear-gradient(135deg, #10B981, #0D9488); color: #FFFFFF; flex-shrink: 0; }
      .titulo { margin: 0; font-size: 15px; font-weight: 800; }
      .sub { margin: 0; font-size: 12px; opacity: .85; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .icono { border: 0; background: rgba(255, 255, 255, .18); color: #FFFFFF; width: 32px; height: 32px; border-radius: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
      .icono:hover { background: rgba(255, 255, 255, .28); }
      .contenido { flex: 1; display: flex; min-height: 0; }
      .principal { flex: 1; min-width: 0; display: flex; flex-direction: column; }
      .lateral { width: 280px; flex-shrink: 0; overflow-y: auto; padding: 12px; background: #FFFFFF; border-right: 1px solid #E2E8F0; }
      .lateral-titulo { margin: 0 0 8px; font-size: 12px; font-weight: 800; letter-spacing: .4px; text-transform: uppercase; color: #64748B; }
      @media (max-width: 767px) { .lateral { display: none; } }
      @media (min-width: 768px) { .pagina .solo-movil { display: none; } }

      .cuerpo { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 8px; background: #F8FAFC; }
      .vacio { margin: auto; color: #94A3B8; font-size: 13px; text-align: center; }

      .bienvenida { margin: auto 0; text-align: center; padding: 6px; display: flex; flex-direction: column; align-items: center; }
      .hola { margin: 6px 0 0; font-size: 18px; font-weight: 800; color: #0F172A; }
      .texto-bienvenida { margin: 6px 0 0; font-size: 13px; line-height: 1.45; color: #475569; max-width: 420px; }
      .sugerencias { margin-top: 12px; display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; }
      .sugerencia { border: 0; padding: 7px 11px; border-radius: 999px; background: #E2F7EF; color: #047857; font-size: 12px; font-weight: 700; cursor: pointer; }
      .sugerencia:hover { background: #CDEFE2; }

      .burbuja { max-width: 86%; padding: 9px 12px; border-radius: 16px 16px 16px 4px; background: #FFFFFF; color: #0F172A; font-size: 13.5px; line-height: 1.45; box-shadow: 0 1px 2px rgba(15, 23, 42, .08); align-self: flex-start; word-wrap: break-word; }
      .pagina .burbuja { max-width: 72%; }
      .burbuja.usuario { align-self: flex-end; border-radius: 16px 16px 4px 16px; background: #0D9488; color: #FFFFFF; }
      .burbuja.error { background: #FEF2F2; color: #B91C1C; }
      .burbuja :is(ul, ol) { margin: 4px 0; padding-left: 18px; }
      .burbuja li { margin: 2px 0; }
      .escribiendo { display: flex; gap: 4px; padding: 12px 14px; }
      .escribiendo span { width: 7px; height: 7px; border-radius: 50%; background: #94A3B8; animation: punto 1.2s infinite ease-in-out; }
      .escribiendo span:nth-child(2) { animation-delay: .15s; }
      .escribiendo span:nth-child(3) { animation-delay: .3s; }
      @keyframes punto { 0%, 80%, 100% { opacity: .3; transform: translateY(0); } 40% { opacity: 1; transform: translateY(-3px); } }

      .propuesta { align-self: flex-start; width: 86%; max-width: 460px; border-radius: 16px; background: #FFFFFF; box-shadow: inset 0 0 0 2px #10B981, 0 4px 14px rgba(16, 185, 129, .15); padding: 12px; }
      .propuesta.cerrada { box-shadow: inset 0 0 0 1px #E2E8F0; opacity: .85; }
      .propuesta-titulo { margin: 0 0 6px; font-size: 14px; font-weight: 800; color: #047857; }
      .propuesta dl { margin: 0; display: grid; grid-template-columns: auto 1fr; gap: 3px 10px; font-size: 12.5px; }
      .propuesta dt { color: #64748B; }
      .propuesta dd { margin: 0; color: #0F172A; font-weight: 600; word-break: break-word; }
      .propuesta-botones { margin-top: 10px; display: flex; gap: 8px; }
      .propuesta-botones button { flex: 1; border: 0; padding: 9px; border-radius: 11px; font-size: 13px; font-weight: 700; cursor: pointer; }
      .propuesta-botones button:disabled { opacity: .6; cursor: default; }
      .btn-confirmar { background: #047857; color: #FFFFFF; }
      .btn-cancelar { background: #F1F5F9; color: #334155; }
      .estado { margin: 8px 0 0; font-size: 12px; font-weight: 700; color: #64748B; }
      .estado.ok { color: #047857; }

      .lista { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
      .item { display: flex; align-items: center; border-radius: 12px; background: #FFFFFF; box-shadow: 0 1px 2px rgba(15, 23, 42, .08); }
      .lateral .item { box-shadow: inset 0 0 0 1px #E2E8F0; }
      .item.activa { box-shadow: inset 0 0 0 2px #10B981; }
      .item-abrir { flex: 1; min-width: 0; border: 0; background: transparent; padding: 10px 12px; text-align: left; cursor: pointer; display: flex; flex-direction: column; gap: 2px; }
      .item-titulo { font-size: 13px; font-weight: 700; color: #0F172A; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .item-fecha { font-size: 11px; color: #94A3B8; }
      .item-borrar { border: 0; background: transparent; color: #94A3B8; padding: 10px; cursor: pointer; }
      .item-borrar:hover { color: #DC2626; }

      .seccion { margin: 4px 0 0; font-size: 12px; font-weight: 800; letter-spacing: .4px; text-transform: uppercase; color: #64748B; }
      .animales { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
      .animal { border: 0; border-radius: 14px; background: #FFFFFF; padding: 8px 4px; display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 12px; font-weight: 700; color: #334155; cursor: pointer; box-shadow: inset 0 0 0 1px #E2E8F0; }
      .animal.elegido { box-shadow: inset 0 0 0 2px #10B981; background: #ECFDF5; color: #047857; }
      .sonidos { display: flex; flex-direction: column; gap: 6px; }
      .sonido { display: flex; align-items: center; border-radius: 12px; background: #FFFFFF; box-shadow: inset 0 0 0 1px #E2E8F0; }
      .sonido.elegido { box-shadow: inset 0 0 0 2px #10B981; background: #ECFDF5; }
      .sonido-elegir { flex: 1; border: 0; background: transparent; padding: 10px 12px; display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 600; color: #0F172A; cursor: pointer; text-align: left; }
      .radio { width: 16px; height: 16px; border-radius: 50%; box-shadow: inset 0 0 0 2px #CBD5E1; flex-shrink: 0; }
      .sonido.elegido .radio { box-shadow: inset 0 0 0 5px #10B981; }
      .sonido-probar { border: 0; background: transparent; color: #047857; padding: 10px 12px; cursor: pointer; }
      .guardar { margin-top: 6px; border: 0; padding: 11px; border-radius: 12px; background: #047857; color: #FFFFFF; font-size: 14px; font-weight: 700; cursor: pointer; }
      .guardar:disabled { opacity: .6; }

      .pie { display: flex; align-items: flex-end; gap: 8px; padding: 10px; border-top: 1px solid #E2E8F0; background: #FFFFFF; flex-shrink: 0; }
      .pie textarea { flex: 1; resize: none; max-height: 96px; min-height: 40px; border: 0; border-radius: 12px; padding: 10px 12px; background: #F1F5F9; color: #0F172A; font: inherit; font-size: 13.5px; outline: none; }
      .pie textarea:focus { box-shadow: inset 0 0 0 2px #10B981; }
      .enviar { width: 40px; height: 40px; border: 0; border-radius: 12px; background: #047857; color: #FFFFFF; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
      .enviar:disabled { opacity: .45; cursor: default; }
    `,
  ],
})
export class AsisChatComponent implements OnInit, AfterViewChecked {
  @Input() rol: 'docente' | 'estudiante' | null | undefined = null;
  @Input() nombre: string | null | undefined = null;
  /** Página completa (/asistente): historial fijo a la izquierda y sin botón de cerrar. */
  @Input() pagina = false;
  @Output() cerrar = new EventEmitter<void>();
  @ViewChild('cuerpo') cuerpo?: ElementRef<HTMLElement>;

  vista = signal<Vista>('chat');
  conversaciones = signal<Conversacion[]>([]);
  conversacionId = signal<string | null>(null);
  mensajes = signal<MensajeAsis[]>([]);
  cargandoLista = signal(false);
  cargandoMensajes = signal(false);
  enviando = signal(false);
  procesando = signal<string | null>(null);
  guardandoPrefs = signal(false);
  usoTexto = signal('');
  texto = '';
  animales = ANIMALES_ASIS;
  sonidos = SONIDOS_ASIS;
  animalElegido: AnimalAsis = 'buho';
  sonidoElegido: SonidoAsis = 'buho';
  private bajarScroll = false;

  constructor(private supabaseService: SupabaseService, public prefs: AsisPreferenciasService) {}

  private get sb() {
    return this.supabaseService.client;
  }

  get primerNombre() {
    const n = (this.nombre || '').trim().split(/\s+/)[0];
    return n ? n.charAt(0).toUpperCase() + n.slice(1).toLowerCase() : '';
  }

  get sugerencias() {
    return SUGERENCIAS[this.rol === 'docente' ? 'docente' : 'estudiante'];
  }

  async ngOnInit() {
    this.prefs.cargar().catch(() => {});
    await this.cargarConversaciones();
    const ultima = this.conversaciones()[0];
    if (ultima && Date.now() - new Date(ultima.updated_at).getTime() < RETOMAR_HORAS * 3600_000) {
      await this.abrirConversacion(ultima);
    }
  }

  ngAfterViewChecked() {
    if (this.bajarScroll && this.cuerpo) {
      this.cuerpo.nativeElement.scrollTop = this.cuerpo.nativeElement.scrollHeight;
      this.bajarScroll = false;
    }
  }

  private async cargarConversaciones() {
    this.cargandoLista.set(true);
    const { data } = await this.sb.from('asistente_conversaciones').select('id, titulo, updated_at').order('updated_at', { ascending: false }).limit(60);
    this.conversaciones.set((data || []) as Conversacion[]);
    this.cargandoLista.set(false);
  }

  cambiarVista(v: Vista) {
    if (v === 'historial') this.cargarConversaciones();
    if (v === 'personalizar') {
      this.animalElegido = this.prefs.animal();
      this.sonidoElegido = this.prefs.sonido();
    }
    this.vista.set(v);
    if (v === 'chat') this.bajarScroll = true;
  }

  async abrirConversacion(c: Conversacion) {
    this.vista.set('chat');
    this.conversacionId.set(c.id);
    this.cargandoMensajes.set(true);
    const { data } = await this.sb
      .from('asistente_mensajes')
      .select('id, rol, contenido, propuesta, propuesta_estado, created_at')
      .eq('conversacion_id', c.id)
      .order('created_at', { ascending: true });
    this.mensajes.set((data || []) as MensajeAsis[]);
    this.cargandoMensajes.set(false);
    this.bajarScroll = true;
  }

  nueva() {
    this.vista.set('chat');
    this.conversacionId.set(null);
    this.mensajes.set([]);
    this.texto = '';
  }

  async borrar(c: Conversacion) {
    if (!confirm(`¿Borrar la conversación "${c.titulo}"?`)) return;
    await this.sb.from('asistente_conversaciones').delete().eq('id', c.id);
    this.conversaciones.update((l) => l.filter((x) => x.id !== c.id));
    if (this.conversacionId() === c.id) this.nueva();
    if (!this.pagina) this.vista.set('historial');
  }

  // ===== Personalizar =====
  elegirAnimal(a: AnimalAsis) {
    // Al cambiar de animal se propone su sonido; el usuario puede elegir otro.
    if (this.sonidoElegido === this.animalElegido) this.sonidoElegido = a;
    this.animalElegido = a;
    this.probar(this.sonidoElegido);
  }

  probar(s: SonidoAsis) {
    this.prefs.reproducir(s);
  }

  async guardarPreferencias() {
    this.guardandoPrefs.set(true);
    try {
      await this.prefs.guardar(this.animalElegido, this.sonidoElegido);
      this.cambiarVista('chat');
    } catch {
      alert('No se pudo guardar. Intenta de nuevo.');
    } finally {
      this.guardandoPrefs.set(false);
    }
  }

  // ===== Conversación =====
  enterEnviar(e: Event) {
    const k = e as KeyboardEvent;
    if (k.shiftKey) return; // Shift+Enter = salto de línea
    k.preventDefault();
    this.enviar();
  }

  /** Llama a la Edge Function y devuelve su cuerpo; si responde con error, lanza su mensaje. */
  private async llamar(body: Record<string, unknown>): Promise<any> {
    const { data, error } = await this.sb.functions.invoke('asistente-chat', { body });
    if (error) {
      let mensaje = 'No pude conectarme con Asis. Revisa tu conexión e intenta de nuevo.';
      try {
        const detalle = await (error as any).context?.json?.();
        if (detalle?.error) mensaje = detalle.error;
      } catch {}
      throw new Error(mensaje);
    }
    return data;
  }

  async enviar(textoSugerido?: string) {
    const pregunta = (textoSugerido ?? this.texto).trim();
    if (!pregunta || this.enviando()) return;
    this.texto = '';
    const temporal: MensajeAsis = { rol: 'user', contenido: pregunta };
    this.mensajes.update((l) => [...l, temporal]);
    this.enviando.set(true);
    this.bajarScroll = true;
    try {
      const r = await this.llamar({ texto: pregunta, conversacion_id: this.conversacionId() });
      const nuevaConversacion = !this.conversacionId();
      this.conversacionId.set(r.conversacion_id);
      this.mensajes.update((l) => [...l.filter((m) => m !== temporal), r.mensaje_usuario, r.mensaje]);
      // Modo respaldo: se agotó el cupo (del usuario o del modelo principal) y responde otro modelo.
      if (r.respaldo) this.usoTexto.set('Modo respaldo · sigo respondiéndote');
      else if (r.uso?.limite) this.usoTexto.set(`${Math.max(0, r.uso.limite - r.uso.usadas)} preguntas disponibles hoy`);
      this.prefs.reproducir();
      if (nuevaConversacion) this.cargarConversaciones();
      else this.conversaciones.update((l) => {
        const c = l.find((x) => x.id === r.conversacion_id);
        return c ? [{ ...c, updated_at: new Date().toISOString() }, ...l.filter((x) => x !== c)] : l;
      });
    } catch (e: any) {
      this.mensajes.update((l) => [...l, { rol: 'assistant', contenido: e.message, local: true }]);
    } finally {
      this.enviando.set(false);
      this.bajarScroll = true;
    }
  }

  async responderPropuesta(m: MensajeAsis, accion: 'confirmar' | 'cancelar') {
    if (!m.id || this.procesando()) return;
    this.procesando.set(m.id);
    try {
      const r = await this.llamar({ accion, mensaje_id: m.id });
      this.mensajes.update((l) => [...l.map((x) => (x.id === m.id ? { ...x, propuesta_estado: accion === 'confirmar' ? 'confirmada' : 'cancelada' } as MensajeAsis : x)), r.mensaje]);
      this.prefs.reproducir();
    } catch (e: any) {
      this.mensajes.update((l) => [...l, { rol: 'assistant', contenido: e.message, local: true }]);
    } finally {
      this.procesando.set(null);
      this.bajarScroll = true;
    }
  }

  fechaCorta(iso: string) {
    const d = new Date(iso);
    const hoy = new Date();
    if (d.toDateString() === hoy.toDateString()) return 'Hoy, ' + d.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' });
    return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: d.getFullYear() !== hoy.getFullYear() ? 'numeric' : undefined });
  }

  /** Texto seguro con **negrita**, listas con "- " o "1." y saltos de línea. */
  formatear(texto: string): string {
    const escapar = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const negrita = (s: string) => s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
    const lineas = escapar(texto).split('\n');
    let html = '';
    let lista: 'ul' | 'ol' | null = null;
    for (const linea of lineas) {
      const vineta = linea.match(/^\s*[-•*]\s+(.*)$/);
      const numero = linea.match(/^\s*\d+[.)]\s+(.*)$/);
      const tipo = vineta ? 'ul' : numero ? 'ol' : null;
      if (lista && tipo !== lista) { html += `</${lista}>`; lista = null; }
      if (tipo) {
        if (!lista) { html += `<${tipo}>`; lista = tipo; }
        html += `<li>${negrita((vineta || numero)![1])}</li>`;
      } else if (linea.trim()) {
        html += `${negrita(linea)}<br>`;
      }
    }
    if (lista) html += `</${lista}>`;
    return html.replace(/<br>$/, '');
  }
}
