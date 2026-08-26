-- PARTE 2 (actualizada) — Activación de Premium por solicitud + comprobante de pago manual.

-- ============================================================================
-- 1. Columnas nuevas en docentes
-- ============================================================================
alter table docentes
  add column if not exists premium_activo boolean not null default false,
  add column if not exists premium_fuente text check (premium_fuente in ('prueba', 'pago', 'admin')),
  add column if not exists premium_es_prueba boolean not null default false,
  add column if not exists premium_prueba_utilizada boolean not null default false,
  add column if not exists premium_fecha_inicio timestamptz,
  add column if not exists premium_fecha_vencimiento timestamptz,
  add column if not exists premium_precio_personalizado numeric,
  add column if not exists premium_aviso_vencimiento_enviado boolean not null default false;

-- Protección: existen policies de UPDATE en docentes que permiten a cada docente editar
-- CUALQUIER columna de su propia fila (auth.uid() = user_id, sin restricción de columnas).
-- Sin esto, un docente podría auto-otorgarse Premium con un PATCH directo a la API, saltándose
-- por completo el flujo de aprobación del admin. Se revierte cualquier cambio a las columnas
-- premium_* que no venga de una función SECURITY DEFINER autorizada (las de más abajo).
create or replace function proteger_columnas_premium()
returns trigger
language plpgsql
as $$
begin
  if current_setting('app.bypass_premium_protection', true) is distinct from 'on' then
    NEW.premium_activo := OLD.premium_activo;
    NEW.premium_fuente := OLD.premium_fuente;
    NEW.premium_es_prueba := OLD.premium_es_prueba;
    NEW.premium_prueba_utilizada := OLD.premium_prueba_utilizada;
    NEW.premium_fecha_inicio := OLD.premium_fecha_inicio;
    NEW.premium_fecha_vencimiento := OLD.premium_fecha_vencimiento;
    NEW.premium_precio_personalizado := OLD.premium_precio_personalizado;
    NEW.premium_aviso_vencimiento_enviado := OLD.premium_aviso_vencimiento_enviado;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trigger_proteger_columnas_premium on docentes;
create trigger trigger_proteger_columnas_premium
before update on docentes
for each row execute function proteger_columnas_premium();

-- ============================================================================
-- 2. Precio estándar (global, configurable por el admin) en configuracion_app
-- ============================================================================
alter table configuracion_app
  add column if not exists premium_precio_mensual numeric,
  add column if not exists premium_precio_anual numeric;

-- ============================================================================
-- 3. Tabla solicitudes_premium (prueba gratis)
-- ============================================================================
create table if not exists solicitudes_premium (
  id uuid primary key default gen_random_uuid(),
  docente_id uuid not null references docentes(id) on delete cascade,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aprobada', 'rechazada')),
  nota_admin text,
  revisado_por uuid references administradores(id),
  fecha_revision timestamptz,
  created_at timestamptz not null default now()
);

-- Un docente solo puede tener una solicitud pendiente a la vez.
create unique index if not exists solicitudes_premium_una_pendiente
  on solicitudes_premium (docente_id) where estado = 'pendiente';

alter table solicitudes_premium enable row level security;

create policy "docente_ve_sus_solicitudes" on solicitudes_premium
for select using (exists (
  select 1 from docentes where docentes.id = solicitudes_premium.docente_id and docentes.user_id = auth.uid()
));

create policy "docente_crea_su_solicitud" on solicitudes_premium
for insert with check (exists (
  select 1 from docentes where docentes.id = solicitudes_premium.docente_id and docentes.user_id = auth.uid()
));

create policy "admin_ve_solicitudes_premium" on solicitudes_premium
for select using (exists (
  select 1 from administradores
  where administradores.user_id = auth.uid() and administradores.activo = true and administradores.puede_gestionar_docentes = true
));

