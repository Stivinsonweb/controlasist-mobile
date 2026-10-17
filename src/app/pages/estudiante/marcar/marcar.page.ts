import { Component, ElementRef, OnDestroy, OnInit, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import jsQR from 'jsqr';
import { AsistenciaQrService, ResultadoMarcaQr } from '../../../core/services/asistencia-qr.service';

type Vista = 'escanear' | 'enviando' | 'resultado';

const MENSAJES: Record<ResultadoMarcaQr, { titulo: string; texto: string; ok: boolean }> = {
  marcado: { titulo: '¡Asistencia registrada!', texto: 'Tu docente ya te ve en la lista.', ok: true },
  'ya-marcado': { titulo: 'Ya habías marcado', texto: 'Tu asistencia de esta clase ya estaba registrada.', ok: true },
  vencido: { titulo: 'El código ya cambió', texto: 'El QR se renueva cada 20 segundos. Escanea el que está en pantalla ahora.', ok: false },
  cerrada: { titulo: 'La toma de asistencia terminó', texto: 'Tu docente ya cerró el QR de esta clase. Si estás en clase, avísale.', ok: false },
  'no-inscrito': { titulo: 'No estás inscrito en esta asignatura', texto: 'Inscríbete con el código de acceso de la asignatura y vuelve a escanear.', ok: false },
  'no-encontrada': { titulo: 'Código no reconocido', texto: 'Este QR no corresponde a una toma de asistencia de ControlAsist.', ok: false },
  'no-estudiante': { titulo: 'Solo para estudiantes', texto: 'Inicia sesión con tu cuenta de estudiante para marcar asistencia.', ok: false },
};

/**
 * Marcar asistencia con el QR del docente. Llega por el enlace del QR (cámara del celular →
 * /estudiante/marcar?s=...&t=...) o se escanea aquí mismo con la cámara (útil en iPhone con la
 * app instalada, donde el enlace abriría Safari en vez de la app).
 */
@Component({
  selector: 'app-marcar-qr',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './marcar.page.html',
})
export class MarcarQrPage implements OnInit, OnDestroy {
  @ViewChild('video') video?: ElementRef<HTMLVideoElement>;

  vista = signal<Vista>('escanear');
  errorCamara = signal<string | null>(null);
  resultado = signal<{ titulo: string; texto: string; ok: boolean; asignatura?: string; estado?: string } | null>(null);

  private stream: MediaStream | null = null;
  private canvas = document.createElement('canvas');
  private frame = 0;

  constructor(private route: ActivatedRoute, private router: Router, private qrService: AsistenciaQrService) {}

  ngOnInit() {
    const s = this.route.snapshot.queryParamMap.get('s');
    const t = this.route.snapshot.queryParamMap.get('t');
    if (s && t) {
      // Se quita el token de la URL para que recargar la página no reenvíe un código vencido.
      this.router.navigate([], { queryParams: {}, replaceUrl: true });
      this.enviar(s, t);
    } else {
      this.iniciarCamara();
    }
  }

  ngOnDestroy() {
    this.detenerCamara();
  }

  async iniciarCamara() {
    this.vista.set('escanear');
    this.errorCamara.set(null);
    this.resultado.set(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      this.errorCamara.set('Tu navegador no permite usar la cámara aquí. Escanea el QR con la app de cámara de tu celular.');
      return;
    }
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      // Espera a que el <video> exista en la vista de escaneo.
      setTimeout(() => {
        const v = this.video?.nativeElement;
        if (!v || !this.stream) return;
        v.srcObject = this.stream;
        v.setAttribute('playsinline', 'true');
        v.play().catch(() => {});
        this.leerFotograma();
      });
    } catch {
      this.errorCamara.set('No pudimos usar la cámara. Revisa el permiso de cámara del navegador, o escanea el QR con la app de cámara de tu celular.');
    }
  }

  private leerFotograma = () => {
    const v = this.video?.nativeElement;
    if (!v || !this.stream || this.vista() !== 'escanear') return;
    if (v.readyState === v.HAVE_ENOUGH_DATA && v.videoWidth > 0) {
      this.canvas.width = v.videoWidth;
      this.canvas.height = v.videoHeight;
      const ctx = this.canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(v, 0, 0, this.canvas.width, this.canvas.height);
        const img = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const codigo = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
        const datos = codigo ? this.qrService.leerContenidoQr(codigo.data) : null;
        if (datos) {
          this.detenerCamara();
          this.enviar(datos.s, datos.t);
          return;
        }
      }
    }
    this.frame = requestAnimationFrame(this.leerFotograma);
  };

  private detenerCamara() {
    cancelAnimationFrame(this.frame);
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
  }

  private async enviar(sesionId: string, token: string) {
    this.vista.set('enviando');
    try {
      const r = await this.qrService.marcar(sesionId, token);
      const msg = MENSAJES[r.resultado] ?? MENSAJES['no-encontrada'];
      this.resultado.set({ ...msg, asignatura: r.asignatura, estado: r.estado });
    } catch {
      this.resultado.set({ titulo: 'No se pudo marcar', texto: 'Revisa tu conexión a internet e intenta de nuevo.', ok: false });
    }
    this.vista.set('resultado');
  }
}
