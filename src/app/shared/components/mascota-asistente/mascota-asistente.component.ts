import { Component, Input, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AsisChatComponent } from './asis-chat.component';
import { AsisAnimalComponent } from './asis-animal.component';
import { AsisPreferenciasService } from '../../../core/services/asis-preferencias.service';

/**
 * "Asis", la mascota del asistente inteligente (chatbot). Flota abajo a la derecha, parpadea,
 * mira alrededor y saluda con el ala. El animal y su sonido se personalizan (AsisPreferenciasService). En los paneles de docente y estudiante (`chat`) abre el chat
 * real (AsisChatComponent, con historial); en el login invita a iniciar sesión.
 * Respeta "reducir movimiento" del sistema.
 */
@Component({
  selector: 'app-mascota-asistente',
  standalone: true,
  imports: [CommonModule, RouterLink, AsisChatComponent, AsisAnimalComponent],
  template: `
    <div class="mascota-raiz" [class.abierta]="abierto()">
      <!-- Chat de Asis (con sesión iniciada) -->
      <div *ngIf="abierto() && chat && !bloqueado" class="panel" role="dialog" aria-label="Asis, asistente inteligente de ControlAsist">
        <app-asis-chat [rol]="rol" [nombre]="nombre" (cerrar)="cerrar()">
          <div avatar class="panel-avatar"><ng-container *ngTemplateOutlet="buho; context: { tam: 40 }"></ng-container></div>
        </app-asis-chat>
      </div>

      <!-- Docente sin Premium: Asis es parte de Premium -->
      <div *ngIf="abierto() && chat && bloqueado" class="panel" role="dialog" aria-label="Asis es parte de Premium">
        <div class="panel-cabecera">
          <div class="panel-avatar">
            <ng-container *ngTemplateOutlet="buho; context: { tam: 40 }"></ng-container>
          </div>
          <div class="min-w-0 flex-1">
            <p class="panel-titulo">Asis · tu asistente</p>
            <p class="panel-sub">Incluido en Premium</p>
          </div>
          <button type="button" (click)="cerrar()" class="panel-cerrar" aria-label="Cerrar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>
        <div class="panel-cuerpo">
          <div class="candado">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.5" r="1.3" fill="currentColor"/></svg>
          </div>
          <p class="pronto">Asis es Premium</p>
          <p class="descripcion">
            Con Premium te digo quién está en riesgo, te leo los reportes y creo asignaturas,
            horarios y actividades por ti. Si nunca lo has usado, pruébalo gratis por 1 mes.
          </p>
        </div>
        <div class="panel-pie">
          <a routerLink="/premium" (click)="cerrar()" class="boton-premium">Activar Premium</a>
        </div>
      </div>

      <!-- Sin sesión (login): invita a entrar -->
      <div *ngIf="abierto() && !chat" class="panel" role="dialog" aria-label="Asistente inteligente de ControlAsist">
        <div class="panel-cabecera">
          <div class="panel-avatar">
            <ng-container *ngTemplateOutlet="buho; context: { tam: 40 }"></ng-container>
          </div>
          <div class="min-w-0 flex-1">
            <p class="panel-titulo">Asis · tu asistente</p>
            <p class="panel-sub">Chatbot inteligente de ControlAsist</p>
          </div>
          <button type="button" (click)="cerrar()" class="panel-cerrar" aria-label="Cerrar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>

        <div class="panel-cuerpo">
          <div class="candado">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.5" r="1.3" fill="currentColor"/></svg>
          </div>
          <p class="pronto">Inicia sesión</p>
          <p class="descripcion">
            Entra con tu cuenta y pregúntame cómo tomar asistencia, cuántas faltas llevas,
            qué actividades tienes pendientes y mucho más.
          </p>
          <div class="burbujas">
            <span class="burbuja">¿Cuántas faltas tengo?</span>
            <span class="burbuja">¿Cómo uso el QR?</span>
            <span class="burbuja">¿Qué tengo pendiente?</span>
          </div>
        </div>

        <div class="panel-pie">
          <div class="entrada-bloqueada" aria-disabled="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></svg>
            <span>Inicia sesión para escribirme</span>
          </div>
        </div>
      </div>

      <!-- Saludo -->
      <div *ngIf="saludo() && !abierto()" class="saludo" (click)="abrir()">
        <ng-container *ngIf="primerNombre as n; else sinNombre">¡Hola{{ deNuevo ? ' de nuevo' : '' }}, <b>{{ n }}</b>! Soy Asis 👋</ng-container>
        <ng-template #sinNombre>¡Hola! Soy <b>Asis</b> 👋</ng-template>
        <br><span>{{ mensaje }}</span>
        <button type="button" class="saludo-cerrar" (click)="$event.stopPropagation(); saludo.set(false)" aria-label="Ocultar saludo">×</button>
      </div>

      <!-- Mascota -->
      <button type="button" class="mascota" (click)="alternar()" [attr.aria-expanded]="abierto()" [attr.aria-label]="chat ? 'Abrir el chat de Asis' : 'Asis, asistente inteligente'">
        <span class="sombra"></span>
        <span class="cuerpo-flotante">
          <ng-container *ngTemplateOutlet="buho; context: { tam: 74 }"></ng-container>
          <span *ngIf="!chat || bloqueado" class="insignia" [title]="bloqueado ? 'Asis es parte de Premium' : 'Inicia sesión para hablar con Asis'">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></svg>
          </span>
        </span>
      </button>
    </div>

    <!-- Mascota (el animal que eligió el usuario) -->
    <ng-template #buho let-tam="tam">
      <app-asis-animal [animal]="prefs.animal()" [tam]="tam"></app-asis-animal>
    </ng-template>
  `,
  styles: [
    `
      :host { position: fixed; right: 16px; bottom: 16px; z-index: 45; }
      .mascota-raiz { position: relative; display: flex; flex-direction: column; align-items: flex-end; gap: 10px; }

      .mascota { position: relative; width: 84px; height: 92px; border: 0; padding: 0; background: transparent; cursor: pointer; display: flex; align-items: flex-end; justify-content: center; -webkit-tap-highlight-color: transparent; }
      .mascota:focus-visible { outline: 3px solid #34D399; outline-offset: 4px; border-radius: 24px; }
      .cuerpo-flotante { position: relative; display: block; animation: flotar 3.2s ease-in-out infinite; filter: drop-shadow(0 10px 18px rgba(13, 148, 136, .35)); }
      .mascota:hover .cuerpo-flotante { animation: flotar 3.2s ease-in-out infinite, rebote .6s ease; }
      .sombra { position: absolute; bottom: 2px; left: 50%; width: 46px; height: 8px; margin-left: -23px; border-radius: 50%; background: rgba(15, 23, 42, .28); animation: sombra 3.2s ease-in-out infinite; }
      .insignia { position: absolute; top: 2px; right: 0; width: 24px; height: 24px; border-radius: 999px; background: #1E293B; color: #FBBF24; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 0 2.5px #FFFFFF; }

      :host ::ng-deep .ala-der { transform-box: fill-box; transform-origin: 0% 0%; animation: saludar 6s ease-in-out infinite; }
      :host ::ng-deep .ala-izq { transform-box: fill-box; transform-origin: 100% 0%; animation: aletear 6s ease-in-out infinite; }
      :host ::ng-deep .pupilas { animation: mirar 8s ease-in-out infinite; }
      :host ::ng-deep .parpados { transform-box: fill-box; transform-origin: 50% 0%; transform: scaleY(0); animation: parpadear 4.6s infinite; }
      :host ::ng-deep .birrete { transform-box: fill-box; transform-origin: 50% 100%; animation: birrete 3.2s ease-in-out infinite; }

      @keyframes flotar { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-9px); } }
      @keyframes sombra { 0%, 100% { transform: scaleX(1); opacity: .9; } 50% { transform: scaleX(.75); opacity: .5; } }
      @keyframes rebote { 0% { transform: scale(1); } 40% { transform: scale(1.12, .92); } 70% { transform: scale(.95, 1.06); } 100% { transform: scale(1); } }
      @keyframes saludar { 0%, 62%, 100% { transform: rotate(0); } 68% { transform: rotate(-38deg); } 74% { transform: rotate(-12deg); } 80% { transform: rotate(-38deg); } 86% { transform: rotate(0); } }
      @keyframes aletear { 0%, 20%, 30%, 100% { transform: rotate(0); } 25% { transform: rotate(10deg); } }
      @keyframes mirar { 0%, 20%, 100% { transform: translateX(0); } 30%, 45% { transform: translateX(-3px); } 55%, 70% { transform: translateX(3px); } }
      @keyframes parpadear { 0%, 92%, 100% { transform: scaleY(0); } 95% { transform: scaleY(1); } }
      @keyframes birrete { 0%, 100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }

      .saludo { position: relative; max-width: 210px; padding: 10px 28px 10px 14px; border-radius: 16px 16px 4px 16px; background: #FFFFFF; color: #0F172A; font-size: 13px; line-height: 1.35; box-shadow: 0 12px 30px rgba(15, 23, 42, .25); cursor: pointer; animation: aparecer .4s ease both; }
      .saludo span { color: #475569; font-size: 12px; }
      .saludo-cerrar { position: absolute; top: 4px; right: 6px; border: 0; background: transparent; color: #94A3B8; font-size: 16px; line-height: 1; cursor: pointer; }

      .panel { width: min(340px, calc(100vw - 32px)); border-radius: 22px; background: #FFFFFF; color: #0F172A; box-shadow: 0 24px 60px rgba(15, 23, 42, .35); overflow: hidden; animation: aparecer .3s ease both; }
      .panel-cabecera { display: flex; align-items: center; gap: 10px; padding: 12px 12px 12px 14px; background: linear-gradient(135deg, #10B981, #0D9488); color: #FFFFFF; }
      .panel-avatar { width: 44px; height: 44px; border-radius: 14px; background: rgba(255, 255, 255, .2); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
      .panel-titulo { margin: 0; font-size: 15px; font-weight: 800; }
      .panel-sub { margin: 0; font-size: 12px; opacity: .85; }
      .panel-cerrar { border: 0; background: rgba(255, 255, 255, .18); color: #FFFFFF; width: 32px; height: 32px; border-radius: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
      .panel-cuerpo { padding: 20px 18px 14px; text-align: center; }
      .candado { width: 64px; height: 64px; margin: 0 auto; border-radius: 20px; background: #1E293B; color: #FBBF24; display: flex; align-items: center; justify-content: center; animation: candado 2.4s ease-in-out infinite; }
      .pronto { margin: 12px 0 0; font-size: 22px; font-weight: 800; letter-spacing: -.3px; background: linear-gradient(135deg, #10B981, #0D9488); -webkit-background-clip: text; background-clip: text; color: transparent; }
      .descripcion { margin: 6px 0 0; font-size: 13px; line-height: 1.45; color: #475569; }
      .burbujas { margin-top: 12px; display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; }
      .burbuja { padding: 6px 10px; border-radius: 999px; background: #F1F5F9; color: #94A3B8; font-size: 12px; font-weight: 600; }
      .panel-pie { padding: 0 14px 14px; }
      .boton-premium { display: block; padding: 11px 14px; border-radius: 14px; background: linear-gradient(135deg, #10B981, #0D9488); color: #FFFFFF; font-size: 14px; font-weight: 800; text-align: center; text-decoration: none; }
      .entrada-bloqueada { display: flex; align-items: center; gap: 8px; padding: 11px 14px; border-radius: 14px; background: #F8FAFC; box-shadow: inset 0 0 0 1.5px #E2E8F0; color: #94A3B8; font-size: 13px; cursor: not-allowed; }

      @keyframes aparecer { from { opacity: 0; transform: translateY(10px) scale(.97); } to { opacity: 1; transform: none; } }
      @keyframes candado { 0%, 100% { transform: rotate(0); } 10% { transform: rotate(-8deg); } 20% { transform: rotate(8deg); } 30% { transform: rotate(0); } }

      @media (max-width: 640px) {
        :host { right: 10px; bottom: 10px; }
        .mascota { width: 68px; height: 76px; }
        .cuerpo-flotante :is(svg, app-asis-animal) { width: 60px; height: 60px; }
        .cuerpo-flotante svg { width: 60px; height: 60px; }
      }
      @media (prefers-reduced-motion: reduce) {
        .cuerpo-flotante, .sombra, .candado, .saludo, .panel { animation: none !important; }
        :host ::ng-deep .ala-der, :host ::ng-deep .ala-izq, :host ::ng-deep .pupilas, :host ::ng-deep .parpados, :host ::ng-deep .birrete { animation: none !important; }
      }
    `,
  ],
})
export class MascotaAsistenteComponent implements OnInit, OnDestroy {
  /** true en los paneles (con sesión): el globo abre el chat real. En el login queda el aviso para iniciar sesión. */
  @Input() chat = false;
  /** Muestra el globo "¡Hola! Soy Asis" unos segundos al cargar. */
  @Input() saludar = true;
  /** Nombre de la persona para saludarla ("¡Hola, Ana!"). */
  @Input() nombre: string | null | undefined = null;
  /** En el login, a quien ya había entrado antes: "¡Hola de nuevo, Ana!". */
  @Input() deNuevo = false;
  @Input() rol: 'docente' | 'estudiante' | null | undefined = null;
  /** Docente sin Premium: Asis se muestra con candado e invita a activar Premium. */
  @Input() bloqueado = false;

