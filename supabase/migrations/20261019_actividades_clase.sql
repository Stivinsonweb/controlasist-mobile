-- Actividades de clase: el docente publica actividades por asignatura (opcionalmente ligadas a
-- una clase del horario), los estudiantes inscritos las ven, entregan (archivo/enlace/comentario)
-- y reciben nota + retroalimentación. Avisos (notificaciones -> push vía el cron existente):
--   * al publicar una actividad, a los estudiantes inscritos activos;
--   * 24 h antes de la fecha de entrega, a quienes aún no han entregado;
--   * al calificar una entrega, al estudiante.
-- La alerta de riesgo por fallas ahora también cuenta las actividades vencidas sin entregar.

-- ============================================================================
-- 1. Helpers de permisos
-- ============================================================================
create or replace function docente_dueno_de_asignatura(p_asignatura_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from asignaturas a join docentes d on d.id = a.docente_id
    where a.id = p_asignatura_id and d.user_id = auth.uid()
  );
$$;
revoke execute on function docente_dueno_de_asignatura(uuid) from public, anon;
grant execute on function docente_dueno_de_asignatura(uuid) to authenticated;

create or replace function estudiante_activo_en(p_asignatura_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from estudiantes_asignaturas
    where asignatura_id = p_asignatura_id and estudiante_id = auth.uid() and activo = true
  );
$$;
revoke execute on function estudiante_activo_en(uuid) from public, anon;
grant execute on function estudiante_activo_en(uuid) to authenticated;

