-- El admin no tenía forma de verificar a un docente directamente, solo de aprobar una solicitud
-- que el docente ya hubiera enviado — si nadie había pedido verificación, el admin no veía nada.
create or replace function admin_verificar_docente_manual(p_docente_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_id uuid;
begin
  select id into v_admin_id from administradores
  where user_id = auth.uid() and activo = true and puede_gestionar_docentes = true;
  if v_admin_id is null then
    raise exception 'No autorizado';
  end if;

  perform set_config('app.bypass_proteccion_docentes', 'on', true);
  update docentes set verificado = true, verificado_en = now() where id = p_docente_id;

  insert into notificaciones (usuario_id, tipo, titulo, cuerpo)
  select user_id, 'verificacion_aprobada', 'Tu cuenta fue verificada',
         'Ya tienes la insignia de docente verificado — tus estudiantes la verán al inscribirse.'
  from docentes where id = p_docente_id;
end;
$$;
