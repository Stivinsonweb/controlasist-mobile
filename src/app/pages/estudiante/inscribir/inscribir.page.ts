import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Asignatura } from '../../../core/services/asignaturas.service';
import { EstudiantesPortalService, DocenteResumen } from '../../../core/services/estudiantes-portal.service';
import { ToastService } from '../../../core/services/toast.service';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { VerificadoBadgeComponent } from '../../../shared/components/verificado-badge/verificado-badge.component';

@Component({
  selector: 'app-inscribir',
  standalone: true,
  imports: [CommonModule, FormsModule, AvatarComponent, VerificadoBadgeComponent],
  templateUrl: './inscribir.page.html',
})
export class InscribirPage {
  codigoAcceso = '';
  buscando = false;
  encontrada = signal<Asignatura | null>(null);
  docenteEncontrado = signal<DocenteResumen | null>(null);

  constructor(private portalService: EstudiantesPortalService, private router: Router, private toast: ToastService) {}

  async buscar() {
    const codigo = this.codigoAcceso.trim();
    if (!codigo) {
      this.toast.warning('Ingresa un código de acceso');
      return;
    }

    this.buscando = true;
    this.encontrada.set(null);
    this.docenteEncontrado.set(null);
    try {
      const { asignatura, docente, expirado } = await this.portalService.buscarPorCodigoAcceso(codigo);
      if (!asignatura) {
        this.toast.error('Código no válido o asignatura inactiva');
        return;
      }
      if (expirado) {
        this.toast.error('Este código ha expirado');
        return;
      }
      this.encontrada.set(asignatura);
      this.docenteEncontrado.set(docente);
    } catch (e: any) {
      console.error('Error buscando código de acceso:', e);
      this.toast.error('No se pudo verificar el código, intenta de nuevo');
    } finally {
      this.buscando = false;
    }
  }

  continuar() {
    const a = this.encontrada();
    if (!a) return;
    this.router.navigate(['/estudiante/datos-inscripcion'], { queryParams: { asignaturaId: a.id } });
  }

  cancelar() {
    this.encontrada.set(null);
    this.docenteEncontrado.set(null);
    this.codigoAcceso = '';
  }
}
