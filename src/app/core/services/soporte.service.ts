import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SoporteService {
  async enviarMensaje(asunto: string, mensaje: string, correo: string) {
    const respuesta = await fetch('/enviar-soporte.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ asunto, mensaje, correo, sitio_web: '' }),
    });
    const datos = await respuesta.json();
    if (!datos.ok) throw new Error(datos.error || 'No se pudo enviar el mensaje');
    return datos;
  }
}