-- ============================================================================
-- 2. Tablas
-- ============================================================================
create table if not exists actividades (
  id uuid primary key default gen_random_uuid(),
  asignatura_id uuid not null references asignaturas(id) on delete cascade,
  -- Clase a la que pertenece (opcional): un horario de la asignatura y la fecha concreta.
  horario_id uuid references horarios(id) on delete set null,
  fecha_clase date,
  titulo text not null check (length(trim(titulo)) > 0),
  descripcion text,
  tipo text not null default 'tarea' check (tipo in ('tarea', 'taller', 'quiz', 'lectura', 'exposicion', 'proyecto', 'otro')),
  fecha_entrega timestamptz,
  permite_entregas boolean not null default true,
  calificable boolean not null default true,
  nota_maxima numeric(5,2) not null default 5 check (nota_maxima > 0),
  enlace text,
  -- Ruta dentro del bucket privado `actividades` (se lee con URL firmada).
  archivo_path text,
  archivo_nombre text,
  recordatorio_enviado boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists actividades_asignatura_idx on actividades (asignatura_id, created_at desc);
create index if not exists actividades_recordatorio_idx on actividades (fecha_entrega) where recordatorio_enviado = false;

create table if not exists entregas_actividad (
  id uuid primary key default gen_random_uuid(),
  actividad_id uuid not null references actividades(id) on delete cascade,
  estudiante_id uuid not null references estudiantes(id) on delete cascade,
  comentario text,
  enlace text,
  archivo_path text,
  archivo_nombre text,
  entregada_en timestamptz not null default now(),
  actualizada_en timestamptz not null default now(),
  nota numeric(5,2) check (nota is null or nota >= 0),
  retroalimentacion text,
  calificada_en timestamptz,
  unique (actividad_id, estudiante_id)
);
create index if not exists entregas_estudiante_idx on entregas_actividad (estudiante_id);

-- ============================================================================
-- 3. RLS
-- ============================================================================
alter table actividades enable row level security;
alter table entregas_actividad enable row level security;

drop policy if exists docente_gestiona_actividades on actividades;
create policy docente_gestiona_actividades on actividades
  for all to authenticated
  using (docente_dueno_de_asignatura(asignatura_id))
  with check (docente_dueno_de_asignatura(asignatura_id));

drop policy if exists estudiante_ve_actividades on actividades;
create policy estudiante_ve_actividades on actividades
  for select to authenticated
  using (estudiante_activo_en(asignatura_id));

drop policy if exists docente_ve_entregas on entregas_actividad;
create policy docente_ve_entregas on entregas_actividad
  for select to authenticated
  using (exists (select 1 from actividades a where a.id = actividad_id and docente_dueno_de_asignatura(a.asignatura_id)));

drop policy if exists docente_califica_entregas on entregas_actividad;
create policy docente_califica_entregas on entregas_actividad
  for update to authenticated
  using (exists (select 1 from actividades a where a.id = actividad_id and docente_dueno_de_asignatura(a.asignatura_id)))
  with check (exists (select 1 from actividades a where a.id = actividad_id and docente_dueno_de_asignatura(a.asignatura_id)));

drop policy if exists docente_registra_nota on entregas_actividad;
create policy docente_registra_nota on entregas_actividad
  for insert to authenticated
  with check (exists (select 1 from actividades a where a.id = actividad_id and docente_dueno_de_asignatura(a.asignatura_id)));

drop policy if exists estudiante_ve_su_entrega on entregas_actividad;
create policy estudiante_ve_su_entrega on entregas_actividad
  for select to authenticated
  using (estudiante_id = auth.uid());

drop policy if exists estudiante_entrega on entregas_actividad;
create policy estudiante_entrega on entregas_actividad
  for insert to authenticated
  with check (
    estudiante_id = auth.uid()
    and exists (select 1 from actividades a where a.id = actividad_id and a.permite_entregas and estudiante_activo_en(a.asignatura_id))
  );

drop policy if exists estudiante_actualiza_su_entrega on entregas_actividad;
create policy estudiante_actualiza_su_entrega on entregas_actividad
  for update to authenticated
  using (estudiante_id = auth.uid())
  with check (estudiante_id = auth.uid());

-- ============================================================================
-- 4. Reglas de entregas: el estudiante no toca la nota y no reenvía lo ya calificado;
--    el docente solo califica (no cambia lo que entregó el estudiante).
-- ============================================================================
create or replace function proteger_entrega_actividad()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actividad actividades%rowtype;
  v_es_docente boolean;
begin
  select * into v_actividad from actividades where id = NEW.actividad_id;
  v_es_docente := docente_dueno_de_asignatura(v_actividad.asignatura_id);

  if TG_OP = 'INSERT' and v_es_docente then
    -- El docente registra la nota de alguien que no entregó por la app (p. ej. quiz presencial).
    NEW.comentario := null;
    NEW.enlace := null;
    NEW.archivo_path := null;
    NEW.archivo_nombre := null;
    NEW.entregada_en := now();
    NEW.actualizada_en := now();
    if NEW.nota is not null and NEW.nota > v_actividad.nota_maxima then
      raise exception 'La nota no puede ser mayor que %', v_actividad.nota_maxima;
    end if;
    NEW.calificada_en := case when NEW.nota is null and NEW.retroalimentacion is null then null else now() end;
    return NEW;
  end if;

  if TG_OP = 'INSERT' then
    NEW.nota := null;
    NEW.retroalimentacion := null;
    NEW.calificada_en := null;
    NEW.entregada_en := now();
    NEW.actualizada_en := now();
    return NEW;
  end if;

  if v_es_docente then
    NEW.comentario := OLD.comentario;
    NEW.enlace := OLD.enlace;
    NEW.archivo_path := OLD.archivo_path;
    NEW.archivo_nombre := OLD.archivo_nombre;
    NEW.entregada_en := OLD.entregada_en;
    NEW.actualizada_en := OLD.actualizada_en;
    if NEW.nota is not null and NEW.nota > v_actividad.nota_maxima then
      raise exception 'La nota no puede ser mayor que %', v_actividad.nota_maxima;
    end if;
    if NEW.nota is distinct from OLD.nota or NEW.retroalimentacion is distinct from OLD.retroalimentacion then
      NEW.calificada_en := case when NEW.nota is null and NEW.retroalimentacion is null then null else now() end;
    end if;
  else
    if OLD.calificada_en is not null then
      raise exception 'Esta entrega ya fue calificada y no se puede modificar';
    end if;
    if not v_actividad.permite_entregas then
      raise exception 'Esta actividad no recibe entregas';
    end if;
    NEW.nota := OLD.nota;
    NEW.retroalimentacion := OLD.retroalimentacion;
    NEW.calificada_en := OLD.calificada_en;
    NEW.entregada_en := OLD.entregada_en;
    NEW.actualizada_en := now();
  end if;
  return NEW;
end;
$$;
revoke execute on function proteger_entrega_actividad() from public, anon, authenticated;

drop trigger if exists trigger_proteger_entrega_actividad on entregas_actividad;
create trigger trigger_proteger_entrega_actividad
  before insert or update on entregas_actividad
  for each row execute function proteger_entrega_actividad();

create or replace function tocar_updated_at_actividad()
returns trigger
language plpgsql
as $$
begin
  NEW.updated_at := now();
  -- Si cambia la fecha de entrega, el recordatorio de 24 h vuelve a quedar pendiente.
  if NEW.fecha_entrega is distinct from OLD.fecha_entrega then
    NEW.recordatorio_enviado := false;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trigger_tocar_updated_at_actividad on actividades;
create trigger trigger_tocar_updated_at_actividad
  before update on actividades
  for each row execute function tocar_updated_at_actividad();

-- ============================================================================
-- 5. Notificaciones
-- ============================================================================
create or replace function notificar_actividad_nueva()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_asignatura text;
  v_cuerpo text;
begin
  select nombre into v_asignatura from asignaturas where id = NEW.asignatura_id;
  v_cuerpo := NEW.titulo ||
    case when NEW.fecha_entrega is not null
      then ' · entrega: ' || to_char(NEW.fecha_entrega at time zone 'America/Bogota', 'DD/MM/YYYY HH24:MI')
      else '' end;

  insert into notificaciones (usuario_id, tipo, titulo, cuerpo)
  select ea.estudiante_id, 'actividad_nueva', 'Nueva actividad en ' || v_asignatura, v_cuerpo
  from estudiantes_asignaturas ea
  where ea.asignatura_id = NEW.asignatura_id and ea.activo = true;
  return NEW;
end;
$$;
revoke execute on function notificar_actividad_nueva() from public, anon, authenticated;

drop trigger if exists trigger_notificar_actividad_nueva on actividades;
create trigger trigger_notificar_actividad_nueva
  after insert on actividades
  for each row execute function notificar_actividad_nueva();

create or replace function notificar_entrega_calificada()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_titulo text;
  v_asignatura text;
  v_maxima numeric;
begin
  if NEW.calificada_en is null or (TG_OP = 'UPDATE' and NEW.calificada_en is not distinct from OLD.calificada_en) then
    return NEW;
  end if;
  select a.titulo, s.nombre, a.nota_maxima into v_titulo, v_asignatura, v_maxima
  from actividades a join asignaturas s on s.id = a.asignatura_id
  where a.id = NEW.actividad_id;

  insert into notificaciones (usuario_id, tipo, titulo, cuerpo) values
    (NEW.estudiante_id, 'actividad_calificada', 'Actividad calificada: ' || v_titulo,
     v_asignatura || case when NEW.nota is not null
       then ' · tu nota: ' || trim(to_char(NEW.nota, 'FM990.0')) || ' / ' || trim(to_char(v_maxima, 'FM990.0'))
       else ' · tienes retroalimentación de tu docente' end);
  return NEW;
end;
$$;
revoke execute on function notificar_entrega_calificada() from public, anon, authenticated;

drop trigger if exists trigger_notificar_entrega_calificada on entregas_actividad;
create trigger trigger_notificar_entrega_calificada
  after insert or update on entregas_actividad
  for each row execute function notificar_entrega_calificada();

-- Recordatorio 24 h antes de la entrega para quienes no han entregado. Corre con el cron.
create or replace function generar_recordatorios_actividades()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  act record;
begin
  for act in
    select a.id, a.asignatura_id, a.titulo, a.fecha_entrega, a.created_at, s.nombre as asignatura
    from actividades a join asignaturas s on s.id = a.asignatura_id
    where a.recordatorio_enviado = false
      and a.permite_entregas
      and a.fecha_entrega is not null
      and a.fecha_entrega > now()
      and a.fecha_entrega <= now() + interval '24 hours'
      and s.activa
  loop
    -- Si se publicó con menos de 24 h de plazo, el aviso de "nueva actividad" ya cubre el recordatorio.
    if act.created_at < act.fecha_entrega - interval '24 hours' then
      insert into notificaciones (usuario_id, tipo, titulo, cuerpo)
      select ea.estudiante_id, 'actividad_recordatorio', 'Entrega pronto: ' || act.titulo,
             act.asignatura || ' · vence ' || to_char(act.fecha_entrega at time zone 'America/Bogota', 'DD/MM HH24:MI')
      from estudiantes_asignaturas ea
      where ea.asignatura_id = act.asignatura_id and ea.activo = true
        and not exists (select 1 from entregas_actividad e where e.actividad_id = act.id and e.estudiante_id = ea.estudiante_id);
    end if;
    update actividades set recordatorio_enviado = true where id = act.id;
  end loop;
end;
$$;
revoke execute on function generar_recordatorios_actividades() from public, anon, authenticated;

select cron.schedule('recordatorios-actividades', '*/10 * * * *', $cron$ select generar_recordatorios_actividades(); $cron$);

-- ============================================================================
-- 6. Archivos: bucket privado `actividades`
--   <asignatura_id>/material/<actividad_id>/<archivo>                   (docente)
--   <asignatura_id>/entregas/<actividad_id>/<estudiante_id>/<archivo>   (estudiante)
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit)
values ('actividades', 'actividades', false, 20971520)
on conflict (id) do update set public = false, file_size_limit = 20971520;

