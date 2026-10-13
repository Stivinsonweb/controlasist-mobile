-- Cuando el admin activa Premium a un docente (Admin → Docentes → "Activar Premium"), el docente
-- recibe un aviso in-app y push. Premium otorgado por el admin no vence hasta que se quite.

create or replace function public.admin_otorgar_premium_manual(p_docente_id uuid)
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
  update docentes
  set premium_activo = true,
      premium_fuente = 'admin',
      premium_es_prueba = false,
      premium_fecha_inicio = coalesce(premium_fecha_inicio, now()),
      premium_fecha_vencimiento = null
  where id = p_docente_id;

  insert into notificaciones (usuario_id, tipo, titulo, cuerpo)
  select user_id, 'premium_otorgado', '¡Tu cuenta ahora es Premium!',
         'Un administrador activó Premium en tu cuenta. Ya puedes personalizar tu plantilla de reportes.'
  from docentes where id = p_docente_id;
end;
$$;
