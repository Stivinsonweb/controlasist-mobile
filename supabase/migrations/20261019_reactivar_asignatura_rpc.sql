-- Permite al docente reactivar una asignatura que había desactivado (archivado).
-- Mismo patrón que desactivar_asignatura: valida que pertenezca al docente autenticado.
create or replace function reactivar_asignatura(asignatura_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update asignaturas
  set activa = true,
      updated_at = now()
  where id = asignatura_id
    and exists (
      select 1 from docentes
      where docentes.id = asignaturas.docente_id
        and docentes.user_id = auth.uid()
    );

  if not found then
    raise exception 'Asignatura no encontrada o no pertenece al docente autenticado';
  end if;
end;
$$;

grant execute on function reactivar_asignatura(uuid) to authenticated;
