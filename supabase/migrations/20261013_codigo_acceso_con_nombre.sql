-- El código de acceso de una asignatura ahora empieza por el nombre y el código de la asignatura:
-- NOMBRE-CODIGO-XXXX (4 primeras letras del nombre, código sin espacios ni tildes, 4 caracteres
-- aleatorios para que no choquen grupos de la misma materia). Ej: "Diseño 3D" (20008) → DISE-20008-K3MX.
-- Mismo formato que generarCodigoAcceso() en asignaturas.service.ts (botón "Regenerar código").
-- Los códigos existentes no se tocan: siguen funcionando hasta que el docente los regenere.

alter table public.asignaturas alter column codigo_acceso type varchar(40);

create or replace function public.limpiar_para_codigo(p_texto text)
returns text
language sql
immutable
set search_path = public
as $$
  select regexp_replace(
    upper(translate(coalesce(p_texto, ''), 'áéíóúàèìòùäëïöüâêîôûñÁÉÍÓÚÀÈÌÒÙÄËÏÖÜÂÊÎÔÛÑ', 'aeiouaeiouaeiouaeiounAEIOUAEIOUAEIOUAEIOUN')),
    '[^A-Z0-9]', '', 'g'
  );
$$;

-- El trigger corre con el rol del docente (no es SECURITY DEFINER), así que authenticated la necesita.
revoke execute on function public.limpiar_para_codigo(text) from public, anon;
grant execute on function public.limpiar_para_codigo(text) to authenticated;

create or replace function public.generar_codigo_acceso_trigger()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  prefijo text;
  sufijo text;
  candidato text;
  intentos int := 0;
begin
  if NEW.codigo_acceso is null then
    prefijo := concat_ws('-',
      nullif(left(limpiar_para_codigo(NEW.nombre), 4), ''),
      nullif(left(limpiar_para_codigo(NEW.codigo), 20), ''));

    loop
      sufijo := '';
      for i in 1..4 loop
        sufijo := sufijo || substr(chars, floor(random() * length(chars))::int + 1, 1);
      end loop;
      candidato := concat_ws('-', nullif(prefijo, ''), sufijo);

      exit when not exists (select 1 from asignaturas where codigo_acceso = candidato);

      intentos := intentos + 1;
      if intentos > 20 then
        raise exception 'No se pudo generar un código de acceso único';
      end if;
    end loop;

    NEW.codigo_acceso := candidato;
  end if;
  return NEW;
end;
$$;
