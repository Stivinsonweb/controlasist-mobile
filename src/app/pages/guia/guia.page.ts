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
  /** Instrucciones numeradas, estilo manual — se muestran debajo de la descripción corta. */
  pasos: string[];
}

type Rol = 'docente' | 'estudiante';

const TEMAS_DOCENTE: GuiaTema[] = [
  {
    variant: 'crear-asignatura',
    titulo: 'Registrar una asignatura',
    descripcion: 'Desde "Inicio", crea una asignatura nueva, ponle un nombre y elige un color para identificarla fácilmente.',
    pasos: [
      'Desde "Inicio", presiona el botón "Nueva asignatura".',
      'Completa el nombre, código, grupo, nivel y periodo académico (facultad, programa y aula son opcionales).',
      'Elige un color y un ícono para identificarla en tu lista de asignaturas.',
      'Presiona "Crear asignatura" — el sistema genera automáticamente un código de acceso único para tus estudiantes.',
      'Entra al detalle de la asignatura para copiar ese código y compartirlo con tu grupo.',
    ],
  },
  {
    variant: 'horarios',
    titulo: 'Configurar horarios',
    descripcion: 'Dentro de la asignatura, agrega los días y horas de tus clases — puedes cargar varios horarios a la vez.',
    pasos: [
      'Entra al detalle de la asignatura y ubica la sección "Horarios de clase".',
      'Presiona "+ Horario" para un solo horario, o "Agregar varios" para cargar varios días de una vez.',
      'Si usas "Agregar varios", marca los días de la semana en que dictas la clase y define hora de inicio y fin para cada uno (hay atajos de horas rápidas).',
      'Indica el aula si aplica, o una fecha específica si es una sesión puntual (no recurrente).',
      'Guarda — los horarios quedan listados y arman el calendario de clases de la asignatura.',
    ],
  },
  {
    variant: 'tomar-asistencia',
    titulo: 'Tomar asistencia',
    descripcion: 'En cada clase programada, toca "Tomar asistencia" y marca a cada estudiante como presente, tarde o ausente.',
    pasos: [
      'En el detalle de la asignatura, haz clic en la clase del día que quieres registrar dentro del calendario de clases.',
      'Marca el estado de la clase (realizada, cancelada o aplazada); si fue realizada, presiona "Tomar asistencia de esta clase".',
      'Marca a cada estudiante como presente, tarde, justificado o ausente — o usa "Marcar todos presentes" y ajusta solo las excepciones.',
      'Selecciona el tipo de clase (teórica, taller, evaluación o laboratorio) y describe los temas tratados — ambos son obligatorios para guardar.',
      'Agrega observaciones si lo necesitas y presiona "Guardar asistencia".',
    ],
  },
  {
    variant: 'gestionar-estudiantes',
    titulo: 'Gestionar estudiantes',
    descripcion: 'Comparte el código de inscripción de tu asignatura o carga tu lista de estudiantes en bloque desde una plantilla.',
    pasos: [
      'En el detalle de la asignatura, copia el "Código de acceso" del panel lateral y compártelo con tus estudiantes para que se inscriban por su cuenta.',
      'Si necesitas cambiarlo, usa "Configurar" para regenerar el código.',
      'Para inscribir a todo un grupo de una vez, presiona "Cargar Excel/CSV" y sube tu lista de estudiantes.',
      'Revisa la lista de "Estudiantes inscritos" en el panel lateral para confirmar quién ya quedó vinculado.',
    ],
  },
  {
    variant: 'reportes',
    titulo: 'Generar reportes',
    descripcion: 'Consulta el resumen general o por estudiante y exporta todo a Excel o PDF con el formato institucional.',
    pasos: [
      'Desde el detalle de la asignatura, presiona "Reportes".',
      'Filtra por año si necesitas acotar el periodo y revisa las tarjetas de resumen (clases dictadas, presentes, tarde, justificados, ausentes).',
      'Consulta la tabla "Resumen por estudiante" para ver el porcentaje de asistencia individual de cada uno.',
      'Exporta el resumen general en Excel o PDF con los botones de la parte superior.',
      'Para el historial con el formato institucional, configura logo, código, versión y segunda firma una vez, y exporta el "Excel institucional" o "PDF institucional".',
    ],
  },
  {
    variant: 'perfil',
    titulo: 'Mi perfil',
    descripcion: 'Actualiza tus datos, cambia tu contraseña y elige el color de acento de tu panel.',
    pasos: [
      'Entra a "Mi perfil" desde el menú lateral.',
      'Presiona "Cambiar foto" para elegir un avatar prediseñado o subir tu propia foto.',
      'Elige el tema de acento que se aplica al sidebar, botones y avatar de tu panel.',
      'Actualiza tus datos personales y presiona "Guardar cambios".',
      'En "Verificación de cuenta", presiona "Solicitar verificación" para pedir la insignia de verificado — tus estudiantes la verán junto a tu nombre al inscribirse.',
      'Para cambiar tu contraseña, usa la sección "Cambiar contraseña" al final de la página.',
    ],
  },
  {
    variant: 'reportes',
    titulo: 'Premium: personaliza tus reportes',
    descripcion: 'Activa Premium (prueba gratis o pago) y personaliza el logo, encabezado y secciones de tus reportes.',
    pasos: [
      'Entra a "Premium" desde el menú lateral.',
      'Si nunca has usado Premium, presiona "Solicitar prueba gratis de 1 mes" — queda pendiente hasta que un administrador la apruebe.',
      'Si ya usaste tu prueba, presiona "Activar Premium" y sube tu comprobante de pago (monto, fecha y el periodo que pagaste); un administrador lo revisa y activa tu acceso.',
      'Con Premium activo, personaliza la posición y tamaño del logo, los títulos del encabezado, y el orden/activación de las secciones del reporte arrastrándolas.',
      'Los cambios se guardan solos — no hay botón de "Guardar". Revisa la vista previa a la derecha para confirmar cómo se verá el reporte final.',
    ],
  },
  {
    variant: 'perfil',
    titulo: 'Notificaciones y apariencia',
    descripcion: 'Activa recordatorios de tus clases y elige si prefieres el panel en modo oscuro, claro o según tu sistema.',
    pasos: [
      'En "Mi perfil", activa el interruptor "Recordatorios de clase" para recibir una notificación en tu navegador antes de que empiece cada clase, incluso con la app cerrada.',
      'La primera vez, el navegador te pedirá permiso de notificaciones — acéptalo para que funcione.',
      'Para cambiar la apariencia, usa el ícono de sol/luna en la parte superior del panel (junto a "¿Cómo funciona?") y elige Oscuro, Claro o Sistema.',
      'Con "Sistema", el panel sigue automáticamente el modo oscuro/claro de tu computador o celular.',
    ],
  },
];

