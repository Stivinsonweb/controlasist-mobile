-- Panel admin → Docentes: cuántos estudiantes (distintos, inscripciones activas en asignaturas activas)
-- y cuántas asignaturas activas tiene cada docente. Los admins no leen estudiantes_asignaturas por RLS,
-- así que la función es SECURITY DEFINER y solo devuelve conteos, previa verificación de admin.

create or replace function public.admin_conteo_estudiantes_por_docente()
returns table (docente_id uuid, total_estudiantes bigint, total_asignaturas bigint)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from administradores where user_id = auth.uid() and activo = true) then
    raise exception 'No autorizado';
  end if;

  return query
  select a.docente_id,
         count(distinct ea.estudiante_id) filter (where ea.activo) as total_estudiantes,
         count(distinct a.id) as total_asignaturas
  from asignaturas a
  left join estudiantes_asignaturas ea on ea.asignatura_id = a.id
  where a.activa = true
  group by a.docente_id;
end;
$$;

revoke execute on function public.admin_conteo_estudiantes_por_docente() from public, anon;
grant execute on function public.admin_conteo_estudiantes_por_docente() to authenticated;
