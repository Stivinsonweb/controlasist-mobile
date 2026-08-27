-- La prueba gratis de Premium ya no necesita aprobación del admin — se activa al instante cuando
-- el docente la pide. Al vencer (30 días), el sistema la desactiva solo (ver
-- premium_revisar_vencimientos_diario) y el docente debe pagar (mensual o anual, el que haya
-- elegido al subir su comprobante) para seguir con Premium — ESE paso sigue revisándolo el admin,
-- porque ahí sí hay que confirmar que el pago realmente llegó.
create or replace function docente_activar_prueba_gratis(p_docente_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ya_uso_prueba boolean;
  v_es_dueno boolean;
begin
  select (user_id = auth.uid()), premium_prueba_utilizada
    into v_es_dueno, v_ya_uso_prueba
  from docentes where id = p_docente_id
  for update;

  if v_es_dueno is null then
    raise exception 'Docente no encontrado';
  end if;
  if not v_es_dueno then
    raise exception 'No autorizado';
  end if;
  if v_ya_uso_prueba then
    raise exception 'Ya usaste tu prueba gratis anteriormente';
  end if;

  insert into solicitudes_premium (docente_id, estado, revisado_por, fecha_revision)
  values (p_docente_id, 'aprobada', null, now());

  perform set_config('app.bypass_proteccion_docentes', 'on', true);
  update docentes
  set premium_activo = true,
      premium_fuente = 'prueba',
      premium_es_prueba = true,
      premium_prueba_utilizada = true,
      premium_fecha_inicio = now(),
      premium_fecha_vencimiento = now() + interval '30 days',
      premium_aviso_vencimiento_enviado = false
  where id = p_docente_id;

  insert into notificaciones (usuario_id, tipo, titulo, cuerpo)
  select user_id, 'premium_solicitud_aprobada', '¡Tu prueba gratis de Premium ya está activa!',
         'Tienes acceso por 30 días. Al terminar, sube tu comprobante de pago (mensual o anual) para seguir disfrutando Premium.'
  from docentes where id = p_docente_id;
end;
$$;
