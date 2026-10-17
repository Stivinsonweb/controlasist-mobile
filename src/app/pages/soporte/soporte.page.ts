import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SoporteService } from '../../core/services/soporte.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { LogoComponent } from '../../shared/components/logo/logo.component';
import { DecorBlobsComponent } from '../../shared/components/decor-blobs/decor-blobs.component';

const TEMAS_DOCENTE = ['Tomar asistencia', 'Asignaturas y horarios', 'Reportes y plantillas', 'Premium y pagos', 'Mi cuenta', 'Otro'];
const TEMAS_ESTUDIANTE = ['Inscribirme a una asignatura', 'Mi asistencia', 'Mi cuenta', 'Otro'];

@Component({
  selector: 'app-soporte',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LogoComponent, DecorBlobsComponent],
  templateUrl: './soporte.page.html',
})
export class SoportePage {
  form: FormGroup;
  isSending = signal(false);
  sent = signal(false);
  /** true = dentro del panel de docente/estudiante (con sesión); false = página pública /soporte. */
  embebido: boolean;
  temas: string[] = [];
  private remitente = '';

  constructor(
    private fb: FormBuilder,
    private soporteService: SoporteService,
    private toast: ToastService,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {
    this.embebido = !!this.route.snapshot.data['embebido'];
    const perfil = this.embebido ? this.authService.currentProfileValue : null;
    if (perfil) {
      this.temas = perfil.rol === 'estudiante' ? TEMAS_ESTUDIANTE : TEMAS_DOCENTE;
      this.remitente = `${perfil.nombres} ${perfil.apellidos} (${perfil.rol}) · ${perfil.email}`;
    }

    this.form = this.fb.group({
      correo: [perfil?.email || '', [Validators.required, Validators.email]],
      tema: [''],
      asunto: ['', Validators.required],
      mensaje: ['', Validators.required],
      // Honeypot: campo oculto por CSS (no type="hidden") que un bot suele autocompletar y una persona nunca ve.
      sitio_web: [''],
    });
  }

  get correo() { return this.form.get('correo'); }
  get asunto() { return this.form.get('asunto'); }
  get mensaje() { return this.form.get('mensaje'); }

  async enviar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.warning('Completa el correo, el asunto y el mensaje');
      return;
    }
    if (this.form.value.sitio_web) return;

    this.isSending.set(true);
    try {
      const { tema, asunto, mensaje, correo } = this.form.value;
      // Desde el panel se identifica quién escribe, para que soporte no tenga que preguntarlo.
      const asuntoFinal = tema ? `[${tema}] ${asunto}` : asunto;
      const mensajeFinal = this.remitente ? `${mensaje}\n\n— Enviado desde el panel por: ${this.remitente}` : mensaje;
      await this.soporteService.enviarMensaje(asuntoFinal, mensajeFinal, correo);
      this.sent.set(true);
    } catch (e: any) {
      this.toast.error(e.message || 'No se pudo enviar el mensaje, intenta de nuevo');
    } finally {
      this.isSending.set(false);
    }
  }

  enviarOtro() {
    this.sent.set(false);
    this.form.reset({ correo: this.embebido ? this.form.value.correo : '', tema: '', asunto: '', mensaje: '', sitio_web: '' });
  }
}
