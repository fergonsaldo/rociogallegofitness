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

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) return errorResponse('Unauthorized', 401);

    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'coach') return errorResponse('Forbidden', 403);

    const { name, email, password } = await req.json();
    if (!name || !email || !password) return errorResponse('Faltan campos obligatorios.', 400);

    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) {
      const msg = createError.message.toLowerCase();
      if (msg.includes('already been registered') || msg.includes('already exists') || msg.includes('unique')) {
        return errorResponse('El email ya está registrado.', 409);
      }
      throw createError;
    }

    const newUserId = authData.user.id;

    const { error: profileError } = await supabaseAdmin.from('users').insert({
      id: newUserId,
      email,
      full_name: name,
      role: 'athlete',
      weight_unit: 'kg',
    });
    if (profileError && profileError.code !== '23505') throw profileError;

    const { error: linkError } = await supabaseAdmin.from('coach_athletes').insert({
      coach_id: user.id,
      athlete_id: newUserId,
      status: 'active',
    });
    if (linkError) throw linkError;

    return new Response(JSON.stringify({ id: newUserId }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error interno del servidor.';
    return errorResponse(message, 500);
  }
});
