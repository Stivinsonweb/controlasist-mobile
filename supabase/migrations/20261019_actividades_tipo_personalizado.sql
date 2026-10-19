-- Tipo de actividad escrito por el docente (cuando elige "Otro"): p. ej. "Laboratorio", "Foro".
alter table actividades add column if not exists tipo_personalizado text
  check (tipo_personalizado is null or length(trim(tipo_personalizado)) between 1 and 40);
