-- Las funciones de mantenimiento que dispara pg_cron (como el rol postgres) eran ejecutables por
-- cualquiera vía /rest/v1/rpc/..., incluso sin iniciar sesión, y no validan quién las llama.
-- Solo las usan los jobs 'recordatorios-clase-y-push' y 'premium-vencimientos-diario'; ni el
-- frontend ni la Edge Function enviar-push-pendientes las invocan. Se deja EXECUTE solo a
-- postgres (dueño, usado por pg_cron) y service_role.

revoke execute on function public.generar_recordatorios_clase_debidos() from public, anon, authenticated;
revoke execute on function public.premium_revisar_vencimientos_diario() from public, anon, authenticated;

grant execute on function public.generar_recordatorios_clase_debidos() to service_role;
grant execute on function public.premium_revisar_vencimientos_diario() to service_role;
