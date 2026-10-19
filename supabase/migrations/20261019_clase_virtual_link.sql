-- Clases virtuales:
--   1. Link fijo de la asignatura (asignaturas.link_clase): el estudiante lo ve con "Unirme a la clase".
--   2. El recordatorio de clase (15 min antes) avisa que es virtual y lleva al botón "Unirme".
--   3. "Link de hoy": el docente publica un link solo para la clase de hoy (links_clase_dia) y se
--      avisa al instante a los inscritos.
--   5. Al tocar "Unirme" dentro del horario, el ingreso queda registrado (ingresos_clase_virtual):
--      presente si entra hasta 15 min después del inicio, tarde si entra después. El docente lo
--      aplica a la lista de "Tomar asistencia" con un toque, igual que las marcas del QR.

alter table asignaturas add column if not exists link_clase text;

create table if not exists links_clase_dia (
  horario_id uuid not null references horarios(id) on delete cascade,
  fecha date not null,
  link text not null,
  publicado_en timestamptz not null default now(),
  primary key (horario_id, fecha)
);

create table if not exists ingresos_clase_virtual (
  horario_id uuid not null references horarios(id) on delete cascade,
  fecha date not null,
  estudiante_id uuid not null references estudiantes(id) on delete cascade,
  asignatura_id uuid not null references asignaturas(id) on delete cascade,
  estado text not null check (estado in ('presente', 'tarde')),
  ingreso_en timestamptz not null default now(),
  primary key (horario_id, fecha, estudiante_id)
);

alter table links_clase_dia enable row level security;
alter table ingresos_clase_virtual enable row level security;

-- Lectura: docente dueño y estudiantes inscritos. Las escrituras van solo por los RPC de abajo.
drop policy if exists docente_ve_links_dia on links_clase_dia;
create policy docente_ve_links_dia on links_clase_dia for select to authenticated
  using (exists (select 1 from horarios h where h.id = horario_id and docente_dueno_de_asignatura(h.asignatura_id)));
drop policy if exists estudiante_ve_links_dia on links_clase_dia;
create policy estudiante_ve_links_dia on links_clase_dia for select to authenticated
  using (exists (select 1 from horarios h where h.id = horario_id and estudiante_activo_en(h.asignatura_id)));

drop policy if exists docente_ve_ingresos_virtuales on ingresos_clase_virtual;
create policy docente_ve_ingresos_virtuales on ingresos_clase_virtual for select to authenticated
  using (docente_dueno_de_asignatura(asignatura_id));
drop policy if exists estudiante_ve_sus_ingresos on ingresos_clase_virtual;
create policy estudiante_ve_sus_ingresos on ingresos_clase_virtual for select to authenticated
  using (estudiante_id = auth.uid());

-- Link vigente de una clase en una fecha: el de ese día si se publicó, si no el fijo de la asignatura.
create or replace function link_clase_vigente(p_horario_id uuid, p_fecha date)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select l.link from links_clase_dia l where l.horario_id = p_horario_id and l.fecha = p_fecha),
    (select nullif(trim(a.link_clase), '') from horarios h join asignaturas a on a.id = h.asignatura_id where h.id = p_horario_id)
  );
$$;
revoke execute on function link_clase_vigente(uuid, date) from public, anon, authenticated;

