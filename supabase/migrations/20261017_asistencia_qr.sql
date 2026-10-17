-- Asistencia con código QR.
-- El docente abre una sesión para una clase (asignatura + fecha + horario) y proyecta un QR que
-- cambia cada 10 s. El QR lleva un token = HMAC(secreto de la sesión, ventana de 10 s). El
-- estudiante lo escanea y el servidor valida el token (ventana actual o anterior), que la sesión
-- esté abierta y que esté inscrito. Las marcas quedan en `marcas_qr`; el docente las aplica a la
-- lista de "Tomar asistencia" y guarda como siempre (no se crean filas en `asistencias` aquí).

create table if not exists sesiones_qr (
  id uuid primary key default gen_random_uuid(),
  asignatura_id uuid not null references asignaturas(id) on delete cascade,
  docente_id uuid not null references docentes(id) on delete cascade,
  fecha date not null,
  hora_inicio time not null,
  hora_fin time not null,
  secreto text not null,
  marcar_como text not null default 'presente' check (marcar_como in ('presente', 'tarde')),
  activa boolean not null default true,
  creada_en timestamptz not null default now(),
  expira_en timestamptz not null default now() + interval '4 hours'
);
create index if not exists sesiones_qr_clase_idx on sesiones_qr (asignatura_id, fecha, hora_inicio, hora_fin);

create table if not exists marcas_qr (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references sesiones_qr(id) on delete cascade,
  estudiante_id uuid not null references estudiantes(id) on delete cascade,
  estado text not null check (estado in ('presente', 'tarde')),
  marcado_en timestamptz not null default now(),
  unique (sesion_id, estudiante_id)
);

alter table sesiones_qr enable row level security;
alter table marcas_qr enable row level security;

-- El docente ve y actualiza (cerrar, presente/tarde) solo sus sesiones. Se crean por RPC.
create policy docente_ve_sus_sesiones_qr on sesiones_qr for select to authenticated
  using (docente_id in (select id from docentes where user_id = auth.uid()));
create policy docente_actualiza_sus_sesiones_qr on sesiones_qr for update to authenticated
  using (docente_id in (select id from docentes where user_id = auth.uid()))
  with check (docente_id in (select id from docentes where user_id = auth.uid()));

-- Marcas: el docente ve las de sus sesiones; el estudiante, las suyas. Se crean por RPC.
create policy docente_ve_marcas_qr on marcas_qr for select to authenticated
  using (sesion_id in (select s.id from sesiones_qr s join docentes d on d.id = s.docente_id where d.user_id = auth.uid()));
create policy estudiante_ve_sus_marcas_qr on marcas_qr for select to authenticated
  using (estudiante_id = auth.uid());

-- Token de una ventana de 10 s. El navegador del docente calcula exactamente lo mismo con
-- SubtleCrypto (HMAC-SHA256, clave = secreto, mensaje = número de ventana en texto).
create or replace function token_qr(p_secreto text, p_ventana bigint)
returns text
language sql
immutable
set search_path = public, extensions
as $$
  select substr(encode(hmac(p_ventana::text, p_secreto, 'sha256'), 'hex'), 1, 16);
$$;
revoke execute on function token_qr(text, bigint) from public, anon, authenticated;

-- Abre (o retoma, si ya hay una abierta para esa clase) la sesión QR del docente.
create or replace function iniciar_sesion_qr(p_asignatura_id uuid, p_fecha date, p_hora_inicio time, p_hora_fin time)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_docente_id uuid;
  v_sesion sesiones_qr%rowtype;
begin
  select d.id into v_docente_id
  from asignaturas a join docentes d on d.id = a.docente_id
  where a.id = p_asignatura_id and d.user_id = auth.uid();
  if v_docente_id is null then
    raise exception 'No autorizado';
  end if;

  select * into v_sesion from sesiones_qr
  where asignatura_id = p_asignatura_id and fecha = p_fecha and hora_inicio = p_hora_inicio and hora_fin = p_hora_fin
    and activa and expira_en > now()
  order by creada_en desc limit 1;

  if not found then
    insert into sesiones_qr (asignatura_id, docente_id, fecha, hora_inicio, hora_fin, secreto)
    values (p_asignatura_id, v_docente_id, p_fecha, p_hora_inicio, p_hora_fin, encode(gen_random_bytes(24), 'hex'))
    returning * into v_sesion;
  end if;

  return jsonb_build_object(
    'id', v_sesion.id,
    'secreto', v_sesion.secreto,
    'marcar_como', v_sesion.marcar_como,
    -- Hora del servidor: el navegador corrige la diferencia con su reloj para que el token coincida.
    'servidor_ms', floor(extract(epoch from clock_timestamp()) * 1000)
  );
end;
$$;

-- El estudiante marca su asistencia con el QR.
create or replace function marcar_asistencia_qr(p_sesion_id uuid, p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_sesion sesiones_qr%rowtype;
  v_ventana bigint := floor(extract(epoch from clock_timestamp()) / 10);
  v_asignatura text;
  v_insertadas int;
begin
  if auth.uid() is null or not exists (select 1 from estudiantes where id = auth.uid()) then
    return jsonb_build_object('resultado', 'no-estudiante');
  end if;

  select * into v_sesion from sesiones_qr where id = p_sesion_id;
  if not found then
    return jsonb_build_object('resultado', 'no-encontrada');
  end if;
  select nombre into v_asignatura from asignaturas where id = v_sesion.asignatura_id;

  if not v_sesion.activa or v_sesion.expira_en <= now() then
    return jsonb_build_object('resultado', 'cerrada', 'asignatura', v_asignatura);
  end if;

  -- Se acepta el código actual y el de la ventana anterior (hasta ~20 s de antigüedad).
  if lower(coalesce(p_token, '')) not in (token_qr(v_sesion.secreto, v_ventana), token_qr(v_sesion.secreto, v_ventana - 1)) then
    return jsonb_build_object('resultado', 'vencido', 'asignatura', v_asignatura);
  end if;

  if not exists (
    select 1 from estudiantes_asignaturas
    where estudiante_id = auth.uid() and asignatura_id = v_sesion.asignatura_id and activo
  ) then
    return jsonb_build_object('resultado', 'no-inscrito', 'asignatura', v_asignatura);
  end if;

  insert into marcas_qr (sesion_id, estudiante_id, estado)
  values (v_sesion.id, auth.uid(), v_sesion.marcar_como)
  on conflict (sesion_id, estudiante_id) do nothing;
  get diagnostics v_insertadas = row_count;

  return jsonb_build_object(
    'resultado', case when v_insertadas = 1 then 'marcado' else 'ya-marcado' end,
    'asignatura', v_asignatura,
    'estado', (select estado from marcas_qr where sesion_id = v_sesion.id and estudiante_id = auth.uid())
  );
end;
$$;

revoke execute on function iniciar_sesion_qr(uuid, date, time, time) from public, anon;
revoke execute on function marcar_asistencia_qr(uuid, text) from public, anon;
grant execute on function iniciar_sesion_qr(uuid, date, time, time) to authenticated;
grant execute on function marcar_asistencia_qr(uuid, text) to authenticated;
