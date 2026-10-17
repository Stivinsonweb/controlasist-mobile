-- ===== 1. Archivos: cada usuario solo toca su propia carpeta =====
-- Antes cualquier usuario con sesión podía subir, reemplazar o borrar cualquier archivo de
-- `avatares` (incluida la galería compartida `avatars/`) y de `logos-institucionales`.
-- Rutas que usa la app (avatar.service.ts / logo.service.ts):
--   avatares:              docentes/<docentes.id>/avatar.ext · estudiantes/<auth.uid()>/avatar.ext
--   logos-institucionales: <docentes.id>/logo.ext
-- La galería `avatars/` solo la gestionan administradores (o el panel de Supabase).
create or replace function storage_ruta_propia(p_bucket text, p_nombre text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when es_administrador_activo() then true
    when p_bucket = 'avatares' and (storage.foldername(p_nombre))[1] = 'estudiantes'
      then (storage.foldername(p_nombre))[2] = auth.uid()::text
    when p_bucket = 'avatares' and (storage.foldername(p_nombre))[1] = 'docentes'
      then exists (select 1 from docentes where id::text = (storage.foldername(p_nombre))[2] and user_id = auth.uid())
    when p_bucket = 'logos-institucionales'
      then exists (select 1 from docentes where id::text = (storage.foldername(p_nombre))[1] and user_id = auth.uid())
    else false
  end;
$$;
revoke execute on function storage_ruta_propia(text, text) from public, anon;
grant execute on function storage_ruta_propia(text, text) to authenticated;

drop policy if exists "Usuarios autenticados pueden subir avatares" on storage.objects;
drop policy if exists "Usuarios pueden actualizar sus avatares" on storage.objects;
drop policy if exists "Usuarios pueden eliminar sus avatares" on storage.objects;
drop policy if exists "Usuarios autenticados pueden subir logos institucionales" on storage.objects;
drop policy if exists "Usuarios pueden actualizar logos institucionales" on storage.objects;
drop policy if exists "Usuarios pueden eliminar logos institucionales" on storage.objects;

create policy "Usuarios suben a su propia carpeta" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('avatares', 'logos-institucionales') and storage_ruta_propia(bucket_id, name));
create policy "Usuarios actualizan su propia carpeta" on storage.objects
  for update to authenticated
  using (bucket_id in ('avatares', 'logos-institucionales') and storage_ruta_propia(bucket_id, name))
  with check (bucket_id in ('avatares', 'logos-institucionales') and storage_ruta_propia(bucket_id, name));
create policy "Usuarios borran de su propia carpeta" on storage.objects
  for delete to authenticated
  using (bucket_id in ('avatares', 'logos-institucionales') and storage_ruta_propia(bucket_id, name));

-- ===== 2. intentos_login =====
-- Cualquiera, incluso sin sesión, podía leer los correos de quienes intentaron entrar y
-- modificar los contadores. La app ya no usa esta tabla: sin políticas, nadie la lee ni escribe.
drop policy if exists "Cualquiera puede registrar intentos de login" on intentos_login;
drop policy if exists "Cualquiera puede leer su propio contador de intentos" on intentos_login;
drop policy if exists "Cualquiera puede actualizar el contador de intentos" on intentos_login;

-- ===== 3. Pagos y solicitudes: siempre entran como pendientes =====
-- Un docente podía crear un pago o una solicitud ya marcados como aprobados. Las funciones
-- del servidor (SECURITY DEFINER, p. ej. docente_activar_prueba_gratis) no se ven afectadas:
-- dentro de ellas current_user es el dueño de la función, no `authenticated`.
create or replace function forzar_revision_pendiente()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user in ('authenticated', 'anon') then
    NEW.estado := 'pendiente';
    NEW.nota_admin := null;
    NEW.revisado_por := null;
    NEW.fecha_revision := null;
    if TG_TABLE_NAME = 'pagos_premium' then
      NEW.periodo_confirmado_por_admin := null;
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trigger_forzar_revision_pendiente on pagos_premium;
create trigger trigger_forzar_revision_pendiente before insert on pagos_premium
  for each row execute function forzar_revision_pendiente();
drop trigger if exists trigger_forzar_revision_pendiente on solicitudes_premium;
create trigger trigger_forzar_revision_pendiente before insert on solicitudes_premium
  for each row execute function forzar_revision_pendiente();
drop trigger if exists trigger_forzar_revision_pendiente on solicitudes_verificacion_docente;
create trigger trigger_forzar_revision_pendiente before insert on solicitudes_verificacion_docente
  for each row execute function forzar_revision_pendiente();

-- ===== 4. Tabla avatares =====
-- Cualquier docente podía gestionar los registros de avatar de cualquier estudiante.
-- La app no usa esta tabla; cada docente queda limitado a los suyos.
drop policy if exists "Docentes pueden gestionar sus avatares" on avatares;
create policy "Docentes gestionan sus avatares" on avatares
  for all to authenticated
  using (entidad_tipo = 'docente' and entidad_id in (select id from docentes where user_id = auth.uid()))
  with check (entidad_tipo = 'docente' and entidad_id in (select id from docentes where user_id = auth.uid()));
