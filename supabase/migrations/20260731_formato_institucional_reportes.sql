-- Punto 6: config del formato institucional de reportes (historial de clases exportable).
-- Guardado por docente (se reutiliza en todas sus asignaturas).
alter table docentes
  add column if not exists logo_institucional_url text,
  add column if not exists formato_reporte_codigo text,
  add column if not exists formato_reporte_version text,
  add column if not exists formato_reporte_titulo text default 'FORMATO PARA REGISTRO DE CLASES Y ASISTENCIA DOCENTE',
  add column if not exists formato_reporte_segunda_firma text;

-- Bucket público para logos institucionales, mismo patrón que el bucket 'avatares' ya existente
-- (políticas simples por auth.role(), sin restricción por carpeta — igual que 'avatares').
insert into storage.buckets (id, name, public)
values ('logos-institucionales', 'logos-institucionales', true)
on conflict (id) do nothing;

drop policy if exists "Logos institucionales públicos para lectura" on storage.objects;
create policy "Logos institucionales públicos para lectura"
on storage.objects for select
using (bucket_id = 'logos-institucionales');

drop policy if exists "Usuarios autenticados pueden subir logos institucionales" on storage.objects;
create policy "Usuarios autenticados pueden subir logos institucionales"
on storage.objects for insert
with check (bucket_id = 'logos-institucionales' and auth.role() = 'authenticated');

drop policy if exists "Usuarios pueden actualizar logos institucionales" on storage.objects;
create policy "Usuarios pueden actualizar logos institucionales"
on storage.objects for update
using (bucket_id = 'logos-institucionales' and auth.role() = 'authenticated');

drop policy if exists "Usuarios pueden eliminar logos institucionales" on storage.objects;
create policy "Usuarios pueden eliminar logos institucionales"
on storage.objects for delete
using (bucket_id = 'logos-institucionales' and auth.role() = 'authenticated');
