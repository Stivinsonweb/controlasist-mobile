-- Opciones de pago estructuradas (Nequi, Daviplata, Bancolombia, etc.) en vez de un solo campo de
-- texto libre — cada una con su propio dato (número/cuenta) y si está activa o no. `premium_info_pago`
-- (texto libre) se conserva como nota adicional opcional, no se reemplaza.
alter table configuracion_app
  add column if not exists metodos_pago_premium jsonb;