-- ============================================================================
-- 3. Publicar el link de hoy y avisar a los estudiantes.
-- ============================================================================
create or replace function publicar_link_clase(p_horario_id uuid, p_link text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hoy date := (now() at time zone 'America/Bogota')::date;
  v_asignatura_id uuid;
  v_asignatura text;
  v_hora time;
  v_link text := trim(coalesce(p_link, ''));
begin
  select h.asignatura_id, a.nombre, h.hora_inicio into v_asignatura_id, v_asignatura, v_hora
  from horarios h join asignaturas a on a.id = h.asignatura_id
  where h.id = p_horario_id;
  if v_asignatura_id is null or not docente_dueno_de_asignatura(v_asignatura_id) then
    raise exception 'No autorizado';
  end if;
  if v_link !~* '^https?://' then
    raise exception 'El link debe empezar por http:// o https://';
  end if;

  insert into links_clase_dia (horario_id, fecha, link) values (p_horario_id, v_hoy, v_link)
  on conflict (horario_id, fecha) do update set link = excluded.link, publicado_en = now();

  insert into notificaciones (usuario_id, tipo, titulo, cuerpo)
  select ea.estudiante_id, 'link_clase', 'Clase virtual: ' || v_asignatura,
         'Hoy a las ' || to_char(v_hora, 'HH24:MI') || '. Toca para unirte (tu ingreso cuenta como asistencia).'
  from estudiantes_asignaturas ea
  where ea.asignatura_id = v_asignatura_id and ea.activo = true;
end;
$$;
revoke execute on function publicar_link_clase(uuid, text) from public, anon;
grant execute on function publicar_link_clase(uuid, text) to authenticated;

-- ============================================================================
-- 5. Unirse a la clase: devuelve el link y, si está dentro del horario, registra el ingreso.
-- ============================================================================
create or replace function unirse_clase_virtual(p_horario_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ahora timestamp := now() at time zone 'America/Bogota';
  v_hoy date := v_ahora::date;
  v_hora time := v_ahora::time;
  h horarios%rowtype;
  v_activa boolean;
  v_link text;
  v_estado text;
  v_insertadas int;
begin
  if auth.uid() is null or not exists (select 1 from estudiantes where id = auth.uid()) then
    return jsonb_build_object('resultado', 'no-estudiante');
  end if;

  select * into h from horarios where id = p_horario_id;
  if not found or not estudiante_activo_en(h.asignatura_id) then
    return jsonb_build_object('resultado', 'no-inscrito');
  end if;
  select activa into v_activa from asignaturas where id = h.asignatura_id;

  v_link := link_clase_vigente(h.id, v_hoy);
  if v_link is null then
    return jsonb_build_object('resultado', 'sin-link');
  end if;

  -- Fuera del horario de hoy: se entrega el link, pero no cuenta como asistencia.
  if not v_activa or not h.activo
     or h.dia_semana <> extract(dow from v_ahora)::int
     or (h.fecha_clase is not null and h.fecha_clase <> v_hoy)
     or v_hora < h.hora_inicio - interval '15 minutes'
     or v_hora > h.hora_fin then
    return jsonb_build_object('resultado', 'fuera-de-horario', 'link', v_link);
  end if;
  if h.fecha_ultima_actualizacion = v_hoy and h.estado in ('cancelada', 'aplazada') then
    return jsonb_build_object('resultado', 'cancelada', 'link', v_link);
  end if;

  v_estado := case when v_hora <= h.hora_inicio + interval '15 minutes' then 'presente' else 'tarde' end;
  insert into ingresos_clase_virtual (horario_id, fecha, estudiante_id, asignatura_id, estado)
  values (h.id, v_hoy, auth.uid(), h.asignatura_id, v_estado)
  on conflict (horario_id, fecha, estudiante_id) do nothing;
  get diagnostics v_insertadas = row_count;

  return jsonb_build_object(
    'resultado', case when v_insertadas = 1 then 'marcado' else 'ya-marcado' end,
    'estado', (select estado from ingresos_clase_virtual where horario_id = h.id and fecha = v_hoy and estudiante_id = auth.uid()),
    'link', v_link
  );
end;
$$;
revoke execute on function unirse_clase_virtual(uuid) from public, anon;
grant execute on function unirse_clase_virtual(uuid) to authenticated;

-- ============================================================================
-- 2. Recordatorio de clase: si la clase tiene link, el aviso lo dice y lleva a "Unirme".
--    (Además, la fecha de hoy se toma en hora de Colombia, no en UTC.)
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
  v_hoy date;
  v_ventana_desde time;
  v_ventana_hasta time;
  v_dia_semana int;
  v_virtual boolean;
  v_cuerpo text;
  clase record;
  estudiante record;
begin
  select coalesce(recordatorio_clase_minutos_antes, 15) into v_minutos from configuracion_app limit 1;
  if v_minutos is null then v_minutos := 15; end if;

  v_ahora_local := now() at time zone 'America/Bogota';
  v_hoy := v_ahora_local::date;
  v_dia_semana := extract(dow from v_ahora_local)::int;
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
      and not (h.fecha_ultima_actualizacion = v_hoy and h.estado in ('cancelada', 'aplazada'))
  loop
    v_virtual := link_clase_vigente(clase.horario_id, v_hoy) is not null;
    v_cuerpo := 'Empieza en ' || v_minutos || ' minutos — ' || to_char(clase.hora_inicio, 'HH24:MI');

    insert into recordatorios_clase_enviados (horario_id, fecha, usuario_id)
    values (clase.horario_id, v_hoy, clase.docente_user_id)
    on conflict do nothing;
    if found then
      insert into notificaciones (usuario_id, tipo, titulo, cuerpo)
      values (clase.docente_user_id, 'recordatorio_clase',
              'Próxima clase: ' || clase.asignatura_nombre,
              v_cuerpo || case when v_virtual then ' · clase virtual' else '' end);
    end if;

    for estudiante in
      select ea.estudiante_id
      from estudiantes_asignaturas ea
      where ea.asignatura_id = clase.asignatura_id and ea.activo = true
    loop
      insert into recordatorios_clase_enviados (horario_id, fecha, usuario_id)
      values (clase.horario_id, v_hoy, estudiante.estudiante_id)
      on conflict do nothing;
      if found then
        insert into notificaciones (usuario_id, tipo, titulo, cuerpo)
        values (estudiante.estudiante_id,
                case when v_virtual then 'recordatorio_clase_virtual' else 'recordatorio_clase' end,
                'Próxima clase: ' || clase.asignatura_nombre,
                v_cuerpo || case when v_virtual then ' · Clase virtual: toca para unirte' else '' end);
      end if;
    end loop;
  end loop;
end;
$$;
revoke execute on function generar_recordatorios_clase_debidos() from public, anon, authenticated;
