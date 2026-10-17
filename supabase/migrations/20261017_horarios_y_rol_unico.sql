-- ===== 1. Horarios =====
-- `estudiantes_ven_horarios` (USING true) dejaba a cualquier usuario con sesión ver los horarios
-- de todas las asignaturas. Ahora el estudiante solo ve los de asignaturas en las que está
-- inscrito (estudiante_inscrito_en es SECURITY DEFINER para no generar recursión de políticas).
drop policy if exists estudiantes_ven_horarios on horarios;
create policy estudiantes_ven_horarios on horarios
  for select to authenticated
  using (estudiante_inscrito_en(asignatura_id));

-- ===== 2. Una cuenta, un rol =====
-- Una misma cuenta de Auth no puede ser docente y estudiante a la vez.
create or replace function impedir_doble_rol()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_TABLE_NAME = 'docentes' and exists (select 1 from estudiantes where id = NEW.user_id) then
    raise exception 'Esta cuenta ya está registrada como estudiante';
  end if;
  if TG_TABLE_NAME = 'estudiantes' and exists (select 1 from docentes where user_id = NEW.id) then
    raise exception 'Esta cuenta ya está registrada como docente';
  end if;
  return NEW;
end;
$$;

drop trigger if exists trigger_impedir_doble_rol on docentes;
create trigger trigger_impedir_doble_rol
  before insert or update of user_id on docentes
  for each row execute function impedir_doble_rol();

drop trigger if exists trigger_impedir_doble_rol on estudiantes;
create trigger trigger_impedir_doble_rol
  before insert or update of id on estudiantes
  for each row execute function impedir_doble_rol();
