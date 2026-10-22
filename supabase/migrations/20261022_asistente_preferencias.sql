-- Personalización de Asis por usuario: animal de la mascota y sonido (o silencio).
create table if not exists asistente_preferencias (
  usuario_id uuid primary key default auth.uid(),
  animal text not null default 'buho' check (animal in ('buho', 'gato', 'perro', 'pinguino')),
  sonido text not null default 'buho' check (sonido in ('buho', 'gato', 'perro', 'pinguino', 'campana', 'burbuja', 'ninguno')),
  updated_at timestamptz not null default now()
);
alter table asistente_preferencias enable row level security;
drop policy if exists usuario_gestiona_sus_preferencias on asistente_preferencias;
create policy usuario_gestiona_sus_preferencias on asistente_preferencias for all to authenticated
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
