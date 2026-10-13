-- Pago manual de Premium mejorado:
--   1. Los administradores también pueden activar notificaciones push.
--   2. Bucket público "qr-pagos" para el QR de cada método de pago (solo admins suben/borran).
--   3. Referencia única por docente (CA-XXXXXX) para identificar quién pagó.
--   4. Aviso inmediato a los admins cuando un docente sube un comprobante (in-app + push al instante).
--   5. Aviso al docente el día en que su Premium vence (además del aviso 3 días antes).

-- 1. Push para administradores
alter table public.push_subscriptions drop constraint if exists push_subscriptions_rol_check;
alter table public.push_subscriptions
  add constraint push_subscriptions_rol_check check (rol in ('docente', 'estudiante', 'administrador'));

-- 2. QR de métodos de pago
insert into storage.buckets (id, name, public)
values ('qr-pagos', 'qr-pagos', true)
on conflict (id) do nothing;

create policy "QR de pago públicos para lectura" on storage.objects
  for select using (bucket_id = 'qr-pagos');

create policy "Admins suben QR de pago" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'qr-pagos' and exists (
      select 1 from public.administradores a
      where a.user_id = auth.uid() and a.activo and a.puede_gestionar_docentes));

create policy "Admins actualizan QR de pago" on storage.objects
  for update to authenticated using (
    bucket_id = 'qr-pagos' and exists (
      select 1 from public.administradores a
      where a.user_id = auth.uid() and a.activo and a.puede_gestionar_docentes));

create policy "Admins borran QR de pago" on storage.objects
  for delete to authenticated using (
    bucket_id = 'qr-pagos' and exists (
      select 1 from public.administradores a
      where a.user_id = auth.uid() and a.activo and a.puede_gestionar_docentes));

-- 3. Referencia de pago — misma fórmula que referenciaPagoDocente() en premium-suscripcion.service.ts
create or replace function public.referencia_pago_docente(p_docente_id uuid)
returns text
language sql
immutable
set search_path = public
as $$
  select 'CA-' || upper(left(replace(p_docente_id::text, '-', ''), 6));
$$;

-- 4. Aviso a los admins por cada comprobante nuevo
create or replace function public.notificar_admins_pago_nuevo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into notificaciones (usuario_id, tipo, titulo, cuerpo)
  select a.user_id,
         'admin_pago_nuevo',
         'Nuevo comprobante de pago',
         d.nombres || ' ' || d.apellidos || ' envió $' || replace(to_char(NEW.monto, 'FM999,999,999'), ',', '.')
           || ' (' || NEW.periodo_declarado_por_docente || ') · Ref ' || referencia_pago_docente(NEW.docente_id)
  from administradores a
  cross join docentes d
  where d.id = NEW.docente_id
    and a.activo and a.puede_gestionar_docentes;

  -- Dispara el envío push ya, sin esperar el cron de 10 minutos. Si falla, el cron lo envía igual.
  begin
    perform net.http_post(
      url := 'https://scncstkyhyfunkjqcuwl.supabase.co/functions/v1/enviar-push-pendientes',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || 'sb_publishable_30tZuFKisXs91Cr0GEWzYw_1ZafnEkz'
      ),
      body := '{}'::jsonb
    );
  exception when others then
    null;
  end;

  return NEW;
end;
$$;

revoke execute on function public.notificar_admins_pago_nuevo() from public, anon, authenticated;

drop trigger if exists trigger_notificar_admins_pago_nuevo on public.pagos_premium;
create trigger trigger_notificar_admins_pago_nuevo
  after insert on public.pagos_premium
  for each row execute function public.notificar_admins_pago_nuevo();

-- 5. Aviso el día del vencimiento
create or replace function public.premium_revisar_vencimientos_diario()
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

  insert into notificaciones (usuario_id, tipo, titulo, cuerpo)
  select d.user_id, 'premium_vencido', 'Tu Premium venció',
         'Renueva desde la sección Premium subiendo tu comprobante de pago.'
  from docentes d
  where d.premium_activo = true
    and d.premium_fuente in ('prueba', 'pago')
    and d.premium_fecha_vencimiento is not null
    and d.premium_fecha_vencimiento < now();

  update docentes
  set premium_activo = false
  where premium_activo = true
    and premium_fuente in ('prueba', 'pago')
    and premium_fecha_vencimiento is not null
    and premium_fecha_vencimiento < now();
end;
$$;
