-- Premium: editor de plantillas de reportes (Parte 1). Config del docente para el editor
-- visual — logo (posición/tamaño), orden y activación de secciones opcionales, y el texto
-- de la sección "Observaciones generales" cuando está activa. El título del formato y la
-- segunda firma reutilizan las columnas ya existentes (formato_reporte_titulo /
-- formato_reporte_segunda_firma) en vez de duplicarlas aquí.
-- Ver src/app/core/services/plantilla-reporte.model.ts para la forma exacta del JSON.
alter table docentes
  add column if not exists plantilla_reporte jsonb;
