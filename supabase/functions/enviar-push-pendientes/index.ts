// Edge Function: enviar-push-pendientes
//
// Despachador genérico de notificaciones push (Funcionalidad 5), reutilizado también por la
// Parte 2 (Premium: aprobación/rechazo de solicitud o pago, aviso de vencimiento a 3 días).
// No decide QUÉ notificar — eso ya lo hicieron las funciones SECURITY DEFINER de Postgres
// (generar_recordatorios_clase_debidos, premium_revisar_vencimientos_diario, los RPC de
// aprobar/rechazar) insertando filas en `notificaciones` con enviado_push = false. Esta función
// solo escanea esa cola y hace el envío real: la criptografía VAPID (firma + cifrado del payload)
// necesita un runtime JS/Deno, no se puede hacer en SQL puro — por eso vive aparte.
//
// La dispara `pg_cron` cada 10 minutos vía `pg_net.http_post` (ver migración
// 20260826_notificaciones_push.sql) — no espera body ni la llama el frontend directamente.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'https://esm.sh/web-push@3.6.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

const LOTE = 200;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!vapidPublicKey || !vapidPrivateKey) {
      return new Response(JSON.stringify({ error: 'Faltan VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY como secrets de esta función' }), {
        status: 500,
        headers: jsonHeaders,
      });
    }

    webpush.setVapidDetails('mailto:soporte@controlasist.app', vapidPublicKey, vapidPrivateKey);

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: pendientes, error: pendientesError } = await supabase
      .from('notificaciones')
      .select('id, usuario_id, titulo, cuerpo')
      .eq('enviado_push', false)
      .order('created_at', { ascending: true })
      .limit(LOTE);
    if (pendientesError) throw pendientesError;
    if (!pendientes || pendientes.length === 0) {
      return new Response(JSON.stringify({ procesadas: 0, enviadas: 0 }), { headers: jsonHeaders });
    }

    const usuarioIds = [...new Set(pendientes.map((n: any) => n.usuario_id))];
    const { data: suscripciones, error: suscripcionesError } = await supabase
      .from('push_subscriptions')
      .select('id, usuario_id, endpoint, p256dh, auth_key')
      .in('usuario_id', usuarioIds);
    if (suscripcionesError) throw suscripcionesError;

    const suscripcionesPorUsuario = new Map<string, typeof suscripciones>();
    for (const s of suscripciones || []) {
      const lista = suscripcionesPorUsuario.get(s.usuario_id) || [];
      lista.push(s);
      suscripcionesPorUsuario.set(s.usuario_id, lista);
    }

    let enviadas = 0;
    const suscripcionesMuertas: string[] = [];

    for (const n of pendientes) {
      const misSuscripciones = suscripcionesPorUsuario.get(n.usuario_id) || [];
      const payload = JSON.stringify({
        notification: {
          title: n.titulo,
          body: n.cuerpo,
          icon: '/icons/icon-192.png',
          data: { onActionClick: { default: { operation: 'openWindow', url: '/' } } },
        },
      });

      for (const s of misSuscripciones) {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth_key } },
            payload
          );
          enviadas++;
        } catch (e: any) {
          // 404/410 = el navegador invalidó la suscripción (desinstaló la PWA, limpió datos, etc.)
          if (e?.statusCode === 404 || e?.statusCode === 410) {
            suscripcionesMuertas.push(s.id);
          } else {
            console.error(`Error enviando push a suscripción ${s.id}:`, e?.message || e);
          }
        }
      }
    }

    if (suscripcionesMuertas.length > 0) {
      await supabase.from('push_subscriptions').delete().in('id', suscripcionesMuertas);
    }

    const idsNotificaciones = pendientes.map((n: any) => n.id);
    await supabase.from('notificaciones').update({ enviado_push: true }).in('id', idsNotificaciones);

    return new Response(JSON.stringify({ procesadas: pendientes.length, enviadas, suscripciones_eliminadas: suscripcionesMuertas.length }), {
      headers: jsonHeaders,
    });
  } catch (e: any) {
    console.error('Error en enviar-push-pendientes:', e);
    return new Response(JSON.stringify({ error: e.message || String(e) }), { status: 500, headers: jsonHeaders });
  }
});
