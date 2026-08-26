-- Funcionalidad 5 — notificaciones push (recordatorio de clases) + despacho push genérico
-- reutilizado por la Parte 2 (aprobación/rechazo de Premium, aviso de vencimiento).

-- ============================================================================
-- 1. La tabla `notificaciones` (creada en la Parte 2) se vuelve la cola de salida
--    tanto para in-app como para push: `enviado_push` la marca la Edge Function
--    `enviar-push-pendientes` después de intentar despachar cada fila.
-- ============================================================================
alter table notificaciones
  add column if not exists enviado_push boolean not null default false;

create index if not exists notificaciones_pendientes_push_idx
  on notificaciones (created_at) where enviado_push = false;

-- ============================================================================
-- 2. Suscripciones push del navegador (Angular SwPush)
-- ============================================================================
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null,
  rol text not null check (rol in ('docente', 'estudiante')),
  endpoint text not null,
  p256dh text not null,
  auth_key text not null,
  created_at timestamptz not null default now(),
  unique (usuario_id, endpoint)
);

alter table push_subscriptions enable row level security;

create policy "usuarios_gestionan_sus_suscripciones_select" on push_subscriptions
for select using (usuario_id = auth.uid());

create policy "usuarios_gestionan_sus_suscripciones_insert" on push_subscriptions
for insert with check (usuario_id = auth.uid());

create policy "usuarios_gestionan_sus_suscripciones_delete" on push_subscriptions
for delete using (usuario_id = auth.uid());

-- ============================================================================
-- 3. Dedup de recordatorios de clase (una fila por horario+fecha+destinatario)
--    Sin policies de cliente a propósito: solo la función SECURITY DEFINER de abajo
--    (y por lo tanto el rol que ejecuta el cron) puede tocar esta tabla.
-- ============================================================================
create table if not exists recordatorios_clase_enviados (
  id uuid primary key default gen_random_uuid(),
  horario_id uuid not null references horarios(id) on delete cascade,
  fecha date not null,
  usuario_id uuid not null,
  created_at timestamptz not null default now(),
  unique (horario_id, fecha, usuario_id)
);

alter table recordatorios_clase_enviados enable row level security;

-- ============================================================================
-- 4. Configuración: minutos de anticipación (configurable, ver Func 5 punto 4) y
--    llave pública VAPID (la privada vive solo como secret de la Edge Function).
-- ============================================================================
alter table configuracion_app
  add column if not exists recordatorio_clase_minutos_antes integer not null default 15,
  add column if not exists vapid_public_key text;

-- ============================================================================
-- 5. Función: genera los recordatorios de clase debidos (docente + estudiantes
--    inscritos) como filas de `notificaciones` pendientes de push. Idempotente:
--    la tabla de dedup evita mandar el mismo recordatorio dos veces.
-- ============================================================================
create or replace function generar_recordatorios_clase_debidos()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_minutos int;
  v_ahora_local timestamp;
  v_ventana_desde time;
  v_ventana_hasta time;
  v_dia_semana int;
  clase record;
  estudiante record;
begin
  select coalesce(recordatorio_clase_minutos_antes, 15) into v_minutos from configuracion_app limit 1;
  if v_minutos is null then v_minutos := 15; end if;

  -- Colombia no tiene horario de verano — America/Bogota es UTC-5 fijo.
  v_ahora_local := now() at time zone 'America/Bogota';
  v_dia_semana := extract(dow from v_ahora_local)::int;
  -- Ventana = próximos `v_minutos` a `v_minutos + 10` (el cron corre cada 10 min) para no
  -- perder ni duplicar clases entre corridas — el dedup de abajo protege igual ante solapes.
  v_ventana_desde := (v_ahora_local + (v_minutos || ' minutes')::interval)::time;
  v_ventana_hasta := (v_ahora_local + ((v_minutos + 10) || ' minutes')::interval)::time;

  for clase in
    select h.id as horario_id, h.hora_inicio, a.id as asignatura_id, a.nombre as asignatura_nombre,
           d.user_id as docente_user_id
    from horarios h
    join asignaturas a on a.id = h.asignatura_id
    join docentes d on d.id = a.docente_id
    where h.activo = true
      and a.activa = true
      and h.dia_semana = v_dia_semana
      and h.hora_inicio >= v_ventana_desde
      and h.hora_inicio < v_ventana_hasta
      and not (h.fecha_ultima_actualizacion = current_date and h.estado in ('cancelada', 'aplazada'))
  loop
    -- Docente
    insert into recordatorios_clase_enviados (horario_id, fecha, usuario_id)
    values (clase.horario_id, current_date, clase.docente_user_id)
    on conflict do nothing;
    if found then
      insert into notificaciones (usuario_id, tipo, titulo, cuerpo)
      values (clase.docente_user_id, 'recordatorio_clase',
              'Próxima clase: ' || clase.asignatura_nombre,
              'Empieza en ' || v_minutos || ' minutos — ' || to_char(clase.hora_inicio, 'HH24:MI'));
    end if;

    -- Estudiantes inscritos activos
    for estudiante in
      select ea.estudiante_id
      from estudiantes_asignaturas ea
      where ea.asignatura_id = clase.asignatura_id and ea.activo = true
    loop
      insert into recordatorios_clase_enviados (horario_id, fecha, usuario_id)
      values (clase.horario_id, current_date, estudiante.estudiante_id)
      on conflict do nothing;
      if found then
        insert into notificaciones (usuario_id, tipo, titulo, cuerpo)
        values (estudiante.estudiante_id, 'recordatorio_clase',
                'Próxima clase: ' || clase.asignatura_nombre,
                'Empieza en ' || v_minutos || ' minutos — ' || to_char(clase.hora_inicio, 'HH24:MI'));
      end if;
    end loop;
  end loop;
end;
$$;

-- ============================================================================
-- 6. pg_net + cron: cada 10 min genera los recordatorios debidos y dispara la
--    Edge Function que hace el envío real (criptografía VAPID vive en Deno, no en SQL).
-- ============================================================================
create extension if not exists pg_net;

select cron.schedule(
  'recordatorios-clase-y-push',
  '*/10 * * * *',
  $cron$
  select generar_recordatorios_clase_debidos();
  select net.http_post(
    url := 'https://scncstkyhyfunkjqcuwl.supabase.co/functions/v1/enviar-push-pendientes',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || 'sb_publishable_30tZuFKisXs91Cr0GEWzYw_1ZafnEkz'
    ),
    body := '{}'::jsonb
  );
  $cron$
);
