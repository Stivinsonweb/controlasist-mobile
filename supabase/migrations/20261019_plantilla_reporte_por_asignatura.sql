-- Plantilla de reporte propia de una asignatura. Si es null, la asignatura usa la plantilla
-- general del docente (docentes.plantilla_reporte + formato_reporte_titulo/segunda_firma).
-- Forma del JSON: { titulo, segunda_firma, plantilla } — ver PlantillaAsignatura en
-- src/app/core/services/plantilla-reporte.model.ts.
alter table asignaturas
  add column if not exists plantilla_reporte jsonb;
