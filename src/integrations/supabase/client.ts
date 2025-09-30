import { createClient } from '@supabase/supabase-js';
import { env } from '@/config/environment';
import type { Database } from '@/lib/database.types';

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

const supabaseUrl = env.supabase.url || 'https://localhost.invalid';
const supabaseAnon = env.supabase.anonKey || 'anon-invalid';

if (!env.supabase.url || !env.supabase.anonKey) {
  // Log once to aid development without crashing the app
  // The client will still be created, but network calls will fail gracefully
  // until proper env vars are provided.

  console.warn(
    '[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY; using placeholder values.'
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnon);
