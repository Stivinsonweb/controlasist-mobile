-- Corrige impedir_doble_rol(): con un solo IF compuesto, PL/pgSQL evaluaba NEW.user_id también
-- al insertar en `estudiantes` (que no tiene esa columna) y fallaba con
-- 'record "new" has no field "user_id"'. Resultado: desde el 17-oct ningún estudiante podía
-- registrarse ni ser cargado. Con IF anidados solo se toca la columna de la tabla correcta.
create or replace function impedir_doble_rol()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_TABLE_NAME = 'docentes' then
    if exists (select 1 from estudiantes where id = NEW.user_id) then
      raise exception 'Esta cuenta ya está registrada como estudiante';
    end if;
  elsif TG_TABLE_NAME = 'estudiantes' then
    if exists (select 1 from docentes where user_id = NEW.id) then
      raise exception 'Esta cuenta ya está registrada como docente';
    end if;
  end if;
  return NEW;
end;
$$;
