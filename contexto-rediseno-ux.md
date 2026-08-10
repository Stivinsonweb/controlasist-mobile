CONTEXTO: Rediseño profesional de ControlAsist Web — dirección de un ingeniero UX/UI

Actúa como un ingeniero de diseño UX/UI senior revisando este producto con ojo crítico
de portafolio profesional, no solo como alguien que aplica clases de Tailwind. El
diseño actual es funcional pero se ve genérico / plantilla — necesito que lo eleves a
un nivel de producto SaaS premium real, con personalidad propia y sensación de marca
cuidada, sin perder la identidad de marca ya establecida (verde primary #10b981 / azul
secondary #3b82f6, fuente Inter).

## DIRECCIÓN DE DISEÑO: "Dark vibrant SaaS" — inspirado en referencia visual real

El usuario proporcionó una imagen de referencia de un producto SaaS con este estilo
exacto (descríbelo así porque no puedes ver la imagen, pero esta es la especificación
extraída de ella):

- Fondo base oscuro tipo navy casi negro (no negro puro, algo como #0a0e17 o similar),
  no blanco — esto es un giro importante respecto a lo que había antes.
- Tarjetas flotantes con degradados vibrantes de 2 colores cada una — NO todas del
  mismo color, cada tarjeta/asignatura con su propio degradado (ej. púrpura→azul,
  ámbar→naranja, verde→teal), usando la paleta de marca (primary verde, secondary
  azul) como base pero permitiendo variaciones vibrantes derivadas de esos tonos por
  asignatura.
- Sensación de profundidad por capas: tarjetas ligeramente superpuestas o con leve
  rotación (1-3 grados) entre sí en composiciones tipo dashboard/hero, con sombras
  profundas y coloreadas (el color de sombra combina con el color de la tarjeta, no
  gris/negro genérico).
- Formas orgánicas decorativas de fondo: blobs/esferas con gradiente y blur, flotando
  sutilmente detrás del contenido principal (en login, dashboard, hero de estados
  vacíos) — bajo protagonismo, dan ambiente sin distraer.
- Texto con gradiente aplicado a palabras clave dentro de títulos grandes (ej. en el
  login "Control de asistencia, sin fricción" — la palabra clave lleva gradiente
  verde→azul en vez de color plano).
- Bordes muy redondeados en todo (rounded-2xl a rounded-3xl), nada de esquinas duras.
- Micro-elementos flotantes tipo badge/pill con su propia sombra, superpuestos sobre
  las tarjetas principales (por ejemplo, un badge pequeño de "código de acceso" o
  "próxima clase" flotando sobre la esquina de una tarjeta de asignatura).
- Avatares en círculos con borde de color (coincidente con el tema del usuario),
  agrupados en clusters cuando se muestran varios (ej. estudiantes inscritos).
- Gráficos de datos (asistencia, estadísticas) con líneas/barras que usan el mismo
  lenguaje de degradados vibrantes, no colores planos.

### Aplicación práctica por pantalla
- Login/Register: fondo oscuro con blobs decorativos de fondo, panel de formulario
  puede mantenerse en una tarjeta clara/semi-clara flotando sobre el fondo oscuro
  para mantener legibilidad del formulario (contraste alto para los inputs), pero el
  entorno alrededor sigue el lenguaje oscuro+vibrante.
- Dashboard/Home: tarjetas de estadísticas y asignaturas con degradados vibrantes
  individuales, ligera superposición/rotación en la composición si aplica.
- Tarjetas de asignatura: cada una con su degradado propio (derivado del campo color
  ya existente + el nuevo campo icono), ocupando toda la tarjeta no solo una franja.
- Tablas de datos (docentes, estudiantes, reportes): mantén legibilidad alta — en
  contenido denso de datos no fuerces el mismo nivel de decoración que en dashboards/
  tarjetas, pero sí usa el fondo oscuro y acentos vibrantes en headers/badges de
  estado.
- Verifica contraste de accesibilidad (WCAG AA mínimo) en todo texto sobre fondos
  oscuros y sobre degradados — es fácil que este estilo sacrifique legibilidad, no lo
  permitas.

### Sistema de tarjetas de asignatura — personalización real (prioridad alta)
Las asignaturas ya tienen un campo `color` en la base de datos. Debe convertirse en
el elemento central de identidad visual, siguiendo el lenguaje "dark vibrant" de
arriba:
- La tarjeta completa lleva el degradado vibrante de 2 tonos derivado de ese color
  como fondo COMPLETO (no solo un punto ni una franja), con texto en blanco/alto
  contraste sobre él.
- Agrega un campo nuevo `icono` (emoji o nombre de ícono) a la tabla asignaturas para
  que el docente elija un símbolo temático por asignatura — se muestra grande y
  visible en la tarjeta.
- Al hacer hover: leve escala (scale-[1.02]) + sombra más profunda del MISMO tono de
  color de esa asignatura.
- Formulario de crear/editar asignatura: agrega el selector de ícono junto al
  selector de color que ya existe.

### Personalización real para el usuario (nueva funcionalidad de perfil)
- El docente puede elegir un "tema de acento" para todo su panel desde su perfil —
  4-5 paletas predefinidas curadas de degradados vibrantes (no un color picker
  libre), que cambian los tonos de acento de toda su interfaz vía CSS custom
  properties / variables dinámicas.
- Avatar con marco/borde de color personalizable coincidiendo con el tema elegido.

## PENDIENTES DE RONDAS ANTERIORES — verificar y cerrar en esta misma sesión

Antes o en paralelo al rediseño, confirma el estado real de estos tres temas que
quedaron en curso:

1. **Banner de instalación PWA no aparece + falta botón manual**: diagnostica si es
   porque estamos probando con `ng serve`/`npm start` (el Service Worker de Angular
   no se activa en modo desarrollo, solo en build de producción) — si es así,
   confírmamelo y dime exactamente cómo probarlo bien (ng build + servir el dist/, o
   similar). Revisa también sessionStorage por la clave 'pwa-dismissed' de pruebas
   anteriores, y que el manifest.webmanifest cumpla los requisitos (name, icons
   192/512, start_url, display standalone).

   ADEMÁS de arreglar el banner automático (beforeinstallprompt), agrega un BOTÓN
   MANUAL de "Instalar app" visible permanentemente en el sidebar/header (no solo el
   banner que aparece y se puede descartar) para que el usuario pueda instalarla
   cuando quiera, no solo en el momento que el navegador decide mostrar el banner.
   - Si el navegador soporta beforeinstallprompt (Chrome/Edge Android/desktop): el
     botón dispara el mismo prompt guardado del evento.
   - Si el botón se hace clic pero el navegador es Safari/iOS (que NO soporta
     beforeinstallprompt de forma nativa): muestra un modal con instrucciones
     manuales paso a paso ("Toca el botón Compartir → Agregar a pantalla de inicio"),
     con captura o ilustración simple del ícono de Compartir de iOS para que sea
     claro incluso para alguien no técnico.
   - Si la app ya está instalada (detectable vía `window.matchMedia('(display-mode:
     standalone)').matches`), oculta el botón o cámbialo a un estado "✓ Instalada".

2. **Formato institucional de reportes (PDF/Excel tipo D-FO-005)**: si el MCP de
   Supabase ya está reconectado, aplica la migración
   20260731_formato_institucional_reportes.sql, crea el bucket
   logos-institucionales con políticas, y confirma que reportes.page.ts/html
   generan el PDF y Excel correctamente con datos reales.

   ADEMÁS, el formato actual de los reportes (tanto el D-FO-005 como cualquier otro
   reporte exportable del proyecto — listas de asistencia, estadísticas, etc.) se ve
   muy básico y necesita verse profesional. Mejoras específicas a aplicar en TODOS
   los PDF/Excel exportables del proyecto:

   PDF (jspdf/jspdf-autotable):
   - Encabezado con el logo institucional bien posicionado y con buena resolución,
     no descuadrado ni pixelado.
   - Tipografía consistente y jerarquizada (título grande y en negrita, subtítulos
     medianos, cuerpo de tabla legible) — nada de todo el mismo tamaño de fuente.
   - Colores de marca aplicados con criterio: encabezados de tabla con fondo de color
     (verde/azul de marca) y texto blanco, filas alternadas con fondo muy sutil
     (zebra striping) para facilitar lectura de tablas largas.
   - Pie de página consistente en todas las páginas: número de página, fecha de
     generación del reporte, y el logo pequeño si aplica.
   - Márgenes y espaciado generosos, no comprimido de borde a borde.
   - Si el reporte tiene múltiples secciones (ej: resumen + detalle), sepáralas
     visualmente con títulos de sección claros, no solo tablas pegadas una tras otra.

   Excel (xlsx):
   - Encabezados de columna con formato (negrita, fondo de color, texto blanco/alto
     contraste) usando las capacidades de estilo que soporta la librería xlsx, no
     texto plano sin formato.
   - Anchos de columna ajustados automáticamente al contenido (autofit), no columnas
     genéricas todas del mismo ancho que cortan el texto.
   - Congela la fila de encabezado (freeze panes) para que se mantenga visible al
     hacer scroll en reportes largos.
   - Si aplica, usa formato de celda apropiado por tipo de dato (fechas como fecha,
     porcentajes como porcentaje, no todo como texto plano).

   Aplica esta mejora de formato a CUALQUIER exportación existente en el proyecto,
   no solo al formato institucional D-FO-005 — revisa si hay otros reportes/
   exportaciones ya construidos en rondas anteriores y llévalos al mismo nivel de
   calidad visual.

3. **Carga masiva de estudiantes con creación de cuenta real (Edge Function
   matricular-estudiantes-masivo)**: si el MCP ya está reconectado, despliega la
   Edge Function con el secret de service_role, y prueba de extremo a extremo que
   cree la cuenta, inserte en estudiantes, matricule en estudiantes_asignaturas, y
   revierta bien si algo falla a mitad de camino.

4. **Recuperar contraseña no funciona**: el correo de recuperación SÍ llega a la
   bandeja de entrada, pero algo falla después de eso — el flujo no completa
   correctamente (no puedo definir la nueva contraseña, o el link no lleva a donde
   debería, o falla al guardar). Diagnostica el flujo completo de extremo a extremo:
   - Revisa la ruta /auth/reset-password y su componente: ¿existe implementado de
     verdad, o sigue siendo el PlaceholderPage de rondas anteriores?
   - Revisa que el redirectTo configurado en authService.forgotPassword() apunte
     correctamente a esa ruta real de la app en producción/desarrollo.
   - Revisa que updatePassword() en auth.service.ts se esté invocando correctamente
     desde esa página, con la sesión de recuperación activa que Supabase crea al
     hacer clic en el link del correo (Supabase requiere que el usuario "aterrice"
     en una sesión temporal válida antes de poder llamar a updateUser con la nueva
     contraseña — confirma que ese manejo de sesión esté bien hecho).
   - Prueba el flujo completo tú mismo si tienes forma de hacerlo, y si no puedes
     probar el correo real desde tu entorno, dime exactamente qué SÍ verificaste por
     código y qué me toca probar a mí manualmente.
   Corrige lo que encuentres y déjalo funcionando de extremo a extremo, no solo
   parcialmente.

Si alguno de estos cuatro ya quedó resuelto y verificado en una sesión anterior, solo
confírmamelo brevemente en tu resumen inicial y no repitas el trabajo.

## SECCIÓN "PREMIUM" — placeholder deshabilitado, para trabajar más adelante

Agrega el andamiaje visual y estructural para un futuro sistema de funciones premium,
pero SIN implementar la lógica de pago todavía (eso lo trabajaremos después). Por
ahora:

- Agrega una entrada "Premium" (o similar) en el sidebar/menú, visible pero con un
  ícono de candado 🔒 junto al nombre, indicando que es una función bloqueada/próxima.
- Al hacer clic, muestra una pantalla simple tipo "Próximamente" explicando que ahí
  vivirán funciones avanzadas (reportes avanzados, notificaciones, etc. — puedes
  dejarlo genérico por ahora, ya definiremos el detalle exacto después).
- Agrega un flag de control simple y centralizado (por ejemplo, una constante
  `PREMIUM_ENABLED = false` en un archivo de configuración, o una columna booleana en
  `configuracion_app` si prefieres que sea controlable desde base de datos sin
  necesidad de nuevo deploy) que yo pueda cambiar a `true` cuando esté listo para
  habilitar la sección de verdad — mientras esté en `false`, el candado se mantiene y
  la pantalla sigue siendo el placeholder "Próximamente".
- No implementes lógica de pago, pasarela, ni restricciones reales de funciones
  todavía — es solo la base visual y el interruptor para activarlo después.

## CÓMO TRABAJAR
- Antes de tocar código, dame primero una propuesta breve por escrito confirmando que
  entendiste la dirección "dark vibrant SaaS" (no hace falta que apruebe cada
  detalle, pero sí quiero ver que tienes claro el concepto antes de aplicar cambios
  masivos a todo el proyecto).
- APLICA EL REDISEÑO EN ABSOLUTAMENTE TODAS LAS PANTALLAS DEL PROYECTO, sin dejar
  ninguna con el look anterior. Lista explícita de lo que debe quedar cubierto:
  - Login y Register
  - Layout general (sidebar, header) — el fondo oscuro y estilo debe ser la base de
    toda la aplicación, no solo de páginas sueltas
  - Dashboard de administrador
  - Home del docente (lista de asignaturas) y Home del estudiante
  - Crear / Detalle / Editar asignatura
  - Admin: docentes, estudiantes, estadísticas, perfil
  - Perfil del docente y del estudiante
  - Toma de asistencia / estado de clase / calendario semanal
  - Reportes (incluyendo el formato institucional PDF/Excel que ya se construyó —
    ese exportable en sí puede mantenerse claro/imprimible ya que es un documento
    formal, pero la PANTALLA desde donde se genera sí debe seguir el nuevo estilo)
  - Registro de estudiante, inscripción, datos de inscripción
  - Cualquier modal, toast, y estado vacío del proyecto
  - El nuevo botón de instalar PWA (ver arriba)
  - La nueva entrada "Premium" con candado y su pantalla "Próximamente" (ver sección
    dedicada más abajo)
- Actualiza las clases utilitarias base en styles.scss (.card, .btn-primary,
  .input-field, etc.) para que el nuevo sistema se propague automáticamente en vez de
  editar componente por componente donde sea posible. Define las variables de color
  oscuro/degradados como CSS custom properties reutilizables desde el inicio.
- Verifica accesibilidad de contraste (WCAG AA) en cada pantalla nueva, especialmente
  texto sobre fondos oscuros y sobre degradados — no lo dejes para el final, revísalo
  pantalla por pantalla mientras avanzas.
- Corre ng build después de cada bloque de pantallas rediseñadas para confirmar que
  compila limpio.
- Al terminar, dame un resumen de qué pantallas quedaron con el nuevo sistema
  (idealmente todas, según la lista de arriba) y confirma explícitamente que no
  quedó ninguna pantalla con el diseño anterior.

Trabaja de corrido por bloques (ej: sistema base de estilos + variables de color
primero, luego layout general, luego login/register, luego el resto pantalla por
pantalla siguiendo la lista de arriba, luego botón de instalar PWA y personalización
de tema), sin detenerte a preguntar en cada pantalla individual.
