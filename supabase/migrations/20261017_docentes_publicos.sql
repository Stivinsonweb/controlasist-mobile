-- Datos públicos de los docentes para la app del estudiante (nombre, foto, insignias).
-- Reemplaza la política `estudiantes_leen_docentes` (SELECT true), que dejaba a cualquier
-- usuario con sesión leer la ficha completa de todos los docentes: correo, teléfono, Premium,
-- precio personalizado, etc. Solo devuelve docentes con alguna asignatura activa (los mismos
-- que un estudiante puede encontrar con un código de acceso).
create or replace function docentes_publicos(p_ids uuid[])
returns table (id uuid, nombres text, apellidos text, foto_url text, verificado boolean, premium_activo boolean)
language sql
stable
security definer
set search_path = public
as $$
  select d.id, d.nombres::text, d.apellidos::text, d.foto_url::text, coalesce(d.verificado, false), coalesce(d.premium_activo, false)
  from docentes d
  where d.id = any(p_ids)
    and exists (select 1 from asignaturas a where a.docente_id = d.id and a.activa = true);
$$;

revoke execute on function docentes_publicos(uuid[]) from public, anon;
grant execute on function docentes_publicos(uuid[]) to authenticated;

-- Se ejecuta DESPUÉS de publicar la app que usa docentes_publicos (ver commit del front).
drop policy if exists estudiantes_leen_docentes on docentes;
