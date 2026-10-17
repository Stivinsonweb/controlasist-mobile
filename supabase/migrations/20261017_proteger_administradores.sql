-- `admin_own_profile` (FOR ALL, user_id = auth.uid()) dejaba que CUALQUIER usuario con sesión
-- insertara su propia fila en `administradores` con todos los permisos, y que un administrador
-- se diera a sí mismo permisos que no tenía. Los administradores se crean desde el panel de
-- Supabase (service role), nunca desde la app.
drop policy if exists admin_own_profile on administradores;

-- Helper SECURITY DEFINER: una política sobre `administradores` que consulte la misma tabla
-- entraría en recursión.
create or replace function es_administrador_activo()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from administradores where user_id = auth.uid() and activo = true);
$$;
revoke execute on function es_administrador_activo() from public, anon;
grant execute on function es_administrador_activo() to authenticated;

create policy admin_ve_su_perfil on administradores
  for select to authenticated
  using (user_id = auth.uid() or es_administrador_activo());

create policy admin_actualiza_su_perfil on administradores
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Desde la app el administrador solo cambia nombres/apellidos: los permisos, el rol y el estado
-- se conservan (igual que proteger_columnas_sensibles_docentes).
create or replace function proteger_columnas_administradores()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_setting('app.bypass_proteccion_admin', true) is distinct from 'on'
     and auth.uid() is not null then
    NEW.user_id := OLD.user_id;
    NEW.email := OLD.email;
    NEW.rol := OLD.rol;
    NEW.activo := OLD.activo;
    NEW.puede_cerrar_app := OLD.puede_cerrar_app;
    NEW.puede_forzar_actualizacion := OLD.puede_forzar_actualizacion;
    NEW.puede_gestionar_docentes := OLD.puede_gestionar_docentes;
    NEW.puede_ver_reportes := OLD.puede_ver_reportes;
    NEW.puede_modificar_config := OLD.puede_modificar_config;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trigger_proteger_columnas_administradores on administradores;
create trigger trigger_proteger_columnas_administradores
  before update on administradores
  for each row execute function proteger_columnas_administradores();