const TEMAS_ESTUDIANTE: GuiaTema[] = [
  {
    variant: 'inscribir',
    titulo: 'Inscribirme a una asignatura',
    descripcion: 'Ingresa el código que te compartió tu docente para unirte a su asignatura.',
    pasos: [
      'Entra a "Inscribirme" desde tu inicio.',
      'Escribe el código de acceso que te compartió tu docente (formato tipo XXXX-XXXX) y presiona "Buscar".',
      'Verifica que la asignatura encontrada sea la correcta (nombre, grupo y periodo).',
      'Presiona "Inscribirme" para confirmar — quedará agregada a tu lista de asignaturas.',
    ],
  },
  {
    variant: 'ver-horario',
    titulo: 'Ver mis asignaturas y horario',
    descripcion: 'Desde "Inicio" consulta todas tus asignaturas inscritas y el horario de cada una.',
    pasos: [
      'Desde "Inicio" verás una tarjeta por cada asignatura en la que estás inscrito, con su docente y modalidad.',
      'Haz clic en una tarjeta para ver su detalle: horarios de clase, aula, créditos y docente asignado.',
      'Si ya no quieres seguir inscrito, puedes desinscribirte desde ese mismo detalle — podrás volver a inscribirte con el mismo código más adelante.',
    ],
  },
  {
    variant: 'consultar-asistencia',
    titulo: 'Consultar mi asistencia',
    descripcion: 'Entra a "Mi asistencia" para ver tu porcentaje de asistencia y el detalle de cada clase, por asignatura.',
    pasos: [
      'Entra a "Mi asistencia" desde el menú lateral.',
      'Verás una tarjeta por cada asignatura en la que estás inscrito, con tu porcentaje de clases presentes y un resumen por estado (presente, tarde, justificado, ausente).',
      'Haz clic en una tarjeta para abrir el detalle: la lista completa de tus clases con la fecha, el tipo de clase y el estado que te registraron en cada una.',
    ],
  },
  {
    variant: 'perfil',
    titulo: 'Mi perfil',
    descripcion: 'Actualiza tus datos y cambia tu contraseña cuando lo necesites.',
    pasos: [
      'Entra a "Mi perfil" desde tu inicio.',
      'Presiona "Cambiar foto" para elegir un avatar prediseñado o subir tu propia foto.',
      'Actualiza tus datos personales (documento, teléfono, programa, fecha de nacimiento, ciudad, dirección) y presiona "Guardar cambios".',
      'Para cambiar tu contraseña, usa la sección "Cambiar contraseña" al final de la página.',
    ],
  },
  {
    variant: 'perfil',
    titulo: 'Notificaciones y apariencia',
    descripcion: 'Activa recordatorios de tus clases y elige si prefieres el panel en modo oscuro, claro o según tu sistema.',
    pasos: [
      'En "Mi perfil", activa el interruptor "Recordatorios de clase" para recibir una notificación en tu navegador antes de que empiece cada clase, incluso con la app cerrada.',
      'La primera vez, el navegador te pedirá permiso de notificaciones — acéptalo para que funcione.',
      'Para cambiar la apariencia, usa el ícono de sol/luna en la parte superior del panel (junto a "¿Cómo funciona?") y elige Oscuro, Claro o Sistema.',
      'Con "Sistema", el panel sigue automáticamente el modo oscuro/claro de tu computador o celular.',
    ],
  },
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
