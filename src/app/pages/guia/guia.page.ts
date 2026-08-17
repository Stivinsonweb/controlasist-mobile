import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LogoComponent } from '../../shared/components/logo/logo.component';
import { DecorBlobsComponent } from '../../shared/components/decor-blobs/decor-blobs.component';
import { IllustratedSceneComponent, SceneVariant } from '../../shared/components/illustrated-scene/illustrated-scene.component';

interface GuiaTema {
  variant: SceneVariant;
  titulo: string;
  descripcion: string;
}

type Rol = 'docente' | 'estudiante';

const TEMAS_DOCENTE: GuiaTema[] = [
  { variant: 'crear-asignatura', titulo: 'Registrar una asignatura', descripcion: 'Desde "Inicio", crea una asignatura nueva, ponle un nombre y elige un color para identificarla fácilmente.' },
  { variant: 'horarios', titulo: 'Configurar horarios', descripcion: 'Dentro de la asignatura, agrega los días y horas de tus clases — puedes cargar varios horarios a la vez.' },
  { variant: 'tomar-asistencia', titulo: 'Tomar asistencia', descripcion: 'En cada clase programada, toca "Tomar asistencia" y marca a cada estudiante como presente, tarde o ausente.' },
  { variant: 'gestionar-estudiantes', titulo: 'Gestionar estudiantes', descripcion: 'Comparte el código de inscripción de tu asignatura o carga tu lista de estudiantes en bloque desde una plantilla.' },
  { variant: 'reportes', titulo: 'Generar reportes', descripcion: 'Consulta el resumen general o por estudiante y exporta todo a Excel o PDF con el formato institucional.' },
  { variant: 'perfil', titulo: 'Mi perfil', descripcion: 'Actualiza tus datos, cambia tu contraseña y elige el color de acento de tu panel.' },
];

const TEMAS_ESTUDIANTE: GuiaTema[] = [
  { variant: 'inscribir', titulo: 'Inscribirme a una asignatura', descripcion: 'Ingresa el código que te compartió tu docente para unirte a su asignatura.' },
  { variant: 'ver-horario', titulo: 'Ver mis asignaturas y horario', descripcion: 'Desde "Inicio" consulta todas tus asignaturas inscritas y el horario de cada una.' },
  { variant: 'consultar-asistencia', titulo: 'Consultar mi asistencia', descripcion: 'Entra a una asignatura para ver el detalle de tu asistencia registrada en cada clase.' },
  { variant: 'perfil', titulo: 'Mi perfil', descripcion: 'Actualiza tus datos y cambia tu contraseña cuando lo necesites.' },
];

/**
 * Guía interactiva del sistema: apartado dedicado (no una superposición sobre las pantallas
 * reales) con un tema por cada función real del producto, agrupados por rol. Ruta pública
 * (`/guia`, fuera del layout con sidebar) para que sea accesible tanto desde el login como
 * ya logueado.
 */
@Component({
  selector: 'app-guia',
  standalone: true,
  imports: [CommonModule, RouterLink, LogoComponent, DecorBlobsComponent, IllustratedSceneComponent],
  templateUrl: './guia.page.html',
})
export class GuiaPage {
  rol = signal<Rol>('docente');
  activo = signal(0);

  temas = computed(() => (this.rol() === 'docente' ? TEMAS_DOCENTE : TEMAS_ESTUDIANTE));
  temaActivo = computed(() => this.temas()[this.activo()]);

  setRol(rol: Rol) {
    this.rol.set(rol);
    this.activo.set(0);
  }

  irATema(i: number) {
    this.activo.set(i);
  }

  anterior() {
    if (this.activo() > 0) this.activo.update((v) => v - 1);
  }

  siguiente() {
    if (this.activo() < this.temas().length - 1) this.activo.update((v) => v + 1);
  }
}
