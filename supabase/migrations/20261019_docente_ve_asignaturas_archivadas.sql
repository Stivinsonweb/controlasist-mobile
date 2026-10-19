-- El docente debe poder ver sus asignaturas archivadas (activa = false): el inicio las muestra
-- marcadas como "Archivada" y desde su detalle se pueden reactivar. La política anterior
-- exigía activa = true, así que al desactivar una asignatura desaparecía por completo.
alter policy pol_asignaturas_select on asignaturas
  using (exists (
    select 1 from docentes
    where docentes.id = asignaturas.docente_id
      and docentes.user_id = auth.uid()
  ));
