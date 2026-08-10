-- Rediseño "dark vibrant SaaS": ícono temático por asignatura, elegido por el docente
-- junto al selector de color ya existente. Se guarda como identificador de texto simple
-- (ej. 'libro', 'calculadora') que el front mapea a un SVG inline curado — ver
-- src/app/shared/utils/subject-icons.ts. Se muestra grande en la tarjeta degradada.
alter table asignaturas
  add column if not exists icono text default 'libro';
