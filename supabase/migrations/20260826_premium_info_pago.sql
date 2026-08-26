-- Agrega dónde el docente debe pagar (Nequi/banco/lo que sea) — texto libre configurable por
-- el admin, porque el flujo de comprobante manual no tenía ningún lugar donde indicarlo.
alter table configuracion_app
  add column if not exists premium_info_pago text;
