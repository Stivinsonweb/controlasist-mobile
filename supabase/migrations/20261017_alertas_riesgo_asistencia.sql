-- Alertas de riesgo de pérdida por fallas.
-- Cada vez que se guarda un registro de asistencia, se recalcula el % del estudiante en esa
-- asignatura (mismo cálculo que Reportes: presente + tarde + justificado cuentan como asistencia).
-- Si baja del 75 % (desde la 3.ª clase registrada) se notifica UNA vez al estudiante y al docente;
-- `alertas_riesgo_asistencia` evita repetir el aviso mientras siga por debajo. Si se recupera
-- (≥ 75 %), se borra la marca y, si vuelve a caer, se avisa de nuevo.

create table if not exists alertas_riesgo_asistencia (
  estudiante_id uuid not null references estudiantes(id) on delete cascade,
  asignatura_id uuid not null references asignaturas(id) on delete cascade,
  porcentaje int not null,
  enviada_en timestamptz not null default now(),
  primary key (estudiante_id, asignatura_id)
);
-- Tabla interna: sin políticas, solo la usa la función del trigger.
alter table alertas_riesgo_asistencia enable row level security;

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

  insert into notificaciones (usuario_id, tipo, titulo, cuerpo) values
    (NEW.estudiante_id, 'riesgo_asistencia', 'Riesgo de pérdida por fallas',
     format('Tu asistencia en %s está en %s%% (el mínimo es %s%%). Has faltado a %s de %s clases.',
            v_asignatura, v_pct, v_umbral, v_ausente, v_total));

  if v_docente_user is not null then
    insert into notificaciones (usuario_id, tipo, titulo, cuerpo) values
      (v_docente_user, 'riesgo_asistencia_docente', 'Estudiante en riesgo por fallas',
       format('%s tiene %s%% de asistencia en %s (%s fallas de %s clases).',
              v_estudiante, v_pct, v_asignatura, v_ausente, v_total));
  end if;

  return NEW;
end;
$$;
revoke execute on function revisar_riesgo_asistencia() from public, anon, authenticated;

drop trigger if exists trigger_revisar_riesgo_asistencia on registros_asistencia;
create trigger trigger_revisar_riesgo_asistencia
  after insert or update of estado on registros_asistencia
  for each row execute function revisar_riesgo_asistencia();
