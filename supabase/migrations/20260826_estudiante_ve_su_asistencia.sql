-- [FALTA 2] El estudiante no tiene dónde ver su propia asistencia.
--
-- Ya existía la policy `estudiantes_ven_sus_registros_asistencia` (estudiante_id = auth.uid())
-- sobre `registros_asistencia`, pero para mostrar la fecha/tipo de cada clase hace falta poder
-- leer también la fila de `asistencias` (la clase dictada) asociada — y ahí solo había policies
-- para el docente dueño. Sin esto, cualquier select anidado `registros_asistencia -> asistencias`
-- desde el estudiante devuelve el campo embebido en null por RLS.
--
-- OJO: una policy en `asistencias` que referencia directamente `registros_asistencia` en su USING
-- genera recursión infinita, porque las policies de `registros_asistencia` (para el docente) a su
-- vez consultan `asistencias`. Se resuelve con una función SECURITY DEFINER que hace el chequeo
-- sin volver a disparar RLS.
create or replace function estudiante_tiene_registro(p_asistencia_id uuid, p_estudiante_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from registros_asistencia
    where asistencia_id = p_asistencia_id
      and estudiante_id = p_estudiante_id
  );
$$;

create policy estudiantes_ven_asistencias_de_sus_registros on asistencias
for select
using (estudiante_tiene_registro(id, auth.uid()));
