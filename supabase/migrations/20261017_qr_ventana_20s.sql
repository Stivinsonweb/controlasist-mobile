-- El QR de asistencia pasa de cambiar cada 10 s a cada 20 s (a los docentes se les hacía corto).
-- Se acepta la ventana actual y la anterior: cada código sirve hasta ~40 s.
--
-- TRANSICIÓN: también se aceptan los códigos de 10 s que genera la versión anterior de la app,
-- para que no falle a quien aún no la ha recargado. No debilita nada (un código de 10 s dura
-- menos que uno de 20 s). Se puede quitar (v_ventana_10) cuando todos tengan la versión nueva.
create or replace function marcar_asistencia_qr(p_sesion_id uuid, p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_sesion sesiones_qr%rowtype;
  v_ahora double precision := extract(epoch from clock_timestamp());
  v_ventana bigint := floor(v_ahora / 20);
  v_ventana_10 bigint := floor(v_ahora / 10);
  v_asignatura text;
  v_insertadas int;
begin
  if auth.uid() is null or not exists (select 1 from estudiantes where id = auth.uid()) then
    return jsonb_build_object('resultado', 'no-estudiante');
  end if;

  select * into v_sesion from sesiones_qr where id = p_sesion_id;
  if not found then
    return jsonb_build_object('resultado', 'no-encontrada');
  end if;
  select nombre into v_asignatura from asignaturas where id = v_sesion.asignatura_id;

  if not v_sesion.activa or v_sesion.expira_en <= now() then
    return jsonb_build_object('resultado', 'cerrada', 'asignatura', v_asignatura);
  end if;

  if lower(coalesce(p_token, '')) not in (
    token_qr(v_sesion.secreto, v_ventana), token_qr(v_sesion.secreto, v_ventana - 1),
    token_qr(v_sesion.secreto, v_ventana_10), token_qr(v_sesion.secreto, v_ventana_10 - 1)
  ) then
    return jsonb_build_object('resultado', 'vencido', 'asignatura', v_asignatura);
  end if;

  if not exists (
    select 1 from estudiantes_asignaturas
    where estudiante_id = auth.uid() and asignatura_id = v_sesion.asignatura_id and activo
  ) then
    return jsonb_build_object('resultado', 'no-inscrito', 'asignatura', v_asignatura);
  end if;

  insert into marcas_qr (sesion_id, estudiante_id, estado)
  values (v_sesion.id, auth.uid(), v_sesion.marcar_como)
  on conflict (sesion_id, estudiante_id) do nothing;
  get diagnostics v_insertadas = row_count;

  return jsonb_build_object(
    'resultado', case when v_insertadas = 1 then 'marcado' else 'ya-marcado' end,
    'asignatura', v_asignatura,
    'estado', (select estado from marcas_qr where sesion_id = v_sesion.id and estudiante_id = auth.uid())
  );
end;
$$;
