import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function errorResponse(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return errorResponse('Unauthorized', 401);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return errorResponse('Unauthorized', 401);

    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'coach') return errorResponse('Forbidden', 403);

    const { athleteId, password } = await req.json();
    if (!athleteId || !password) return errorResponse('Faltan campos obligatorios.', 400);

    const { count } = await supabaseAdmin
      .from('coach_athletes')
      .select('*', { count: 'exact', head: true })
      .eq('coach_id', user.id)
      .eq('athlete_id', athleteId)
      .eq('status', 'active');

    if (!count) return errorResponse('Forbidden', 403);

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      athleteId,
      { password },
    );

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error interno del servidor.';
    return errorResponse(message, 500);
  }
});