-- ============================================================================
-- 4. Tabla pagos_premium (comprobantes)
-- ============================================================================
create table if not exists pagos_premium (
  id uuid primary key default gen_random_uuid(),
  docente_id uuid not null references docentes(id) on delete cascade,
  monto numeric not null,
  fecha_pago_declarada date not null,
  comprobante_url text not null,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aprobado', 'rechazado')),
  periodo_declarado_por_docente text not null check (periodo_declarado_por_docente in ('mensual', 'anual')),
  periodo_confirmado_por_admin text check (periodo_confirmado_por_admin in ('mensual', 'anual')),
  nota_admin text,
  revisado_por uuid references administradores(id),
  fecha_revision timestamptz,
  created_at timestamptz not null default now()
);

-- Un docente solo puede tener un comprobante pendiente de revisión a la vez.
create unique index if not exists pagos_premium_un_pendiente
  on pagos_premium (docente_id) where estado = 'pendiente';

alter table pagos_premium enable row level security;

create policy "docente_ve_sus_pagos" on pagos_premium
for select using (exists (
  select 1 from docentes where docentes.id = pagos_premium.docente_id and docentes.user_id = auth.uid()
));

create policy "docente_crea_su_pago" on pagos_premium
for insert with check (exists (
  select 1 from docentes where docentes.id = pagos_premium.docente_id and docentes.user_id = auth.uid()
));

create policy "admin_ve_pagos_premium" on pagos_premium
for select using (exists (
  select 1 from administradores
  where administradores.user_id = auth.uid() and administradores.activo = true and administradores.puede_gestionar_docentes = true
));

-- Sin policy de UPDATE para nadie: las transiciones de estado (aprobar/rechazar) solo pasan
-- por las funciones SECURITY DEFINER de más abajo, nunca por un UPDATE directo del cliente.

-- ============================================================================
-- 5. Storage bucket privado para comprobantes de pago
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('comprobantes-pago', 'comprobantes-pago', false)
on conflict (id) do nothing;

