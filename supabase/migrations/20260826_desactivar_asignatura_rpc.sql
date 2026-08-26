-- Corrige el bug bloqueante de archivar/desactivar asignatura.
--
-- Causa raíz: la política pol_asignaturas_update solo tenía USING (qué filas puede
-- tocar el docente) pero le faltaba WITH CHECK (que la fila resultante también
-- cumpla la regla) -> Postgres rechazaba el UPDATE con
-- "new row violates row-level security policy for table asignaturas".
alter policy pol_asignaturas_update on asignaturas
  with check (exists (
    select 1 from docentes
    where docentes.id = asignaturas.docente_id
      and docentes.user_id = auth.uid()
  ));

-- RPC usado por AsignaturasService.desactivar(): valida que la asignatura pertenezca
-- al docente autenticado y la marca como inactiva. SECURITY DEFINER para no depender
-- únicamente de la policy de UPDATE desde el cliente.
create or replace function desactivar_asignatura(asignatura_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update asignaturas
  set activa = false,
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

grant execute on function desactivar_asignatura(uuid) to authenticated;
