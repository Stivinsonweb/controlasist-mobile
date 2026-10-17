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
    descripcion: 'En cada clase, marca a cada estudiante con botones claros (Presente, Tarde, Justificado, Ausente) y escribe el motivo de las justificaciones.',
    pasos: [
      'Atajo: en tu "Inicio", la tarjeta "Mis clases de hoy" muestra las clases del día con los botones "Tomar asistencia" y "QR" — un toque y quedas en la lista (la clase se marca como realizada).',
      'También puedes entrar al detalle de la asignatura y hacer clic en la clase del día dentro del calendario de clases.',
      'Marca primero el estado de la clase: si fue realizada se abre la toma de asistencia; si fue cancelada o aplazada no se toma asistencia y los estudiantes no tienen falla.',
      'Arriba verás un resumen en vivo con cuántos van presentes, tarde, justificados y ausentes. Si tienes muchos estudiantes, usa el buscador para encontrar a alguien rápido.',
      'Marca a cada estudiante con los botones "Presente", "Tarde", "Justificado" o "Ausente" — o usa "Todos presentes" y ajusta solo las excepciones.',
      'Al marcar "Justificado" aparece el campo "Motivo de la justificación" (ej: incapacidad médica, calamidad doméstica). Para cualquier otro estado puedes agregar una nota con el botón del lápiz o "+ Nota".',
      'Selecciona el tipo de clase (teórica, taller, evaluación o laboratorio) y describe los temas tratados — ambos son obligatorios para guardar.',
      'Agrega observaciones de la clase si lo necesitas y presiona "Guardar asistencia". Los motivos y notas quedan guardados y salen en los reportes.',
    ],
  },
  {
    variant: 'tomar-asistencia',
    titulo: 'Pasar lista con QR',
    descripcion: 'Proyecta un código QR en clase: tus estudiantes lo escanean con su celular y la lista se llena sola.',
    pasos: [
      'Abre "Tomar asistencia" en la clase del día y presiona "Pasar lista con QR".',
      'Se abre un QR a pantalla completa (usa "Pantalla completa" para proyectarlo). El código cambia cada 20 segundos, así una foto vieja no sirve para marcar después.',
      'Tus estudiantes lo escanean con la cámara del celular o desde la app ("Escanear QR"). A la derecha ves en vivo cuántos y quiénes ya marcaron.',
      'Si la clase ya empezó, cambia a "Los que escaneen desde ahora quedan como: Tarde".',
      'Presiona "Terminar y revisar": el QR se cierra, quien escaneó queda presente o tarde y quien no, ausente (los justificados no se tocan).',
      'Revisa la lista, corrige lo que haga falta, completa el tipo de clase y los temas, y presiona "Guardar asistencia".',
      'Si cierras la pantalla del QR sin terminar, puedes volver a abrirla y continúa donde ibas.',
    ],
  },
  {
    variant: 'gestionar-estudiantes',
    titulo: 'Gestionar estudiantes',
    descripcion: 'Comparte el código de inscripción de tu asignatura o carga tu lista de estudiantes en bloque desde una plantilla.',
    pasos: [
      'En el detalle de la asignatura, copia el "Código de acceso" del panel lateral y compártelo con tus estudiantes para que se inscriban por su cuenta.',
      'Si necesitas cambiarlo, usa "Configurar" para regenerar el código.',
      'Para inscribir a todo un grupo de una vez, presiona "Cargar Excel/CSV" y sube tu lista de estudiantes (descarga la plantilla para ver el formato). Las tildes y la ñ se leen bien tanto en Excel como en CSV.',
      'Revisa la lista de "Estudiantes inscritos" en el panel lateral para confirmar quién ya quedó vinculado.',
    ],
  },
  {
    variant: 'reportes',
    titulo: 'Generar reportes',
    descripcion: 'Consulta el resumen general o por estudiante, las justificaciones, y exporta todo a Excel o PDF con el formato institucional.',
    pasos: [
      'Desde el detalle de la asignatura, presiona "Reportes".',
      'Filtra por año si necesitas acotar el periodo y revisa las tarjetas de resumen (clases dictadas, presentes, tarde, justificados, ausentes).',
      'Revisa las gráficas: distribución general por estado, ranking de asistencia por estudiante (en rojo quienes están por debajo del 75%) y la tendencia de asistencia clase por clase.',
      'Consulta la tabla "Resumen por estudiante" y la sección "Justificaciones y observaciones", con el motivo que escribiste para cada estudiante.',
      'Exporta el resumen general en Excel o PDF con los botones de la parte superior — las justificaciones salen en una tabla del PDF y en la hoja "Justificaciones" del Excel.',
      'Para el historial con el formato institucional, configura logo, código, versión y segunda firma una vez, y exporta el "Excel institucional" o "PDF institucional". El PDF usa la plantilla que guardaste en "Premium".',
    ],
  },
  {
    variant: 'reportes',
    titulo: 'Plantillas de reporte',
    descripcion: 'Elige el diseño de tus reportes institucionales: formatos profesionales en blanco y negro para colegio o universidad.',
    pasos: [
      'Entra a "Premium" desde el menú lateral — ahí está la página "Plantillas de reporte".',
      'En la pestaña "Plantilla gratis" tienes dos plantillas: "Universidad · Institucional" y "Colegio · Planilla escolar". Elige una, revisa la vista previa y presiona "Guardar plantilla".',
      'En la pestaña "Plantilla Premium" verás las 6 plantillas (Institucional, Planilla escolar, Acta oficial, Ejecutivo, Clásico y Moderno). Sin Premium, las 4 exclusivas aparecen con un candado.',
      'Con Premium, toca una plantilla para elegirla y presiona "Configurar plantilla" para ajustarla: tipo de institución, posición y tamaño del logo, título, subtítulo, segunda firma, secciones (arrastra para reordenar), tipo de tabla, columnas y tamaño de letra.',
      'Los cambios NO se guardan solos: cuando la vista previa te guste, presiona "Guardar plantilla" en la barra inferior. Si ves "Tienes cambios sin guardar", aún no se aplicaron.',
      'La plantilla marcada "En uso" es la que usan tus reportes institucionales en PDF y Excel.',
    ],
  },
  {
    variant: 'perfil',
    titulo: 'Activar Premium',
    descripcion: 'Activa Premium con la prueba gratis o con un pago para usar todas las plantillas y configurarlas.',
    pasos: [
      'Entra a "Premium" desde el menú lateral y ve a la pestaña "Plantilla Premium".',
      'Si nunca has usado Premium, presiona "Solicitar prueba gratis de 1 mes" — se activa al instante, sin esperar aprobación.',
      'Si ya usaste tu prueba, presiona "Activar Premium": verás los métodos de pago disponibles (Nequi, Bancolombia, etc.) y la referencia que debes escribir en el pago. Luego sube tu comprobante con el monto y la fecha — un administrador lo revisa y activa tu acceso.',
      'Con Premium ya activo, puedes renovar tu plan mensual cuando quieras desde el botón "Renovar" — no hace falta esperar a que venza.',
      'Los avisos de aprobación, rechazo o vencimiento de Premium te llegan a "Notificaciones".',
    ],
  },
  {
    variant: 'perfil',
    titulo: 'Notificaciones',
    descripcion: 'Revisa en un solo lugar los recordatorios de tus clases y los avisos de Premium y de tu cuenta.',
    pasos: [
      'Entra a "Notificaciones" desde el menú lateral o toca la campana en la parte superior del panel — el número rojo indica cuántas tienes sin leer.',
      'Las notificaciones se agrupan por día (Hoy, Ayer...) y cada tipo tiene su color: Alertas, Clases, Premium y Cuenta. Usa los filtros "Todas", "No leídas" o por tipo.',
      'Recibirás una "Alerta" cuando un estudiante baje del 75% de asistencia en una de tus asignaturas (desde la 3.ª clase registrada), para que puedas hablar con él a tiempo.',
      'Toca una notificación para marcarla como leída, o "Ver →" para ir a la sección relacionada. Con "Marcar todas como leídas" quedas al día de un toque, y con la "×" la eliminas.',
      'Para recibirlas también en tu celular o navegador (incluso con la app cerrada), activa "Recordatorios de clase" en la parte superior de Notificaciones o en "Mi perfil" y acepta el permiso del navegador.',
    ],
  },
  {
    variant: 'perfil',
    titulo: 'Mi perfil y apariencia',
    descripcion: 'Actualiza tus datos, cambia tu contraseña, pide la verificación y elige el color y modo de tu panel.',
    pasos: [
      'Entra a "Mi perfil" desde el menú lateral.',
      'Presiona "Cambiar foto" para elegir un avatar prediseñado o subir tu propia foto.',
      'Elige el tema de acento que se aplica al sidebar, botones y avatar de tu panel.',
      'Actualiza tus datos personales y presiona "Guardar cambios".',
      'En "Verificación de cuenta", presiona "Solicitar verificación" para pedir la insignia de verificado — tus estudiantes la verán junto a tu nombre al inscribirse.',
      'Para cambiar tu contraseña, usa la sección "Cambiar contraseña" al final de la página.',
      'Para cambiar la apariencia, usa el ícono de sol/luna en la parte superior del panel y elige Oscuro, Claro o Sistema (sigue el modo de tu computador o celular).',
    ],
  },
  {
    variant: 'perfil',
    titulo: 'Soporte',
    descripcion: '¿Tienes un problema o una pregunta? Escríbenos desde tu panel y te respondemos por correo.',
    pasos: [
      'Entra a "Soporte" desde el menú lateral.',
      'Tu correo ya viene puesto. Elige un tema (opcional), escribe el asunto y describe tu problema con el mayor detalle posible.',
      'Presiona "Enviar mensaje": te llega una copia de confirmación a tu correo y nuestro equipo te responde por ese medio.',
      'También puedes escribir directamente a soporte@controlasistencia.co.',
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
      'Escribe el código de acceso que te compartió tu docente (empieza con el nombre y el código de la asignatura, ej. INGE-2720507-6PVL) y presiona "Buscar".',
      'Verifica que la asignatura encontrada sea la correcta (nombre, grupo y periodo) — verás la foto del docente y, si tiene la cuenta verificada, una insignia azul junto a su nombre.',
      'Presiona "Inscribirme". Si a tu perfil le faltan datos, completa tu documento, teléfono y programa.',
      'Presiona "Confirmar inscripción" — la asignatura quedará agregada a tu lista.',
    ],
  },
  {
    variant: 'consultar-asistencia',
    titulo: 'Marcar asistencia con QR',
    descripcion: 'Cuando tu docente proyecte el QR de asistencia, escanéalo con tu celular para quedar presente al instante.',
    pasos: [
      'Opción 1: abre la cámara de tu celular, apunta al QR y toca el enlace que aparece — se abre ControlAsist y tu asistencia queda registrada.',
      'Opción 2: dentro de la app, toca "Escanear QR de asistencia" en tu inicio (o "Escanear QR" en el menú), permite el uso de la cámara y apunta al código. En iPhone con la app instalada, usa esta opción.',
      'Si no tenías la sesión abierta, inicia sesión con tu cuenta de estudiante y volverás directo a marcar.',
      'Verás "¡Asistencia registrada!" con el nombre de la asignatura. Si dice "El código ya cambió", vuelve a escanear el que está en pantalla: el QR se renueva cada 20 segundos.',
      'Solo puedes marcar en asignaturas en las que estás inscrito y mientras tu docente tenga el QR abierto.',
    ],
  },
  {
    variant: 'ver-horario',
    titulo: 'Ver mis asignaturas y horario',
    descripcion: 'Desde "Inicio" consulta todas tus asignaturas inscritas y el horario de cada una.',
    pasos: [
      'Desde "Inicio" verás una tarjeta por cada asignatura en la que estás inscrito, con su docente y modalidad.',
      'Haz clic en una tarjeta para ver su detalle: la foto y el nombre del docente (con insignia si está verificado), horarios de clase, aula y créditos.',
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
      'Haz clic en una tarjeta para abrir el detalle: una gráfica de barra con tu asistencia por estado, y la lista completa de tus clases con la fecha, el tipo de clase y el estado que te registraron en cada una.',
    ],
  },
  {
    variant: 'perfil',
    titulo: 'Notificaciones',
    descripcion: 'Revisa los recordatorios de tus clases en un solo lugar y recíbelos también en tu celular.',
    pasos: [
      'Entra a "Notificaciones" desde el menú lateral o toca la campana en la parte superior — el número rojo indica cuántas tienes sin leer.',
      'Las notificaciones se agrupan por día (Hoy, Ayer...). Usa los filtros "Todas" o "No leídas".',
      'Si tu asistencia en una asignatura baja del 75%, te llega una "Alerta" de riesgo de pérdida por fallas con cuántas clases has faltado — revisa "Mi asistencia" y habla con tu docente.',
      'Toca una notificación para marcarla como leída, usa "Marcar todas como leídas" para quedar al día, o la "×" para eliminarla.',
      'Para recibir los recordatorios en tu celular o navegador antes de cada clase (incluso con la app cerrada), activa "Recordatorios de clase" en la parte superior de Notificaciones o en "Mi perfil" y acepta el permiso del navegador.',
    ],
  },
  {
    variant: 'perfil',
    titulo: 'Mi perfil y apariencia',
    descripcion: 'Actualiza tus datos, cambia tu contraseña y elige el modo de tu panel.',
    pasos: [
      'Entra a "Mi perfil" desde tu inicio o el menú lateral.',
      'Presiona "Cambiar foto" para elegir un avatar prediseñado o subir tu propia foto.',
      'Actualiza tus datos personales (documento, teléfono, programa, fecha de nacimiento, ciudad, dirección) y presiona "Guardar cambios".',
      'Para cambiar tu contraseña, usa la sección "Cambiar contraseña" al final de la página.',
      'Para cambiar la apariencia, usa el ícono de sol/luna en la parte superior del panel y elige Oscuro, Claro o Sistema.',
    ],
  },
  {
    variant: 'perfil',
    titulo: 'Soporte',
    descripcion: '¿Tienes un problema o una pregunta? Escríbenos desde tu panel y te respondemos por correo.',
    pasos: [
      'Entra a "Soporte" desde el menú lateral.',
      'Tu correo ya viene puesto. Elige un tema (opcional), escribe el asunto y describe tu problema.',
      'Presiona "Enviar mensaje": te llega una copia de confirmación a tu correo y te respondemos por ese medio.',
      'También puedes escribir directamente a soporte@controlasistencia.co.',
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
