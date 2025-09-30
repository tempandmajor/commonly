import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const createSupabaseClient = (req: Request) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const authHeader = req.headers.get('Authorization');
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: authHeader ? { Authorization: authHeader } : {} },
    auth: { persistSession: false, autoRefreshToken: false },
  });
};

export const formatError = (error: Error) => {
  return new Response(
    JSON.stringify({ error: error.message || 'Internal error' }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  );
};
