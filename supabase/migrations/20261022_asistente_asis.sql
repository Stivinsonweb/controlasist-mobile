-- Asis, el asistente inteligente (Edge Function `asistente-chat`, IA en Groq).
-- 1. Límite diario de preguntas por usuario (el cupo gratis de Groq es por toda la app).
-- 2. Resumen de asistencia por asignatura para que Asis lea "reportes". SECURITY INVOKER:
--    corre con los permisos del usuario, así que un docente solo obtiene sus asignaturas.

create table if not exists asistente_uso (
  usuario_id uuid not null,
  fecha date not null,
  preguntas int not null default 0,
  primary key (usuario_id, fecha)
);
alter table asistente_uso enable row level security;
drop policy if exists usuario_ve_su_uso on asistente_uso;
create policy usuario_ve_su_uso on asistente_uso for select to authenticated using (usuario_id = auth.uid());

-- Suma una pregunta si no se ha llegado al límite del día (hora de Colombia).
create or replace function asistente_consumir(p_limite int)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hoy date := (now() at time zone 'America/Bogota')::date;
  v_usadas int;
begin
  if auth.uid() is null then
    return jsonb_build_object('permitido', false, 'usadas', 0, 'limite', p_limite);
  end if;
  insert into asistente_uso (usuario_id, fecha, preguntas) values (auth.uid(), v_hoy, 0)
  on conflict do nothing;
  update asistente_uso set preguntas = preguntas + 1
  where usuario_id = auth.uid() and fecha = v_hoy and preguntas < p_limite
  returning preguntas into v_usadas;
  if v_usadas is null then
    return jsonb_build_object('permitido', false, 'usadas', p_limite, 'limite', p_limite);
  end if;
  return jsonb_build_object('permitido', true, 'usadas', v_usadas, 'limite', p_limite);
end;
$$;
revoke execute on function asistente_consumir(int) from public, anon;
grant execute on function asistente_consumir(int) to authenticated;

-- Resumen de asistencia de una asignatura (mismo cálculo que Reportes: presente, tarde y
-- justificado cuentan como asistencia).
create or replace function asistente_resumen_asistencia(p_asignatura_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with regs as (
    select r.estudiante_id, r.estado
    from registros_asistencia r
    join asistencias a on a.id = r.asistencia_id
    where a.asignatura_id = p_asignatura_id
  ),
  por_estudiante as (
    select e.id, trim(e.nombres || ' ' || e.apellidos) as nombre,
           count(*) as total,
           count(*) filter (where g.estado = 'presente') as presente,
           count(*) filter (where g.estado = 'tarde') as tarde,
           count(*) filter (where g.estado = 'justificado') as justificado,
           count(*) filter (where g.estado = 'ausente') as ausente
    from regs g join estudiantes e on e.id = g.estudiante_id
    group by e.id, e.nombres, e.apellidos
  )
  select jsonb_build_object(
    'clases_registradas', (select count(*) from asistencias where asignatura_id = p_asignatura_id),
    'porcentaje_general', (select case when count(*) = 0 then null else round(100.0 * count(*) filter (where estado <> 'ausente') / count(*)) end from regs),
    'estudiantes', coalesce((select jsonb_agg(jsonb_build_object(
        'nombre', nombre, 'porcentaje', round(100.0 * (presente + tarde + justificado) / total),
        'presente', presente, 'tarde', tarde, 'justificado', justificado, 'ausente', ausente, 'clases', total)
        order by (presente + tarde + justificado)::numeric / total, nombre)
      from por_estudiante), '[]'::jsonb)
  );
$$;
revoke execute on function asistente_resumen_asistencia(uuid) from public, anon;
grant execute on function asistente_resumen_asistencia(uuid) to authenticated;

-- 3. Historial de conversaciones con Asis: cada usuario ve, retoma y borra solo las suyas.
--    Los mensajes los escribe la Edge Function (con el JWT del usuario); una propuesta de acción
--    queda guardada en el mensaje con su estado (pendiente / confirmada / cancelada).
create table if not exists asistente_conversaciones (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null default auth.uid(),
  titulo text not null default 'Nueva conversación',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists asistente_conversaciones_usuario_idx on asistente_conversaciones (usuario_id, updated_at desc);

create table if not exists asistente_mensajes (
  id uuid primary key default gen_random_uuid(),
  conversacion_id uuid not null references asistente_conversaciones(id) on delete cascade,
  usuario_id uuid not null default auth.uid(),
  rol text not null check (rol in ('user', 'assistant')),
  contenido text not null,
  propuesta jsonb,
  propuesta_estado text check (propuesta_estado in ('pendiente', 'confirmada', 'cancelada')),
  created_at timestamptz not null default now()
);
create index if not exists asistente_mensajes_conversacion_idx on asistente_mensajes (conversacion_id, created_at);

alter table asistente_conversaciones enable row level security;
alter table asistente_mensajes enable row level security;

drop policy if exists usuario_gestiona_sus_conversaciones on asistente_conversaciones;
create policy usuario_gestiona_sus_conversaciones on asistente_conversaciones for all to authenticated
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

drop policy if exists usuario_gestiona_sus_mensajes on asistente_mensajes;
create policy usuario_gestiona_sus_mensajes on asistente_mensajes for all to authenticated
  using (usuario_id = auth.uid())
  with check (usuario_id = auth.uid() and exists (select 1 from asistente_conversaciones c where c.id = conversacion_id and c.usuario_id = auth.uid()));
