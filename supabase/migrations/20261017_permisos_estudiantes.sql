-- Restringe a los docentes a SUS estudiantes (los inscritos en alguna de sus asignaturas).
-- Antes cualquier docente podía ver, editar, crear y borrar cualquier fila de `estudiantes`.
--
-- Se mantienen: docentes_ven_sus_estudiantes (SELECT), estudiantes_select/insert/update (el
-- propio estudiante) y las políticas de administradores. La carga masiva usa service role
-- desde la Edge Function, así que no necesita políticas de INSERT para docentes.

drop policy if exists "Docentes pueden ver estudiantes" on estudiantes;
drop policy if exists "Docentes pueden actualizar estudiantes" on estudiantes;
drop policy if exists "Docentes pueden crear estudiantes" on estudiantes;
drop policy if exists "Docentes pueden eliminar estudiantes" on estudiantes;
-- Comparaba asignaturas.docente_id (id de docentes) con auth.uid() (id de Auth): nunca se cumplía.
drop policy if exists "estudiantes_delete" on estudiantes;

-- El docente edita (p. ej. las observaciones) solo a estudiantes inscritos en sus asignaturas.
create policy docentes_actualizan_sus_estudiantes on estudiantes
  for update to authenticated
  using (
    exists (
      select 1
      from estudiantes_asignaturas ea
      join asignaturas a on a.id = ea.asignatura_id
      join docentes d on d.id = a.docente_id
      where ea.estudiante_id = estudiantes.id and d.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from estudiantes_asignaturas ea
      join asignaturas a on a.id = ea.asignatura_id
      join docentes d on d.id = a.docente_id
      where ea.estudiante_id = estudiantes.id and d.user_id = auth.uid()
    )
  );
