-- Verificación de cuenta de docente (a solicitud del propio docente, aprobada por el admin).
-- Sin pedirle información nueva al docente — el admin revisa lo que ya existe (nombre, correo,
-- asignaturas creadas, etc.) y aprueba o rechaza. El estudiante ve la insignia + la foto del
-- docente al inscribirse.

-- ============================================================================
-- 1. Columnas en docentes
-- ============================================================================
alter table docentes
  add column if not exists verificado boolean not null default false,
  add column if not exists verificado_en timestamptz;

-- ============================================================================
-- 2. Unifica la protección de columnas sensibles de `docentes` (antes solo cubría
--    premium_*, ahora también verificado/verificado_en) bajo un solo trigger y un
--    nombre de GUC genérico. Reemplaza `proteger_columnas_premium` /
--    `app.bypass_premium_protection` de la migración de Premium.
-- ============================================================================
create or replace function proteger_columnas_sensibles_docentes()
returns trigger
language plpgsql
as $$
begin
  if current_setting('app.bypass_proteccion_docentes', true) is distinct from 'on' then
    NEW.premium_activo := OLD.premium_activo;
    NEW.premium_fuente := OLD.premium_fuente;
    NEW.premium_es_prueba := OLD.premium_es_prueba;
    NEW.premium_prueba_utilizada := OLD.premium_prueba_utilizada;
    NEW.premium_fecha_inicio := OLD.premium_fecha_inicio;
    NEW.premium_fecha_vencimiento := OLD.premium_fecha_vencimiento;
    NEW.premium_precio_personalizado := OLD.premium_precio_personalizado;
    NEW.premium_aviso_vencimiento_enviado := OLD.premium_aviso_vencimiento_enviado;
    NEW.verificado := OLD.verificado;
    NEW.verificado_en := OLD.verificado_en;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trigger_proteger_columnas_premium on docentes;
drop trigger if exists trigger_proteger_columnas_sensibles_docentes on docentes;
create trigger trigger_proteger_columnas_sensibles_docentes
before update on docentes
for each row execute function proteger_columnas_sensibles_docentes();

drop function if exists proteger_columnas_premium();

-- Recrea las funciones de Premium apuntando al nuevo nombre de GUC (antes
-- `app.bypass_premium_protection`) — mismo comportamiento, solo el flag cambia de nombre.
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

  perform set_config('app.bypass_proteccion_docentes', 'on', true);
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

  perform set_config('app.bypass_proteccion_docentes', 'on', true);
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

  perform set_config('app.bypass_proteccion_docentes', 'on', true);
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

  perform set_config('app.bypass_proteccion_docentes', 'on', true);
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

  perform set_config('app.bypass_proteccion_docentes', 'on', true);
  update docentes set premium_precio_personalizado = p_precio where id = p_docente_id;
end;
$$;

create or replace function premium_revisar_vencimientos_diario()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into notificaciones (usuario_id, tipo, titulo, cuerpo)
  select d.user_id, 'premium_por_vencer', 'Tu Premium vence en 3 días',
         'Sube tu comprobante de pago para no perder acceso a Premium.'
  from docentes d
  where d.premium_activo = true
    and d.premium_fuente in ('prueba', 'pago')
    and d.premium_fecha_vencimiento is not null
    and d.premium_fecha_vencimiento <= now() + interval '3 days'
    and d.premium_aviso_vencimiento_enviado = false;

  perform set_config('app.bypass_proteccion_docentes', 'on', true);

  update docentes
  set premium_aviso_vencimiento_enviado = true
  where premium_activo = true
    and premium_fuente in ('prueba', 'pago')
    and premium_fecha_vencimiento is not null
    and premium_fecha_vencimiento <= now() + interval '3 days'
    and premium_aviso_vencimiento_enviado = false;

  update docentes
  set premium_activo = false
  where premium_activo = true
    and premium_fuente in ('prueba', 'pago')
    and premium_fecha_vencimiento is not null
    and premium_fecha_vencimiento < now();
end;
$$;

-- ============================================================================
-- 3. Tabla de solicitudes de verificación (mismo patrón que solicitudes_premium)
-- ============================================================================
create table if not exists solicitudes_verificacion_docente (
  id uuid primary key default gen_random_uuid(),
  docente_id uuid not null references docentes(id) on delete cascade,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aprobada', 'rechazada')),
  nota_admin text,
  revisado_por uuid references administradores(id),
  fecha_revision timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists solicitudes_verificacion_una_pendiente
  on solicitudes_verificacion_docente (docente_id) where estado = 'pendiente';

alter table solicitudes_verificacion_docente enable row level security;

create policy "docente_ve_sus_solicitudes_verificacion" on solicitudes_verificacion_docente
for select using (exists (
  select 1 from docentes where docentes.id = solicitudes_verificacion_docente.docente_id and docentes.user_id = auth.uid()
));

create policy "docente_crea_su_solicitud_verificacion" on solicitudes_verificacion_docente
for insert with check (exists (
  select 1 from docentes where docentes.id = solicitudes_verificacion_docente.docente_id and docentes.user_id = auth.uid()
));

create policy "admin_ve_solicitudes_verificacion" on solicitudes_verificacion_docente
for select using (exists (
  select 1 from administradores
  where administradores.user_id = auth.uid() and administradores.activo = true and administradores.puede_gestionar_docentes = true
));

-- ============================================================================
-- 4. Funciones administrativas
-- ============================================================================
create or replace function admin_aprobar_verificacion_docente(p_solicitud_id uuid)
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

  select docente_id into v_docente_id from solicitudes_verificacion_docente
  where id = p_solicitud_id and estado = 'pendiente'
  for update;
  if v_docente_id is null then
    raise exception 'Solicitud no encontrada o ya procesada';
  end if;

  update solicitudes_verificacion_docente
  set estado = 'aprobada', revisado_por = v_admin_id, fecha_revision = now()
  where id = p_solicitud_id;

  perform set_config('app.bypass_proteccion_docentes', 'on', true);
  update docentes set verificado = true, verificado_en = now() where id = v_docente_id;

  insert into notificaciones (usuario_id, tipo, titulo, cuerpo)
  select user_id, 'verificacion_aprobada', 'Tu cuenta fue verificada',
         'Ya tienes la insignia de docente verificado — tus estudiantes la verán al inscribirse.'
  from docentes where id = v_docente_id;
end;
$$;

create or replace function admin_rechazar_verificacion_docente(p_solicitud_id uuid, p_nota text)
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

  select docente_id into v_docente_id from solicitudes_verificacion_docente
  where id = p_solicitud_id and estado = 'pendiente'
  for update;
  if v_docente_id is null then
    raise exception 'Solicitud no encontrada o ya procesada';
  end if;

  update solicitudes_verificacion_docente
  set estado = 'rechazada', nota_admin = p_nota, revisado_por = v_admin_id, fecha_revision = now()
  where id = p_solicitud_id;

  insert into notificaciones (usuario_id, tipo, titulo, cuerpo)
  select user_id, 'verificacion_rechazada', 'Tu solicitud de verificación fue rechazada',
         coalesce(p_nota, 'Contacta al administrador para más información.')
  from docentes where id = v_docente_id;
end;
$$;

create or replace function admin_revocar_verificacion_docente(p_docente_id uuid)
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
  update docentes set verificado = false, verificado_en = null where id = p_docente_id;
end;
$$;
