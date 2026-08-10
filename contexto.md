CONTEXTO DEL PROYECTO: ControlAsist Web — Ronda de correcciones y mejoras

Ya migraste completo el proyecto (Tarea 1 diseño + Tarea 2 migración de todas las
páginas). Ahora ya probé el sitio real y encontré una lista de bugs, mejoras de UX,
y funcionalidades nuevas que hay que resolver. Además, ahora tienes conectado el MCP
de Supabase (usa las herramientas de supabase disponibles para consultar el esquema
real, verificar datos, y aplicar cambios en la base de datos cuando haga falta — no
asumas estructuras, consúltalas directo).

## LISTA DE CORRECCIONES Y MEJORAS

1. Los iconos del login no se ven bien — revísalos (tamaño, alineación, contraste)
   y corrígelos.

2. Los avatares de docentes y estudiantes no se están mostrando — revisa el campo
   foto_url en ambas tablas, cómo se está leyendo/mostrando, y si el bucket de
   Storage en Supabase tiene las políticas correctas de acceso público o firmado.

3. Los botones del perfil del docente no funcionan — es la página /admin/perfil
   (o la que corresponda a perfil de docente), revisa los handlers de los botones.

4. Mejorar la experiencia visual general docente/estudiante: agregar animaciones
   sutiles y un fondo temático de "libros/educación" en pantallas de auth y estados
   vacíos. Especificación:
   - Fondo: SVG con iconos educativos (libro abierto, birrete, lápiz, bombilla) en
     opacidad 4-6%, estilo línea (stroke, sin relleno) igual que los iconos del
     sidebar, distribuidos en grid irregular, solo en login/register y estados
     vacíos tipo "aún no tienes asignaturas". Sin librerías externas, SVG inline.
   - Animaciones nuevas en styles.scss: .card-hover (translate-y + shadow en hover
     para tarjetas), .check-pop (scale 0→1.15→1, ~250ms, para marcar asistencia),
     .modal-enter (scale 0.95+fade → scale 1, 200ms, para todos los modales),
     shimmer animado para los skeletons (reemplazar animate-pulse genérico).
   - Auditar que animate-fade-in / animate-slide-up (ya existentes) se apliquen
     de forma consistente en todas las páginas, no solo algunas.

5. Cuando un estudiante intenta inscribirse dos veces a la misma asignatura, sale
   un error crudo de "duplicate key" de Postgres. Debe mostrarse un mensaje claro
   tipo "Ya estás inscrito en esta asignatura" usando el ToastService, capturando
   el error de duplicado específicamente (código 23505 de Postgres) antes de que
   llegue crudo a la interfaz.

6. No se ven los filtros de periodo en el home del docente (deberían estar ahí,
   revisa por qué no se están mostrando o por qué no hay datos/periodos para filtrar).

7. Sale error al tomar asistencia — captura real del error:
   'null value in column "temas_tratados" of relation "asistencias" violates
   not-null constraint'
   La columna temas_tratados es NOT NULL en la tabla asistencias, pero el formulario
   de tomar asistencia no la está enviando (o el docente no la está llenando).
   Corrige el flujo: agrega el campo al formulario de tomar asistencia (o de crear
   el registro de clase) para que el docente lo complete, con validación antes de
   guardar, en vez de fallar en la base de datos con un mensaje críptico.

8. Mejorar el diseño de la página de detalle de asignatura del docente — jerarquía
   visual, espaciados, organización de las secciones (calendario, info general,
   horarios, código de acceso).

9. Nueva funcionalidad: permitir que el docente cargue estudiantes a su asignatura
   masivamente por archivo Excel o CSV, y el sistema los matricule automáticamente
   (crear en tabla estudiantes si no existen por cédula/email, e insertar en
   estudiantes_asignaturas). Usa la librería xlsx ya incluida en package.json para
   leer el archivo en el navegador. Diseña un formato de plantilla claro (columnas
   esperadas) y muestra un resumen de cuántos se matricularon exitosamente vs
   errores (duplicados, datos faltantes) antes de confirmar.

10. Debe existir un historial de clases dictadas por asignatura, con filtro por tipo
    de clase (ej: taller, teórica, evaluación, laboratorio — revisa si existe algún
    campo para esto en la tabla asistencias vía Supabase, o si hay que agregarlo).
    Consulta el esquema real antes de asumir.

