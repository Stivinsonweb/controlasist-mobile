-- ===== 1. Registro de docentes =====
-- "Allow insert during registration" (WITH CHECK true) dejaba crear filas en `docentes` para
-- cualquier user_id y con premium_activo/verificado en true. El registro ya tiene sesión al
-- insertar (las cuentas se confirman al instante), así que basta con la política
-- "Docentes pueden crear su propio perfil" (auth.uid() = user_id).
drop policy if exists "Allow insert during registration" on docentes;

-- Igual que proteger_columnas_sensibles_docentes (UPDATE), pero al crear la fila: Premium y
-- verificación solo los asignan funciones SECURITY DEFINER con app.bypass_proteccion_docentes.
create or replace function proteger_columnas_sensibles_docentes_insert()
returns trigger
language plpgsql
as $$
begin
  if current_setting('app.bypass_proteccion_docentes', true) is distinct from 'on' then
    NEW.premium_activo := false;
    NEW.premium_fuente := null;
    NEW.premium_es_prueba := false;
    NEW.premium_prueba_utilizada := false;
    NEW.premium_fecha_inicio := null;
    NEW.premium_fecha_vencimiento := null;
    NEW.premium_precio_personalizado := null;
    NEW.premium_aviso_vencimiento_enviado := false;
    NEW.verificado := false;
    NEW.verificado_en := null;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trigger_proteger_columnas_sensibles_docentes_insert on docentes;
create trigger trigger_proteger_columnas_sensibles_docentes_insert
  before insert on docentes
  for each row execute function proteger_columnas_sensibles_docentes_insert();

-- ===== 2. Códigos de acceso e inscripciones =====
-- Antes cualquier usuario con sesión podía listar todas las asignaturas activas (con su
-- codigo_acceso) e inscribirse en cualquier asignatura sin código. Ahora el código se valida
-- en el servidor y el estudiante solo ve las asignaturas en las que está inscrito.

-- Busca por el código exacto; devuelve solo lo que muestra la pantalla de inscripción.
create or replace function buscar_asignatura_por_codigo(p_codigo text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'asignatura', jsonb_build_object(
      'id', a.id, 'nombre', a.nombre, 'codigo', a.codigo, 'grupo', a.grupo, 'periodo', a.periodo,
      'color', a.color, 'icono', a.icono, 'docente_id', a.docente_id
    ),
    'docente', (
      select jsonb_build_object('id', d.id, 'nombres', d.nombres, 'apellidos', d.apellidos, 'foto_url', d.foto_url,
                                'verificado', coalesce(d.verificado, false), 'premium_activo', coalesce(d.premium_activo, false))
      from docentes d where d.id = a.docente_id
    ),
    'expirado', a.codigo_expira is not null and a.codigo_expira < current_date
  )
  from asignaturas a
  where a.codigo_acceso = upper(trim(p_codigo)) and a.activa = true
  limit 1;
$$;

-- Inscribe al estudiante que llama, validando el código. Devuelve 'creada' | 'reactivada' | 'ya-inscrito'.
create or replace function inscribirse_con_codigo(p_codigo text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_asignatura asignaturas%rowtype;
  v_activo boolean;
begin
  if auth.uid() is null or not exists (select 1 from estudiantes where id = auth.uid()) then
    raise exception 'Solo los estudiantes pueden inscribirse';
  end if;

  select * into v_asignatura from asignaturas
  where codigo_acceso = upper(trim(p_codigo)) and activa = true
  limit 1;
  if not found then
    raise exception 'Código no válido o asignatura inactiva';
  end if;
  if v_asignatura.codigo_expira is not null and v_asignatura.codigo_expira < current_date then
    raise exception 'Este código ha expirado';
  end if;

  select activo into v_activo from estudiantes_asignaturas
  where estudiante_id = auth.uid() and asignatura_id = v_asignatura.id;
  if found then
    if v_activo then
      return 'ya-inscrito';
    end if;
    update estudiantes_asignaturas set activo = true
    where estudiante_id = auth.uid() and asignatura_id = v_asignatura.id;
    return 'reactivada';
  end if;

  insert into estudiantes_asignaturas (estudiante_id, asignatura_id, activo)
  values (auth.uid(), v_asignatura.id, true);
  return 'creada';
end;
$$;

revoke execute on function buscar_asignatura_por_codigo(text) from public, anon;
revoke execute on function inscribirse_con_codigo(text) from public, anon;
grant execute on function buscar_asignatura_por_codigo(text) to authenticated;
grant execute on function inscribirse_con_codigo(text) to authenticated;

-- El estudiante ve solo las asignaturas en las que está (o estuvo) inscrito. La comprobación va
-- en una función SECURITY DEFINER: un EXISTS directo sobre estudiantes_asignaturas dispara sus
-- políticas, que a su vez consultan asignaturas -> "infinite recursion detected in policy".
create or replace function estudiante_inscrito_en(p_asignatura_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from estudiantes_asignaturas where asignatura_id = p_asignatura_id and estudiante_id = auth.uid());
$$;
revoke execute on function estudiante_inscrito_en(uuid) from public, anon;
grant execute on function estudiante_inscrito_en(uuid) to authenticated;

drop policy if exists estudiantes_ven_sus_asignaturas on asignaturas;
create policy estudiantes_ven_sus_asignaturas on asignaturas
  for select to authenticated
  using (estudiante_inscrito_en(id));

-- Se ejecuta DESPUÉS de publicar la app que usa las funciones de arriba.
drop policy if exists estudiantes_pueden_buscar_asignaturas on asignaturas;
drop policy if exists estudiantes_pueden_inscribirse on estudiantes_asignaturas;
drop policy if exists estudiantes_pueden_reactivar_inscripcion on estudiantes_asignaturas;
