-- La cédula se guarda siempre sin separadores ("1.020.345.678" -> "1020345678"), venga de donde
-- venga (formularios, carga masiva Excel/CSV, panel de administración). Se quitan puntos, comas,
-- espacios y guiones; se conservan letras (pasaportes) en mayúscula. Misma regla que
-- limpiarDocumento() en src/app/shared/utils/documento.util.ts.
create or replace function limpiar_cedula_estudiante()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if NEW.cedula is not null then
    NEW.cedula := nullif(upper(regexp_replace(NEW.cedula, '[.,[:space:]-]', '', 'g')), '');
  end if;
  return NEW;
end;
$$;

drop trigger if exists trigger_limpiar_cedula_estudiante on estudiantes;
create trigger trigger_limpiar_cedula_estudiante
  before insert or update of cedula on estudiantes
  for each row execute function limpiar_cedula_estudiante();