create or replace function storage_actividades_permiso(p_nombre text, p_escritura boolean)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  f text[] := storage.foldername(p_nombre);
  v_asignatura uuid;
begin
  begin
    v_asignatura := f[1]::uuid;
  exception when others then
    return false;
  end;

  if f[2] = 'material' then
    return docente_dueno_de_asignatura(v_asignatura) or (not p_escritura and estudiante_activo_en(v_asignatura));
  elsif f[2] = 'entregas' then
    if f[4] = auth.uid()::text and estudiante_activo_en(v_asignatura) then
      return true;
    end if;
    return not p_escritura and docente_dueno_de_asignatura(v_asignatura);
  end if;
  return false;
end;
$$;
revoke execute on function storage_actividades_permiso(text, boolean) from public, anon;
grant execute on function storage_actividades_permiso(text, boolean) to authenticated;

drop policy if exists "Actividades: leer" on storage.objects;
drop policy if exists "Actividades: subir" on storage.objects;
drop policy if exists "Actividades: actualizar" on storage.objects;
drop policy if exists "Actividades: borrar" on storage.objects;
create policy "Actividades: leer" on storage.objects for select to authenticated
  using (bucket_id = 'actividades' and storage_actividades_permiso(name, false));
create policy "Actividades: subir" on storage.objects for insert to authenticated
  with check (bucket_id = 'actividades' and storage_actividades_permiso(name, true));
