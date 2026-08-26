-- [BUG 1] El código de inscripción no funciona la primera vez.
--
-- Causa raíz: el trigger `trigger_generar_codigo_acceso` (BEFORE INSERT en asignaturas)
-- generaba el primer código concatenando datos públicos y predecibles:
--   UPPER(codigo[1:6] || '-' || grupo || '-' || periodo[1:6])
-- ej. "20008-A-2026-1". Como codigo_acceso tiene UNIQUE a nivel de toda la tabla (no por
-- docente), cualquier otra asignatura con el mismo codigo+grupo+periodo (frecuente: distintas
-- secciones de la misma materia en el mismo periodo) genera el mismo valor y choca con esa
-- restricción única, o produce un código que no es un código de invitación real. En cambio
-- "Regenerar código" en la app sí usa un generador aleatorio con reintento ante colisión
-- (AsignaturasService.regenerarCodigoAcceso) — por eso ese camino sí funciona.
--
-- Fix: el trigger ahora genera un código aleatorio con el mismo alfabeto y formato que usa el
-- cliente (4 caracteres - 4 caracteres, sin caracteres ambiguos), verificando unicidad contra
-- la tabla antes de asignarlo. Así el primer código ya nace único y funcional, igual que uno
-- regenerado.
create or replace function generar_codigo_acceso_trigger()
returns trigger
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  candidato text;
  intentos int := 0;
begin
  if NEW.codigo_acceso is null then
    loop
      candidato := '';
      for i in 1..8 loop
        candidato := candidato || substr(chars, floor(random() * length(chars))::int + 1, 1);
        if i = 4 then
          candidato := candidato || '-';
        end if;
      end loop;

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
