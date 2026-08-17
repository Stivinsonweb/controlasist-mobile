import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SoporteService } from '../../core/services/soporte.service';
import { ToastService } from '../../core/services/toast.service';
import { LogoComponent } from '../../shared/components/logo/logo.component';
import { DecorBlobsComponent } from '../../shared/components/decor-blobs/decor-blobs.component';

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

  constructor(
    private fb: FormBuilder,
    private soporteService: SoporteService,
    private toast: ToastService
  ) {
    this.form = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
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
      await this.soporteService.enviarMensaje(this.form.value.asunto, this.form.value.mensaje, this.form.value.correo);
      this.sent.set(true);
    } catch (e: any) {
      this.toast.error(e.message || 'No se pudo enviar el mensaje, intenta de nuevo');
    } finally {
      this.isSending.set(false);
    }
  }

  enviarOtro() {
    this.sent.set(false);
    this.form.reset({ correo: '', asunto: '', mensaje: '', sitio_web: '' });
  }
}
