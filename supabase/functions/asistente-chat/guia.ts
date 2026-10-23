// GENERADO por scripts/generar-guia-asistente.py a partir de la guía de la app. No editar a mano.
export interface TemaGuia { titulo: string; descripcion: string; pasos: string[] }
export const GUIA_DOCENTE: TemaGuia[] = [
  {
    "titulo": "Iniciar sesión y recordar mis datos",
    "descripcion": "Entra con tu correo y contraseña y, si quieres, deja que tu navegador o celular los recuerde.",
    "pasos": [
      "En la pantalla de inicio de sesión elige \"Docente\", escribe tu correo y tu contraseña.",
      "Deja marcada la casilla \"Recordar mi correo y contraseña en este dispositivo\" y presiona \"Iniciar sesión\".",
      "Tu navegador o celular te ofrecerá guardar la contraseña (\"¿Guardar contraseña?\" en Chrome y Android, o el llavero en iPhone): acepta.",
      "La próxima vez tu correo aparecerá escrito y la contraseña se completará sola (en iPhone, toca el campo y elige la sugerida).",
      "Tu contraseña la guarda de forma segura tu navegador o celular, no ControlAsist. En un computador compartido, desmarca la casilla.",
      "¿Olvidaste tu contraseña? Toca \"¿Olvidaste tu contraseña?\", escribe tu correo y sigue el enlace que te llega."
    ]
  },
  {
    "titulo": "Registrar una asignatura",
    "descripcion": "Desde \"Inicio\", crea una asignatura nueva, ponle un nombre y elige un color para identificarla fácilmente.",
    "pasos": [
      "Desde \"Inicio\", presiona el botón \"Nueva asignatura\".",
      "Completa el nombre, código, grupo, nivel y periodo académico (facultad, programa y aula son opcionales).",
      "Elige un color y un ícono para identificarla en tu lista de asignaturas.",
      "Presiona \"Crear asignatura\" — el sistema genera automáticamente un código de acceso único para tus estudiantes.",
      "Entra al detalle de la asignatura para copiar ese código y compartirlo con tu grupo.",
      "Si la clase es por Meet, Zoom o Teams, elige la modalidad \"Virtual\" o \"Híbrida\": así se activan las opciones de clase virtual.",
      "Al terminar el semestre puedes \"Desactivar asignatura\" (al final del detalle): queda archivada, sin borrar su historial. Para volver a usarla, presiona el botón \"Archivadas\" en tu inicio, entra a ella y presiona \"Reactivar asignatura\"."
    ]
  },
  {
    "titulo": "Configurar horarios",
    "descripcion": "Dentro de la asignatura, agrega los días y horas de tus clases — puedes cargar varios horarios a la vez.",
    "pasos": [
      "Entra al detalle de la asignatura y ubica la sección \"Horarios de clase\".",
      "Presiona \"+ Horario\" para un solo horario, o \"Agregar varios\" para cargar varios días de una vez.",
      "Toca \"Hora inicio\" u \"Hora fin\" y elige la hora en el reloj: primero la hora (con a. m. / p. m.) y luego los minutos. Al terminar la hora de inicio, \"Siguiente\" pasa a la de fin.",
      "Si usas \"Agregar varios\", marca los días de la semana en que dictas la clase y define hora de inicio y fin para cada uno (hay atajos de horas rápidas). La hora de fin debe ser posterior a la de inicio.",
      "Indica el aula si aplica, o una fecha específica si es una sesión puntual (no recurrente).",
      "Guarda — los horarios quedan listados y arman el calendario de clases de la asignatura."
    ]
  },
  {
    "titulo": "Tomar asistencia",
    "descripcion": "En cada clase, marca a cada estudiante con botones claros (Presente, Tarde, Justificado, Ausente) y escribe el motivo de las justificaciones.",
    "pasos": [
      "Atajo: en tu \"Inicio\", la tarjeta \"Mis clases de hoy\" muestra las clases del día con los botones \"Tomar asistencia\" y \"QR\" — un toque y quedas en la lista (la clase se marca como realizada).",
      "También puedes entrar al detalle de la asignatura y hacer clic en la clase del día dentro del calendario de clases.",
      "Marca primero el estado de la clase: si fue realizada se abre la toma de asistencia; si fue cancelada o aplazada no se toma asistencia y los estudiantes no tienen falla.",
      "Arriba verás un resumen en vivo con cuántos van presentes, tarde, justificados y ausentes. Si tienes muchos estudiantes, usa el buscador para encontrar a alguien rápido.",
      "Marca a cada estudiante con los botones \"Presente\", \"Tarde\", \"Justificado\" o \"Ausente\" — o usa \"Todos presentes\" y ajusta solo las excepciones.",
      "Al marcar \"Justificado\" aparece el campo \"Motivo de la justificación\" (ej: incapacidad médica, calamidad doméstica). Para cualquier otro estado puedes agregar una nota con el botón del lápiz o \"+ Nota\".",
      "Selecciona el tipo de clase (teórica, taller, evaluación o laboratorio) y describe los temas tratados — ambos son obligatorios para guardar.",
      "Agrega observaciones de la clase si lo necesitas y presiona \"Guardar asistencia\". Los motivos y notas quedan guardados y salen en los reportes."
    ]
  },
  {
    "titulo": "Pasar lista con QR",
    "descripcion": "Proyecta un código QR en clase: tus estudiantes lo escanean con su celular y la lista se llena sola.",
    "pasos": [
      "Abre \"Tomar asistencia\" en la clase del día y presiona \"Pasar lista con QR\".",
      "Se abre un QR a pantalla completa (usa \"Pantalla completa\" para proyectarlo). El código cambia cada 20 segundos, así una foto vieja no sirve para marcar después.",
      "Tus estudiantes lo escanean con la cámara del celular o desde la app (\"Escanear QR\"). A la derecha ves en vivo cuántos y quiénes ya marcaron.",
      "Si la clase ya empezó, cambia a \"Los que escaneen desde ahora quedan como: Tarde\".",
      "Presiona \"Terminar y revisar\": el QR se cierra, quien escaneó queda presente o tarde y quien no, ausente (los justificados no se tocan).",
      "Revisa la lista, corrige lo que haga falta, completa el tipo de clase y los temas, y presiona \"Guardar asistencia\".",
      "Si cierras la pantalla del QR sin terminar, puedes volver a abrirla y continúa donde ibas."
    ]
  },
  {
    "titulo": "Actividades de clase",
    "descripcion": "Publica tareas, talleres y quizzes; tus estudiantes reciben el aviso, entregan desde la app y tú calificas con retroalimentación.",
    "pasos": [
      "Entra a \"Actividades\" desde el menú lateral (o con el botón \"Actividades\" en el detalle de una asignatura) y presiona \"Nueva actividad\".",
      "Elige la asignatura y el tipo (tarea, taller, quiz, lectura, exposición o proyecto; con \"Otro (escribir)\" pones tu propio tipo, como Laboratorio o Foro), escribe el título y las instrucciones, y adjunta un archivo (hasta 20 MB) o un enlace si lo necesitas.",
      "Opcional: en \"Para la clase\" liga la actividad a una clase de tu horario; ese día aparecerá en \"Mis clases de hoy\" de tu inicio.",
      "Marca \"Tiene fecha de entrega\" y elige el día en el calendario y la hora límite en el reloj. Indica si los estudiantes entregan por la app y si es calificable (con su nota máxima).",
      "Presiona \"Publicar\": tus estudiantes reciben una notificación al instante y un recordatorio 24 horas antes de la entrega si aún no han entregado.",
      "Para calificar, toca la actividad (o su botón \"Calificar\"): se abre la lista de estudiantes con quién entregó, quién entregó tarde y quién no; abre cada archivo o enlace, escribe la nota y la retroalimentación y presiona \"Calificar\". El estudiante recibe un aviso con su nota.",
      "También puedes calificar a quien no entregó por la app (por ejemplo, un quiz presencial): escribe su nota directamente en la lista.",
      "Filtra por una asignatura para ver el \"Seguimiento de estudiantes\": asistencia, actividades vencidas sin entregar y promedio de cada uno. Se marca en riesgo a quien tiene menos del 75% de asistencia o 2 o más actividades vencidas sin entregar."
    ]
  },
  {
    "titulo": "Clases virtuales",
    "descripcion": "Guarda el link de tu clase de Meet, Zoom o Teams: tus estudiantes se unen desde la app y su ingreso cuenta como asistencia.",
    "pasos": [
      "En una asignatura con modalidad \"Virtual\" o \"Híbrida\", entra al detalle y pega el link fijo en la tarjeta \"Link de la clase virtual\". Presiona \"Guardar link\".",
      "Si un día la reunión cambia, en \"Mis clases de hoy\" de tu inicio presiona \"Link de hoy\", pega el nuevo link y \"Publicar y avisar\": vale solo para ese día y todos tus estudiantes reciben el aviso.",
      "Antes de cada clase virtual, el recordatorio que reciben tus estudiantes les dice que es virtual y los lleva directo al botón \"Unirme\".",
      "Quien entra con \"Unirme\" desde 15 minutos antes y hasta 15 minutos después del inicio queda como presente; si entra más tarde, mientras dure la clase, queda como tarde.",
      "En \"Mis clases de hoy\" ves cuántos estudiantes ya entraron.",
      "Al \"Tomar asistencia\" de esa clase verás \"N estudiantes entraron a la clase virtual\": presiona \"Aplicar a la lista\" (quien entró queda presente o tarde y el resto ausente), revisa y guarda como siempre."
    ]
  },
  {
    "titulo": "Gestionar estudiantes",
    "descripcion": "Comparte el código de inscripción de tu asignatura o carga tu lista de estudiantes en bloque desde una plantilla.",
    "pasos": [
      "En el detalle de la asignatura, copia el \"Código de acceso\" del panel lateral y compártelo con tus estudiantes para que se inscriban por su cuenta.",
      "Si necesitas cambiarlo, usa \"Configurar\" para regenerar el código.",
      "Para inscribir a todo un grupo de una vez, presiona \"Cargar Excel/CSV\" y sube tu lista de estudiantes (descarga la plantilla para ver el formato). Las tildes y la ñ se leen bien tanto en Excel como en CSV.",
      "Revisa la lista de \"Estudiantes inscritos\" en el panel lateral para confirmar quién ya quedó vinculado."
    ]
  },
  {
    "titulo": "Generar reportes",
    "descripcion": "Consulta el resumen general o por estudiante, las justificaciones, y exporta todo a Excel o PDF con el formato institucional.",
    "pasos": [
      "Desde el detalle de la asignatura, presiona \"Reportes\".",
      "Filtra por año si necesitas acotar el periodo y revisa las tarjetas de resumen (clases dictadas, presentes, tarde, justificados, ausentes).",
      "Revisa las gráficas: distribución general por estado, ranking de asistencia por estudiante (en rojo quienes están por debajo del 75%) y la tendencia de asistencia clase por clase.",
      "Consulta la tabla \"Resumen por estudiante\" y la sección \"Justificaciones y observaciones\", con el motivo que escribiste para cada estudiante.",
      "Exporta el resumen general en Excel o PDF con los botones de la parte superior — las justificaciones salen en una tabla del PDF y en la hoja \"Justificaciones\" del Excel.",
      "Para el historial con el formato institucional, configura logo, código, versión y segunda firma una vez, y exporta el \"Excel institucional\" o \"PDF institucional\". El PDF usa la plantilla que guardaste en \"Premium\"."
    ]
  },
  {
    "titulo": "Plantillas de reporte",
    "descripcion": "Elige el diseño de tus reportes institucionales: formatos profesionales en blanco y negro para colegio o universidad.",
    "pasos": [
      "Entra a \"Premium\" desde el menú lateral — ahí está la página \"Plantillas de reporte\".",
      "En la pestaña \"Plantilla gratis\" tienes dos plantillas: \"Universidad · Institucional\" y \"Colegio · Planilla escolar\". Elige una, revisa la vista previa y presiona \"Guardar plantilla\".",
      "En la pestaña \"Plantilla Premium\" verás las 6 plantillas (Institucional, Planilla escolar, Acta oficial, Ejecutivo, Clásico y Moderno). Sin Premium, las 4 exclusivas aparecen con un candado.",
      "Con Premium, toca una plantilla para elegirla y presiona \"Configurar plantilla\" para ajustarla: tipo de institución, posición y tamaño del logo, título, subtítulo, segunda firma, secciones (arrastra para reordenar), tipo de tabla, columnas y tamaño de letra.",
      "Los cambios NO se guardan solos: cuando la vista previa te guste, presiona \"Guardar plantilla\" en la barra inferior. Si ves \"Tienes cambios sin guardar\", aún no se aplicaron.",
      "La plantilla marcada \"En uso\" es la que usan tus reportes institucionales en PDF y Excel.",
      "Plantilla por asignatura: arriba de la página, en \"¿Para qué asignaturas es esta plantilla?\", deja \"Plantilla general\" para todas o elige una asignatura. Configúrala y presiona \"Guardar para esta asignatura\": esa asignatura usará su propia plantilla (con su título y segunda firma) y las demás seguirán con la general.",
      "Para que una asignatura vuelva a la plantilla general, elígela en ese selector y presiona \"Usar la plantilla general\". En \"Reportes\" verás qué plantilla usa cada asignatura."
    ]
  },
  {
    "titulo": "Activar Premium",
    "descripcion": "Activa Premium con la prueba gratis o con un pago para usar todas las plantillas y configurarlas.",
    "pasos": [
      "Entra a \"Premium\" desde el menú lateral y ve a la pestaña \"Plantilla Premium\".",
      "Si nunca has usado Premium, presiona \"Solicitar prueba gratis de 1 mes\" — se activa al instante, sin esperar aprobación.",
      "Si ya usaste tu prueba, presiona \"Activar Premium\": verás los métodos de pago disponibles (Nequi, Bancolombia, etc.) y la referencia que debes escribir en el pago. Luego sube tu comprobante con el monto y la fecha — un administrador lo revisa y activa tu acceso.",
      "Premium incluye a Asis, tu asistente inteligente: consulta tus reportes y estudiantes en riesgo, y crea asignaturas, horarios y actividades por ti.",
      "Con Premium ya activo, puedes renovar tu plan mensual cuando quieras desde el botón \"Renovar\" — no hace falta esperar a que venza.",
      "Los avisos de aprobación, rechazo o vencimiento de Premium te llegan a \"Notificaciones\"."
    ]
  },
  {
    "titulo": "Notificaciones",
    "descripcion": "Revisa en un solo lugar los recordatorios de tus clases y los avisos de Premium y de tu cuenta.",
    "pasos": [
      "Entra a \"Notificaciones\" desde el menú lateral o toca la campana en la parte superior del panel — el número rojo indica cuántas tienes sin leer.",
      "Las notificaciones se agrupan por día (Hoy, Ayer...) y cada tipo tiene su color: Alertas, Clases, Premium y Cuenta. Usa los filtros \"Todas\", \"No leídas\" o por tipo.",
      "Recibirás una \"Alerta\" cuando un estudiante baje del 75% de asistencia en una de tus asignaturas (desde la 3.ª clase registrada), para que puedas hablar con él a tiempo. Si además tiene actividades vencidas sin entregar, la alerta te dice cuántas.",
      "Toca una notificación para marcarla como leída, o \"Ver →\" para ir a la sección relacionada. Con \"Marcar todas como leídas\" quedas al día de un toque, y con la \"×\" la eliminas.",
      "Para recibirlas también en tu celular o navegador (incluso con la app cerrada), activa \"Recordatorios de clase\" en la parte superior de Notificaciones o en \"Mi perfil\" y acepta el permiso del navegador.",
      "Cada dispositivo se activa por separado: si usas la app en el computador y en el celular, activa \"Recordatorios de clase\" en los dos. En iPhone funciona con la app instalada en la pantalla de inicio."
    ]
  },
  {
    "titulo": "Mi perfil y apariencia",
    "descripcion": "Actualiza tus datos, cambia tu contraseña, pide la verificación y elige el color y modo de tu panel.",
    "pasos": [
      "Entra a \"Mi perfil\" desde el menú lateral.",
      "Presiona \"Cambiar foto\" para elegir un avatar prediseñado o subir tu propia foto.",
      "Elige el tema de acento que se aplica al sidebar, botones y avatar de tu panel.",
      "Actualiza tus datos personales y presiona \"Guardar cambios\".",
      "En \"Verificación de cuenta\", presiona \"Solicitar verificación\" para pedir la insignia de verificado — tus estudiantes la verán junto a tu nombre al inscribirse.",
      "Para cambiar tu contraseña, usa la sección \"Cambiar contraseña\" al final de la página.",
      "Para cambiar la apariencia, usa el ícono de sol/luna en la parte superior del panel y elige Oscuro, Claro o Sistema (sigue el modo de tu computador o celular)."
    ]
  },
  {
    "titulo": "Asis, tu asistente",
    "descripcion": "Asis es tu asistente inteligente (incluido en Premium): responde tus preguntas, lee tus reportes y crea asignaturas, horarios y actividades por ti.",
    "pasos": [
      "Asis es parte de Premium: si no tienes Premium activo, verás a Asis con un candado. Tócalo y presiona \"Activar Premium\" (si nunca lo has usado, tienes 1 mes de prueba gratis). Para tus estudiantes Asis es gratis.",
      "Asis es la mascota (un búho, si no la cambias) que flota en la esquina inferior derecha de tu panel. Te saluda por tu nombre al entrar; tócala para abrir el chat.",
      "Pregúntale lo que necesites: \"¿Quién está en riesgo en Cálculo?\", \"Dame el reporte de asistencia de Física\", \"¿Qué clases tengo hoy?\" o \"¿Cómo paso lista con QR?\".",
      "También puede hacer cosas por ti: crear o editar una asignatura, agregar horarios y publicar actividades. Ej: \"Crea Física II, grupo A, periodo 2026-2, presencial, nivel 3, código FIS102\".",
      "Antes de cambiar algo, Asis te muestra una tarjeta con lo que va a hacer y los botones \"Confirmar\" y \"Cancelar\". Nada se cambia hasta que confirmas.",
      "Responde con tus propios datos y con tus mismos permisos: nadie puede ver la información de otro usuario a través de Asis.",
      "Tienes un número de preguntas por día. Si se acaban, o si hay muchas personas usando a Asis, sigue respondiendo con un modelo más liviano (verás \"Modo respaldo\" arriba del chat) y tu conversación no se pierde.",
      "Historial: tus conversaciones quedan guardadas. En el menú, \"Asis · asistente\" las muestra todas a la izquierda: toca una para verla y seguir donde quedaste, o bórrala con el ícono de la papelera. En el chat flotante usa el botón del reloj.",
      "Personaliza a Asis con el botón de la paleta: elige el animal (búho, gato, perro o pingüino) y su sonido (o \"Sin sonido\"), escúchalo con ▶ y presiona \"Guardar\". Tu elección queda en tu cuenta y la verás en todos tus dispositivos.",
      "Asis suena cuando te responde y cuando lo abres. Si prefieres silencio, elige \"Sin sonido\".",
      "Para cerrarlo, toca la \"×\" del chat o vuelve a tocar a Asis."
    ]
  },
  {
    "titulo": "Soporte",
    "descripcion": "¿Tienes un problema o una pregunta? Escríbenos desde tu panel y te respondemos por correo.",
    "pasos": [
      "Entra a \"Soporte\" desde el menú lateral.",
      "Tu correo ya viene puesto. Elige un tema (opcional), escribe el asunto y describe tu problema con el mayor detalle posible.",
      "Presiona \"Enviar mensaje\": te llega una copia de confirmación a tu correo y nuestro equipo te responde por ese medio.",
      "También puedes escribir directamente a soporte@controlasistencia.co."
    ]
  }
];
export const GUIA_ESTUDIANTE: TemaGuia[] = [
  {
    "titulo": "Iniciar sesión y recordar mis datos",
    "descripcion": "Entra con tu correo y contraseña y, si quieres, deja que tu navegador o celular los recuerde.",
    "pasos": [
      "En la pantalla de inicio de sesión elige \"Estudiante\", escribe tu correo y tu contraseña.",
      "Deja marcada la casilla \"Recordar mi correo y contraseña en este dispositivo\" y presiona \"Iniciar sesión\".",
      "Tu navegador o celular te ofrecerá guardar la contraseña (\"¿Guardar contraseña?\" en Chrome y Android, o el llavero en iPhone): acepta.",
      "La próxima vez tu correo aparecerá escrito y la contraseña se completará sola (en iPhone, toca el campo y elige la sugerida).",
      "Tu contraseña la guarda de forma segura tu navegador o celular, no ControlAsist. En un computador compartido, desmarca la casilla.",
      "¿Olvidaste tu contraseña? Toca \"¿Olvidaste tu contraseña?\", escribe tu correo y sigue el enlace que te llega."
    ]
  },
  {
    "titulo": "Inscribirme a una asignatura",
    "descripcion": "Ingresa el código que te compartió tu docente para unirte a su asignatura.",
    "pasos": [
      "Entra a \"Inscribirme\" desde tu inicio.",
      "Escribe el código de acceso que te compartió tu docente (empieza con el nombre y el código de la asignatura, ej. INGE-2720507-6PVL) y presiona \"Buscar\".",
      "Verifica que la asignatura encontrada sea la correcta (nombre, grupo y periodo) — verás la foto del docente y, si tiene la cuenta verificada, una insignia azul junto a su nombre.",
      "Presiona \"Inscribirme\". Si a tu perfil le faltan datos, completa tu documento, teléfono y programa.",
      "Presiona \"Confirmar inscripción\" — la asignatura quedará agregada a tu lista."
    ]
  },
  {
    "titulo": "Marcar asistencia con QR",
    "descripcion": "Cuando tu docente proyecte el QR de asistencia, escanéalo con tu celular para quedar presente al instante.",
    "pasos": [
      "Opción 1: abre la cámara de tu celular, apunta al QR y toca el enlace que aparece — se abre ControlAsist y tu asistencia queda registrada.",
      "Opción 2: dentro de la app, toca \"Escanear QR de asistencia\" en tu inicio (o \"Escanear QR\" en el menú), permite el uso de la cámara y apunta al código. En iPhone con la app instalada, usa esta opción.",
      "Si no tenías la sesión abierta, inicia sesión con tu cuenta de estudiante y volverás directo a marcar.",
      "Verás \"¡Asistencia registrada!\" con el nombre de la asignatura. Si dice \"El código ya cambió\", vuelve a escanear el que está en pantalla: el QR se renueva cada 20 segundos.",
      "Solo puedes marcar en asignaturas en las que estás inscrito y mientras tu docente tenga el QR abierto."
    ]
  },
  {
    "titulo": "Unirme a una clase virtual",
    "descripcion": "Entra a tus clases de Meet, Zoom o Teams desde la app: tu ingreso cuenta como asistencia.",
    "pasos": [
      "Si hoy tienes una clase virtual, en tu \"Inicio\" aparece la tarjeta \"Tus clases virtuales de hoy\".",
      "Desde 15 minutos antes de la clase, presiona \"Unirme a la clase\": se abre la reunión y tu asistencia queda registrada.",
      "Si entras hasta 15 minutos después del inicio quedas como presente; si entras más tarde, como tarde. Fuera del horario el botón abre la reunión, pero no cuenta como asistencia.",
      "Cuando tu docente publica el link del día o se acerca la clase, te llega una notificación: tócala y llegarás directo al botón \"Unirme\".",
      "También encuentras el botón \"Unirme\" en el detalle de la asignatura.",
      "Entra siempre con el botón de la app: si abres el link por otro lado, tu asistencia no queda registrada."
    ]
  },
  {
    "titulo": "Mis actividades",
    "descripcion": "Consulta las tareas y talleres de tus asignaturas, entrégalos desde la app y revisa tus notas.",
    "pasos": [
      "Entra a \"Mis actividades\" desde el menú lateral. Te llega una notificación cada vez que tu docente publica una actividad, y un recordatorio 24 horas antes de la entrega si aún no has entregado.",
      "En la pestaña \"Pendientes\" verás lo que debes entregar, ordenado por fecha y con cuánto tiempo te queda (ej: \"Vence en 3 h\").",
      "Toca una actividad para leer las instrucciones y descargar el archivo o abrir el enlace de tu docente.",
      "Para entregar, adjunta tu archivo (hasta 20 MB), pega un enlace (Drive, GitHub, video...) o escribe un comentario y presiona \"Enviar entrega\".",
      "Puedes cambiar tu entrega hasta que tu docente la califique. Si la fecha ya pasó, aún puedes entregar, pero quedará marcada como tarde.",
      "Cuando tu docente califique, te llega un aviso y verás tu nota y su retroalimentación en la actividad (pestaña \"Entregadas\")."
    ]
  },
  {
    "titulo": "Ver mis asignaturas y horario",
    "descripcion": "Desde \"Inicio\" consulta tu horario de la semana, tus asignaturas inscritas y el horario de cada una.",
    "pasos": [
      "En tu \"Inicio\", la tarjeta \"Mi horario de la semana\" reúne todas tus clases organizadas por día (de lunes a domingo) y por hora, con el color de cada asignatura y el aula. El día de hoy aparece resaltado.",
      "Desde \"Inicio\" verás una tarjeta por cada asignatura en la que estás inscrito, con su docente y modalidad.",
      "Haz clic en una tarjeta para ver su detalle: la foto y el nombre del docente (con insignia si está verificado), aula, créditos y sus horarios agrupados por día. Las sesiones de una sola fecha aparecen marcadas (ej: \"Solo el 24 oct\").",
      "Si ya no quieres seguir inscrito, puedes desinscribirte desde ese mismo detalle — podrás volver a inscribirte con el mismo código más adelante."
    ]
  },
  {
    "titulo": "Consultar mi asistencia",
    "descripcion": "Entra a \"Mi asistencia\" para ver tu porcentaje de asistencia y el detalle de cada clase, por asignatura.",
    "pasos": [
      "Entra a \"Mi asistencia\" desde el menú lateral.",
      "Verás una tarjeta por cada asignatura en la que estás inscrito, con tu porcentaje de clases presentes y un resumen por estado (presente, tarde, justificado, ausente).",
      "Haz clic en una tarjeta para abrir el detalle: una gráfica de barra con tu asistencia por estado, y la lista completa de tus clases con la fecha, el tipo de clase y el estado que te registraron en cada una."
    ]
  },
  {
    "titulo": "Notificaciones",
    "descripcion": "Revisa los recordatorios de tus clases en un solo lugar y recíbelos también en tu celular.",
    "pasos": [
      "Entra a \"Notificaciones\" desde el menú lateral o toca la campana en la parte superior — el número rojo indica cuántas tienes sin leer.",
      "Las notificaciones se agrupan por día (Hoy, Ayer...). Usa los filtros \"Todas\" o \"No leídas\".",
      "Si tu asistencia en una asignatura baja del 75%, te llega una \"Alerta\" de riesgo de pérdida por fallas con cuántas clases has faltado (y cuántas actividades vencidas tienes sin entregar) — revisa \"Mi asistencia\" y habla con tu docente.",
      "También te llegan avisos de actividades nuevas, recordatorios de entrega, notas de tus actividades y links de clases virtuales.",
      "Toca una notificación para marcarla como leída, usa \"Marcar todas como leídas\" para quedar al día, o la \"×\" para eliminarla.",
      "Para recibir los recordatorios en tu celular o navegador antes de cada clase (incluso con la app cerrada), activa \"Recordatorios de clase\" en la parte superior de Notificaciones o en \"Mi perfil\" y acepta el permiso del navegador.",
      "Cada dispositivo se activa por separado (computador y celular). En iPhone funciona con la app instalada en la pantalla de inicio."
    ]
  },
  {
    "titulo": "Mi perfil y apariencia",
    "descripcion": "Actualiza tus datos, cambia tu contraseña y elige el modo de tu panel.",
    "pasos": [
      "Entra a \"Mi perfil\" desde tu inicio o el menú lateral.",
      "Presiona \"Cambiar foto\" para elegir un avatar prediseñado o subir tu propia foto.",
      "Actualiza tus datos personales (documento, teléfono, programa, fecha de nacimiento, ciudad, dirección) y presiona \"Guardar cambios\".",
      "Para cambiar tu contraseña, usa la sección \"Cambiar contraseña\" al final de la página.",
      "Para cambiar la apariencia, usa el ícono de sol/luna en la parte superior del panel y elige Oscuro, Claro o Sistema."
    ]
  },
  {
    "titulo": "Asis, tu asistente",
    "descripcion": "Asis es tu asistente inteligente: te dice tus faltas, tu horario y tus actividades pendientes, y te explica cómo usar la app.",
    "pasos": [
      "Asis es la mascota (un búho, si no la cambias) que flota en la esquina inferior derecha de tu panel. Te saluda por tu nombre al entrar; tócala para abrir el chat.",
      "Pregúntale lo que necesites: \"¿Cuántas faltas tengo?\", \"¿Cuál es mi horario?\", \"¿Qué actividades tengo pendientes?\" o \"¿Cómo marco asistencia con el QR?\".",
      "Asis solo consulta tu información: para inscribirte o entregar una actividad te explica cómo hacerlo en la app.",
      "Responde con tus propios datos y con tus mismos permisos: nadie puede ver la información de otro usuario a través de Asis.",
      "Tienes un número de preguntas por día. Si se acaban, o si hay muchas personas usando a Asis, sigue respondiendo con un modelo más liviano (verás \"Modo respaldo\" arriba del chat) y tu conversación no se pierde.",
      "Historial: tus conversaciones quedan guardadas. En el menú, \"Asis · asistente\" las muestra todas a la izquierda: toca una para verla y seguir donde quedaste, o bórrala con el ícono de la papelera. En el chat flotante usa el botón del reloj.",
      "Personaliza a Asis con el botón de la paleta: elige el animal (búho, gato, perro o pingüino) y su sonido (o \"Sin sonido\"), escúchalo con ▶ y presiona \"Guardar\". Tu elección queda en tu cuenta y la verás en todos tus dispositivos.",
      "Asis suena cuando te responde y cuando lo abres. Si prefieres silencio, elige \"Sin sonido\".",
      "Para cerrarlo, toca la \"×\" del chat o vuelve a tocar a Asis."
    ]
  },
  {
    "titulo": "Soporte",
    "descripcion": "¿Tienes un problema o una pregunta? Escríbenos desde tu panel y te respondemos por correo.",
    "pasos": [
      "Entra a \"Soporte\" desde el menú lateral.",
      "Tu correo ya viene puesto. Elige un tema (opcional), escribe el asunto y describe tu problema.",
      "Presiona \"Enviar mensaje\": te llega una copia de confirmación a tu correo y te respondemos por ese medio.",
      "También puedes escribir directamente a soporte@controlasistencia.co."
    ]
  }
];
