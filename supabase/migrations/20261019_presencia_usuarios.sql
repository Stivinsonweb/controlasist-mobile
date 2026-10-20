-- Quién está en línea: mientras la app está abierta y visible, cada usuario marca su actividad
-- (cada minuto) con la sección en la que está. Solo los administradores pueden leerlo.
-- "En línea" = actividad en los últimos 2 minutos (lo decide la consulta del panel).
create table if not exists presencia_usuarios (
  usuario_id uuid primary key,
  rol text not null check (rol in ('docente', 'estudiante', 'administrador')),
  nombre text not null,
  seccion text,
  dispositivo text,
  ultima_actividad timestamptz not null default now(),
  conectado_desde timestamptz not null default now()
);
create index if not exists presencia_usuarios_actividad_idx on presencia_usuarios (ultima_actividad desc);

alter table presencia_usuarios enable row level security;

drop policy if exists admin_ve_presencia on presencia_usuarios;
create policy admin_ve_presencia on presencia_usuarios for select to authenticated
  using (es_administrador_activo());

-- El nombre y el rol salen de las tablas reales (el cliente solo dice en qué sección está).
create or replace function registrar_presencia(p_seccion text, p_dispositivo text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rol text;
  v_nombre text;
begin
  if auth.uid() is null then
    return;
  end if;

  select 'docente', trim(nombres || ' ' || apellidos) into v_rol, v_nombre from docentes where user_id = auth.uid();
  if v_rol is null then
    select 'estudiante', trim(nombres || ' ' || apellidos) into v_rol, v_nombre from estudiantes where id = auth.uid();
  end if;
  if v_rol is null then
    select 'administrador', trim(nombres || ' ' || apellidos) into v_rol, v_nombre from administradores where user_id = auth.uid();
  end if;
  if v_rol is null then
    return;
  end if;

  insert into presencia_usuarios (usuario_id, rol, nombre, seccion, dispositivo)
  values (auth.uid(), v_rol, coalesce(nullif(v_nombre, ''), 'Sin nombre'), left(p_seccion, 60), left(p_dispositivo, 20))
  on conflict (usuario_id) do update set
    rol = excluded.rol,
    nombre = excluded.nombre,
    seccion = excluded.seccion,
    dispositivo = excluded.dispositivo,
    -- Si llevaba más de 5 min sin actividad, es una conexión nueva.
    conectado_desde = case when presencia_usuarios.ultima_actividad < now() - interval '5 minutes' then now() else presencia_usuarios.conectado_desde end,
    ultima_actividad = now();
end;
$$;
revoke execute on function registrar_presencia(text, text) from public, anon;
grant execute on function registrar_presencia(text, text) to authenticated;
