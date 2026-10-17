-- Sección de Notificaciones: cada usuario puede borrar sus propias notificaciones.
drop policy if exists usuarios_eliminan_sus_notificaciones on notificaciones;
create policy usuarios_eliminan_sus_notificaciones on notificaciones
  for delete to authenticated
  using (usuario_id = auth.uid());