create policy "docente_sube_su_comprobante" on storage.objects
for insert to authenticated
with check (bucket_id = 'comprobantes-pago' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "docente_ve_su_comprobante" on storage.objects
for select to authenticated
using (bucket_id = 'comprobantes-pago' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "admin_ve_comprobantes_pago" on storage.objects
for select to authenticated
using (
  bucket_id = 'comprobantes-pago'
  and exists (
    select 1 from administradores
    where administradores.user_id = auth.uid() and administradores.activo = true and administradores.puede_gestionar_docentes = true
  )
);

-- ============================================================================
-- 6. Tabla notificaciones (in-app) — base compartida que reutilizará la Parte 5
--    (recordatorios de clase por push) cuando se construya; por ahora solo in-app.
-- ============================================================================
create table if not exists notificaciones (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null,
  tipo text not null,
  titulo text not null,
  cuerpo text not null,
  leida boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notificaciones_usuario_idx on notificaciones (usuario_id, created_at desc);

alter table notificaciones enable row level security;

create policy "usuarios_ven_sus_notificaciones" on notificaciones
for select using (usuario_id = auth.uid());

create policy "usuarios_marcan_sus_notificaciones" on notificaciones
for update using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

-- Sin policy de INSERT: solo se crean desde las funciones SECURITY DEFINER de este archivo.

-- ============================================================================
-- 7. Funciones administrativas (SECURITY DEFINER) — único camino válido para tocar
--    las columnas premium_* de docentes.
-- ============================================================================

create or replace function admin_aprobar_solicitud_premium(p_solicitud_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_docente_id uuid;
  v_admin_id uuid;
  v_ya_uso_prueba boolean;
begin
  select id into v_admin_id from administradores
  where user_id = auth.uid() and activo = true and puede_gestionar_docentes = true;
  if v_admin_id is null then
    raise exception 'No autorizado';
  end if;

  select docente_id into v_docente_id from solicitudes_premium
  where id = p_solicitud_id and estado = 'pendiente'
  for update;
  if v_docente_id is null then
    raise exception 'Solicitud no encontrada o ya procesada';
  end if;

  select premium_prueba_utilizada into v_ya_uso_prueba from docentes where id = v_docente_id for update;
  if v_ya_uso_prueba then
    raise exception 'Este docente ya usó su prueba gratis anteriormente';
  end if;

  update solicitudes_premium
  set estado = 'aprobada', revisado_por = v_admin_id, fecha_revision = now()
  where id = p_solicitud_id;

  perform set_config('app.bypass_premium_protection', 'on', true);
  update docentes
  set premium_activo = true,
      premium_fuente = 'prueba',
      premium_es_prueba = true,
      premium_prueba_utilizada = true,
      premium_fecha_inicio = now(),
      premium_fecha_vencimiento = now() + interval '30 days',
      premium_aviso_vencimiento_enviado = false
  where id = v_docente_id;

  insert into notificaciones (usuario_id, tipo, titulo, cuerpo)
  select user_id, 'premium_solicitud_aprobada', 'Tu prueba gratis de Premium fue aprobada',
         'Ya tienes acceso a Premium por 30 días.'
  from docentes where id = v_docente_id;
end;
$$;

create or replace function admin_rechazar_solicitud_premium(p_solicitud_id uuid, p_nota text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_docente_id uuid;
  v_admin_id uuid;
begin
  select id into v_admin_id from administradores
  where user_id = auth.uid() and activo = true and puede_gestionar_docentes = true;
  if v_admin_id is null then
    raise exception 'No autorizado';
  end if;

  select docente_id into v_docente_id from solicitudes_premium
  where id = p_solicitud_id and estado = 'pendiente'
  for update;
  if v_docente_id is null then
    raise exception 'Solicitud no encontrada o ya procesada';
  end if;

  update solicitudes_premium
  set estado = 'rechazada', nota_admin = p_nota, revisado_por = v_admin_id, fecha_revision = now()
  where id = p_solicitud_id;

  insert into notificaciones (usuario_id, tipo, titulo, cuerpo)
  select user_id, 'premium_solicitud_rechazada', 'Tu solicitud de prueba gratis fue rechazada',
         coalesce(p_nota, 'Contacta al administrador para más información.')
  from docentes where id = v_docente_id;
end;
$$;

create or replace function admin_aprobar_pago_premium(p_pago_id uuid, p_periodo text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_docente_id uuid;
  v_admin_id uuid;
  v_vencimiento_actual timestamptz;
  v_nueva_fecha timestamptz;
begin
  if p_periodo not in ('mensual', 'anual') then
    raise exception 'Periodo inválido';
  end if;

  select id into v_admin_id from administradores
  where user_id = auth.uid() and activo = true and puede_gestionar_docentes = true;
  if v_admin_id is null then
    raise exception 'No autorizado';
  end if;

  select docente_id into v_docente_id from pagos_premium
  where id = p_pago_id and estado = 'pendiente'
  for update;
  if v_docente_id is null then
    raise exception 'Pago no encontrado o ya procesado';
  end if;

  select premium_fecha_vencimiento into v_vencimiento_actual from docentes where id = v_docente_id for update;

  v_nueva_fecha := greatest(coalesce(v_vencimiento_actual, now()), now());
  if p_periodo = 'mensual' then
    v_nueva_fecha := v_nueva_fecha + interval '1 month';
  else
    v_nueva_fecha := v_nueva_fecha + interval '1 year';
  end if;

  update pagos_premium
  set estado = 'aprobado', periodo_confirmado_por_admin = p_periodo, revisado_por = v_admin_id, fecha_revision = now()
  where id = p_pago_id;

  perform set_config('app.bypass_premium_protection', 'on', true);
  update docentes
  set premium_activo = true,
      premium_fuente = 'pago',
      premium_es_prueba = false,
      premium_fecha_vencimiento = v_nueva_fecha,
      premium_fecha_inicio = coalesce(premium_fecha_inicio, now()),
      premium_aviso_vencimiento_enviado = false
  where id = v_docente_id;

  insert into notificaciones (usuario_id, tipo, titulo, cuerpo)
  select user_id, 'premium_pago_aprobado', 'Tu pago de Premium fue aprobado',
         'Tu Premium ahora vence el ' || to_char(v_nueva_fecha, 'DD/MM/YYYY') || '.'
  from docentes where id = v_docente_id;
end;
$$;

create or replace function admin_rechazar_pago_premium(p_pago_id uuid, p_nota text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_docente_id uuid;
  v_admin_id uuid;
begin
  select id into v_admin_id from administradores
  where user_id = auth.uid() and activo = true and puede_gestionar_docentes = true;
  if v_admin_id is null then
    raise exception 'No autorizado';
  end if;

  select docente_id into v_docente_id from pagos_premium
  where id = p_pago_id and estado = 'pendiente'
  for update;
  if v_docente_id is null then
    raise exception 'Pago no encontrado o ya procesado';
  end if;

  update pagos_premium
  set estado = 'rechazado', nota_admin = p_nota, revisado_por = v_admin_id, fecha_revision = now()
  where id = p_pago_id;

  insert into notificaciones (usuario_id, tipo, titulo, cuerpo)
  select user_id, 'premium_pago_rechazado', 'Tu comprobante de pago fue rechazado',
         coalesce(p_nota, 'Revisa el comprobante e intenta de nuevo.')
  from docentes where id = v_docente_id;
end;
$$;

-- Parte 3 — otorgar/revocar Premium manualmente (fuente 'admin', sin solicitud ni pago).
create or replace function admin_otorgar_premium_manual(p_docente_id uuid)
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

  perform set_config('app.bypass_premium_protection', 'on', true);
  update docentes
  set premium_activo = true,
      premium_fuente = 'admin',
      premium_es_prueba = false,
      premium_fecha_inicio = coalesce(premium_fecha_inicio, now()),
      premium_fecha_vencimiento = null
  where id = p_docente_id;
end;
$$;

create or replace function admin_revocar_premium_manual(p_docente_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_id uuid;
  v_fuente text;
begin
  select id into v_admin_id from administradores
  where user_id = auth.uid() and activo = true and puede_gestionar_docentes = true;
  if v_admin_id is null then
    raise exception 'No autorizado';
  end if;

  select premium_fuente into v_fuente from docentes where id = p_docente_id;
  if v_fuente in ('prueba', 'pago') then
    raise exception 'Premium activo por % — no se revoca con este botón, es un caso aparte', v_fuente;
  end if;

  perform set_config('app.bypass_premium_protection', 'on', true);
  update docentes
  set premium_activo = false, premium_fuente = null, premium_fecha_vencimiento = null
  where id = p_docente_id;
end;
$$;

create or replace function admin_actualizar_precio_personalizado(p_docente_id uuid, p_precio numeric)
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

  perform set_config('app.bypass_premium_protection', 'on', true);
  update docentes set premium_precio_personalizado = p_precio where id = p_docente_id;
end;
$$;

-- ============================================================================
-- 8. pg_cron diario: vencimientos + aviso de 3 días antes
-- ============================================================================
create extension if not exists pg_cron;

create or replace function premium_revisar_vencimientos_diario()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Aviso 3 días antes de vencer (una sola vez por vencimiento; se resetea al aprobar un pago).
  insert into notificaciones (usuario_id, tipo, titulo, cuerpo)
  select d.user_id, 'premium_por_vencer', 'Tu Premium vence en 3 días',
         'Sube tu comprobante de pago para no perder acceso a Premium.'
  from docentes d
  where d.premium_activo = true
    and d.premium_fuente in ('prueba', 'pago')
    and d.premium_fecha_vencimiento is not null
    and d.premium_fecha_vencimiento <= now() + interval '3 days'
    and d.premium_aviso_vencimiento_enviado = false;

  perform set_config('app.bypass_premium_protection', 'on', true);

  update docentes
  set premium_aviso_vencimiento_enviado = true
  where premium_activo = true
    and premium_fuente in ('prueba', 'pago')
    and premium_fecha_vencimiento is not null
    and premium_fecha_vencimiento <= now() + interval '3 days'
    and premium_aviso_vencimiento_enviado = false;

  -- Vencimiento real: desactiva Premium cuyo periodo ya pasó.
  update docentes
  set premium_activo = false
  where premium_activo = true
    and premium_fuente in ('prueba', 'pago')
    and premium_fecha_vencimiento is not null
    and premium_fecha_vencimiento < now();
end;
$$;

select cron.schedule('premium-vencimientos-diario', '0 6 * * *', $$select premium_revisar_vencimientos_diario();$$);