create policy "Actividades: actualizar" on storage.objects for update to authenticated
  using (bucket_id = 'actividades' and storage_actividades_permiso(name, true))
  with check (bucket_id = 'actividades' and storage_actividades_permiso(name, true));
create policy "Actividades: borrar" on storage.objects for delete to authenticated
  using (bucket_id = 'actividades' and storage_actividades_permiso(name, true));

-- ============================================================================
-- 7. Riesgo: la alerta de fallas también menciona las actividades vencidas sin entregar.
-- ============================================================================
create or replace function actividades_vencidas_sin_entregar(p_estudiante_id uuid, p_asignatura_id uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from actividades a
  where a.asignatura_id = p_asignatura_id
    and a.permite_entregas
    and a.fecha_entrega < now()
    and not exists (select 1 from entregas_actividad e where e.actividad_id = a.id and e.estudiante_id = p_estudiante_id);
$$;
revoke execute on function actividades_vencidas_sin_entregar(uuid, uuid) from public, anon, authenticated;

create or replace function revisar_riesgo_asistencia()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_umbral constant int := 75;
  v_minimo_clases constant int := 3;
  v_asignatura_id uuid;
  v_total int;
  v_asistio int;
  v_ausente int;
  v_pct int;
  v_asignatura text;
  v_docente_user uuid;
  v_estudiante text;
  v_sin_entregar int;
  v_extra text := '';
begin
  select asignatura_id into v_asignatura_id from asistencias where id = NEW.asistencia_id;
  if v_asignatura_id is null then
    return NEW;
  end if;

  select count(*),
         count(*) filter (where r.estado in ('presente', 'tarde', 'justificado')),
         count(*) filter (where r.estado = 'ausente')
    into v_total, v_asistio, v_ausente
  from registros_asistencia r
  join asistencias a on a.id = r.asistencia_id
  where r.estudiante_id = NEW.estudiante_id and a.asignatura_id = v_asignatura_id;

  if v_total < v_minimo_clases then
    return NEW;
  end if;

  v_pct := round(v_asistio * 100.0 / v_total);

  if v_pct >= v_umbral then
    delete from alertas_riesgo_asistencia where estudiante_id = NEW.estudiante_id and asignatura_id = v_asignatura_id;
    return NEW;
  end if;

  -- Ya se avisó y sigue por debajo: no se repite.
  insert into alertas_riesgo_asistencia (estudiante_id, asignatura_id, porcentaje)
  values (NEW.estudiante_id, v_asignatura_id, v_pct)
  on conflict (estudiante_id, asignatura_id) do nothing;
  if not found then
    return NEW;
  end if;

  select s.nombre, d.user_id into v_asignatura, v_docente_user
  from asignaturas s join docentes d on d.id = s.docente_id
  where s.id = v_asignatura_id;
  select trim(nombres || ' ' || apellidos) into v_estudiante from estudiantes where id = NEW.estudiante_id;

  v_sin_entregar := actividades_vencidas_sin_entregar(NEW.estudiante_id, v_asignatura_id);
  if v_sin_entregar > 0 then
    v_extra := format(' Además tiene %s actividad(es) vencida(s) sin entregar.', v_sin_entregar);
  end if;

  insert into notificaciones (usuario_id, tipo, titulo, cuerpo) values
    (NEW.estudiante_id, 'riesgo_asistencia', 'Riesgo de pérdida por fallas',
     format('Tu asistencia en %s está en %s%% (el mínimo es %s%%). Has faltado a %s de %s clases.',
            v_asignatura, v_pct, v_umbral, v_ausente, v_total) || replace(v_extra, 'tiene', 'tienes'));

  if v_docente_user is not null then
    insert into notificaciones (usuario_id, tipo, titulo, cuerpo) values
      (v_docente_user, 'riesgo_asistencia_docente', 'Estudiante en riesgo por fallas',
       format('%s tiene %s%% de asistencia en %s (%s fallas de %s clases).',
              v_estudiante, v_pct, v_asignatura, v_ausente, v_total) || v_extra);
  end if;

  return NEW;
end;
$$;
revoke execute on function revisar_riesgo_asistencia() from public, anon, authenticated;

-- Ajustes de seguridad (avisos del linter de Supabase).
alter function tocar_updated_at_actividad() set search_path = public;
revoke execute on function reactivar_asignatura(uuid) from public, anon;
grant execute on function reactivar_asignatura(uuid) to authenticated;
