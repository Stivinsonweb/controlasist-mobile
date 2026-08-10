// Edge Function: matricular-estudiantes-masivo
//
// Crea la cuenta de Auth + fila en `estudiantes` + matrícula en `estudiantes_asignaturas` para
// cada fila de la carga masiva del docente (punto 5 de la ronda de correcciones). Existe como
// Edge Function porque `auth.admin.createUser()` solo funciona con la service_role key, que NUNCA
// debe estar en el front-end (bypassa todo RLS). La service_role key vive solo como secret de esta
// función (`supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...`), nunca en el repo.
//
// El front (AsignaturasService.matricularEstudiantesMasivo) la invoca con
// `supabase.functions.invoke(...)`, que reenvía automáticamente el JWT del docente logueado en el
// header Authorization — con eso verificamos abajo que quien llama es un docente real y dueño de
// la asignatura antes de crear ninguna cuenta.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

const MAX_FILAS = 200;
const AVATAR_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

interface FilaCarga {
  nombres: string;
  apellidos: string;
  cedula?: string;
  email: string;
  password?: string;
  telefono?: string;
  programa?: string;
  tipo_documento?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { asignaturaId, filas } = (await req.json()) as { asignaturaId?: string; filas?: FilaCarga[] };
    if (!asignaturaId || !Array.isArray(filas)) {
      return new Response(JSON.stringify({ error: 'asignaturaId y filas son requeridos' }), { status: 400, headers: jsonHeaders });
    }
    if (filas.length === 0) {
      return new Response(JSON.stringify({ resultados: [] }), { headers: jsonHeaders });
    }
    if (filas.length > MAX_FILAS) {
      return new Response(JSON.stringify({ error: `Máximo ${MAX_FILAS} filas por carga` }), { status: 400, headers: jsonHeaders });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autenticado' }), { status: 401, headers: jsonHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Cliente "como el llamante": solo sirve para resolver quién es, respeta RLS normalmente.
    const callerClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const {
      data: { user },
      error: userError,
    } = await callerClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), { status: 401, headers: jsonHeaders });
    }

    // A partir de aquí, cliente admin (service_role): bypassa RLS a propósito para crear cuentas.
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data: docente, error: docenteError } = await admin.from('docentes').select('id').eq('user_id', user.id).maybeSingle();
    if (docenteError || !docente) {
      return new Response(JSON.stringify({ error: 'Solo un docente puede realizar cargas masivas' }), { status: 403, headers: jsonHeaders });
    }

    const { data: asignatura, error: asignaturaError } = await admin
      .from('asignaturas')
      .select('id, docente_id')
      .eq('id', asignaturaId)
      .maybeSingle();
    if (asignaturaError || !asignatura || asignatura.docente_id !== docente.id) {
      return new Response(JSON.stringify({ error: 'No tienes permiso sobre esta asignatura' }), { status: 403, headers: jsonHeaders });
    }

    const resultados: Array<{ fila: number; cedula?: string; nombres: string; resultado: string; detalle?: string }> = [];

    for (let i = 0; i < filas.length; i++) {
      const fila = filas[i];
      const base = { fila: i + 1, cedula: fila.cedula, nombres: `${fila.nombres ?? ''} ${fila.apellidos ?? ''}`.trim() };
      try {
        if (!fila.nombres || !fila.apellidos) throw new Error('Falta nombres o apellidos');
        if (!fila.email) throw new Error('Falta correo electrónico');

        let estudianteId: string | null = null;

        if (fila.cedula) {
          const { data } = await admin.from('estudiantes').select('id').eq('cedula', fila.cedula).maybeSingle();
          estudianteId = data?.id ?? null;
        }
        if (!estudianteId) {
          const { data } = await admin.from('estudiantes').select('id').eq('email', fila.email).maybeSingle();
          estudianteId = data?.id ?? null;
        }

        if (!estudianteId) {
          // Estudiante nuevo: sí necesita contraseña porque le vamos a crear la cuenta de Auth.
          if (!fila.password || fila.password.length < 6) {
            throw new Error('Falta contraseña válida (mínimo 6 caracteres) para crear la cuenta');
          }

          const { data: nuevoUsuario, error: createError } = await admin.auth.admin.createUser({
            email: fila.email,
            password: fila.password,
            email_confirm: true,
            user_metadata: { nombres: fila.nombres, apellidos: fila.apellidos, rol: 'estudiante' },
          });
          if (createError || !nuevoUsuario?.user) throw new Error(createError?.message || 'No se pudo crear la cuenta');

          const iniciales = `${(fila.nombres[0] ?? '').toUpperCase()}${(fila.apellidos[0] ?? '').toUpperCase()}`;
          const avatar_color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

          const { error: insertError } = await admin.from('estudiantes').insert([
            {
              id: nuevoUsuario.user.id,
              nombres: fila.nombres,
              apellidos: fila.apellidos,
              cedula: fila.cedula || null,
              email: fila.email,
              telefono: fila.telefono || null,
              programa: fila.programa || null,
              tipo_documento: fila.tipo_documento || 'CC',
              iniciales,
              avatar_color,
              activo: true,
            },
          ]);
          if (insertError) {
            // Si falla el insert en `estudiantes` deshacemos la cuenta de Auth para no dejarla huérfana.
            await admin.auth.admin.deleteUser(nuevoUsuario.user.id);
            throw new Error(insertError.message);
          }
          estudianteId = nuevoUsuario.user.id;
        }

        const { data: existente } = await admin
          .from('estudiantes_asignaturas')
          .select('id, activo')
          .eq('estudiante_id', estudianteId)
          .eq('asignatura_id', asignaturaId)
          .maybeSingle();

        if (existente) {
          if (existente.activo) {
            resultados.push({ ...base, resultado: 'ya-matriculado' });
          } else {
            await admin.from('estudiantes_asignaturas').update({ activo: true }).eq('id', existente.id);
            resultados.push({ ...base, resultado: 'reactivado' });
          }
        } else {
          const { error: matriculaError } = await admin
            .from('estudiantes_asignaturas')
            .insert([{ estudiante_id: estudianteId, asignatura_id: asignaturaId, activo: true }]);
          if (matriculaError) throw new Error(matriculaError.message);
          resultados.push({ ...base, resultado: 'matriculado' });
        }
      } catch (e) {
        const mensaje = e instanceof Error ? e.message : String(e);
        resultados.push({ ...base, resultado: 'error', detalle: mensaje.includes('duplicate key') ? 'Cédula o correo ya registrado' : mensaje });
      }
    }

    return new Response(JSON.stringify({ resultados }), { headers: jsonHeaders });
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: mensaje }), { status: 500, headers: jsonHeaders });
  }
});