  get primerNombre(): string | null {
    const n = (this.nombre || '').trim().split(/\s+/)[0];
    return n ? n.charAt(0).toUpperCase() + n.slice(1).toLowerCase() : null;
  }

  get mensaje(): string {
    if (!this.chat) return 'Inicia sesión y pregúntame lo que necesites.';
    if (this.bloqueado) return 'Soy parte de Premium: actívalo y te ayudo con tus clases.';
    if (this.rol === 'docente') return 'Tócame: te ayudo con tus clases, reportes y asignaturas.';
    return 'Tócame: te digo tus faltas, tu horario y tus pendientes.';
  }

  abierto = signal(false);
  saludo = signal(false);
  private temporizadores: ReturnType<typeof setTimeout>[] = [];

  constructor(public prefs: AsisPreferenciasService) {}

  ngOnInit() {
    if (this.chat) this.prefs.cargar().catch(() => {});
    if (!this.saludar) return;
    this.temporizadores.push(setTimeout(() => this.saludo.set(true), 1500));
    this.temporizadores.push(setTimeout(() => this.saludo.set(false), 9000));
  }

  ngOnDestroy() {
    this.temporizadores.forEach(clearTimeout);
  }

  alternar() {
    this.abierto() ? this.cerrar() : this.abrir();
  }

  abrir() {
    this.saludo.set(false);
    this.abierto.set(true);
    // Abrir es un toque del usuario: el navegador deja reproducir el sonido de Asis.
    if (this.chat && !this.bloqueado) this.prefs.reproducir();
  }

  cerrar() {
    this.abierto.set(false);
  }
}