11. El docente debe poder cambiar/corregir la asistencia ya registrada de un
    estudiante (editar registros_asistencia existentes, no solo crear nuevos), y
    al ver el detalle de una clase debe mostrarse un resumen: si fue evaluación,
    calificaciones asociadas si aplica, temas tratados, observaciones — no solo la
    lista de presente/ausente.

12. Agregar un pequeño crédito/atribución en el sitio (por ejemplo en el footer o
    en una sección "Acerca de") indicando que este programa fue desarrollado por
    Stivinson.

13. Limitar los intentos de inicio de sesión — después de varios intentos fallidos
    consecutivos con el mismo correo, bloquear temporalmente o mostrar advertencia
    (revisa si Supabase Auth ya maneja esto nativamente con rate limiting, o si
    hay que implementar un contador propio).

14. El botón de "recuperar contraseña" no funciona correctamente cuando se envía el
    correo — revisa el flujo completo de forgotPassword() en auth.service.ts y la
    página de reset-password. (Nota: ya se identificó antes que forgotPassword()
    no buscaba el correo en la tabla estudiantes, solo en docentes/administradores
    — confirma si eso ya quedó resuelto o si el problema es otro, como configuración
    de SMTP/email templates en el proyecto de Supabase, que puedes revisar con las
    herramientas de supabase si el MCP tiene acceso a esa configuración).

15. Mejorar experiencia del administrador + sistema de permisos real:
    - Las columnas puede_cerrar_app, puede_forzar_actualizacion,
      puede_gestionar_docentes, puede_ver_reportes, puede_modificar_config ya
      existen en la tabla administradores pero no se están usando.
    - Deben controlar qué ve y qué puede hacer cada administrador: ocultar/mostrar
      opciones del sidebar y acciones según estos flags.
    - puede_gestionar_docentes → acceso a crear/editar/desactivar docentes.
    - puede_ver_reportes → acceso a reportes/estadísticas.
    - puede_modificar_config → acceso a una pantalla de configuración del sistema
      (si no existe, crear una básica).
    - puede_cerrar_app / puede_forzar_actualizacion → redefinir su significado en
      el contexto web (ya no es app móvil Capacitor): por ejemplo, forzar
      actualización podría invalidar el service worker/PWA para que todos los
      usuarios reciban la última versión en su próxima visita.
    - Mejorar jerarquía visual del dashboard de admin, con accesos rápidos según
      permisos reales de cada administrador.

16. Verificación real contra la base de datos: ya tienes el MCP de supabase
    conectado. Úsalo para:
    - Consultar el esquema real de cualquier tabla antes de programar contra ella,
      en vez de asumir estructuras.
    - Si una funcionalidad requiere cambios en la base de datos (columna nueva,
      tabla nueva, política RLS), verifica si tienes permisos de escritura vía MCP;
      si los tienes, aplícalo directamente y documenta qué cambiaste; si no,
      dime exactamente qué SQL necesito correr yo manualmente.
    - Al terminar cada bloque de esta lista, además de `ng build` limpio, haz
      pruebas funcionales reales contra la base de datos (crear un registro de
      prueba, leerlo, editarlo, borrarlo cuando aplique) para confirmar que el
      flujo funciona de extremo a extremo, no solo que compila.

## CÓMO TRABAJAR

- Agrupa estos 16 puntos en bloques lógicos (ej: bugs críticos primero — 5, 7, 14,
  3, 6 — luego mejoras visuales — 1, 4, 8 — luego funcionalidades nuevas — 9, 10,
  11, 15 — y cierra con 2, 12, 13, 16 donde corresponda).
- Antes de escribir código para cualquier punto que dependa de la base de datos,
  usa el MCP de supabase para confirmar el esquema real.
- Como no tienes herramientas de navegador conectadas en este entorno (a menos que
  también hayas configurado Claude in Chrome), la verificación visual sigue
  dependiendo de que yo pruebe en localhost:4200 — avísame con mensajes claros qué
  bloque terminaste y qué debo revisar específicamente en cada uno.
- Corre `ng build` limpio (cero errores/warnings) después de cada bloque.
- No te detengas a preguntarme entre cada punto — trabaja de corrido por todos los
  bloques. Solo deténte si encuentras algo que realmente no puedas resolver solo
  (ambigüedad real de negocio, falta de acceso a algo, decisión de diseño que
  necesite mi input).
- Al terminar todo, dame un resumen punto por punto (1 al 16) confirmando qué se
  resolvió y qué necesito probar yo mismo en el navegador.