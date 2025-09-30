// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { stripe } from './stripe/config.ts';

// Reusable CORS headers
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, idempotency-key',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Cache-Control': 'no-store'
};

// Initialize Supabase client (end-user context via Authorization header)
export const createSupabaseClient = (req: Request) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  
  // Get auth token from the request header
  const authHeader = req.headers.get('Authorization');
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: authHeader! },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  });
};

// Initialize Supabase client with service role (no end-user context)
export const createServiceSupabaseClient = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  });
};

// Lazy Sentry integration for Deno
let sentryInitialized = false;
let SentryMod: any = null;
async function ensureSentry() {
  if (sentryInitialized) return SentryMod;
  const dsn = Deno.env.get('SENTRY_DSN');
  if (!dsn) return null;
  try {
    // Using deno.land Sentry build; if import fails, we simply skip reporting
    // Version pin can be adjusted as needed
    // deno-lint-ignore no-await-in-loop
    SentryMod = await import('https://deno.land/x/sentry@7.106.1/index.mjs');
    SentryMod.init({ dsn });
    sentryInitialized = true;
    return SentryMod;
  } catch (_e) {
    return null;
  }
}

export async function reportErrorToSentry(error: unknown, context?: Record<string, unknown>) {
  try {
    const mod = await ensureSentry();
    if (mod && mod.captureException) {
      mod.captureException(error, { extra: context ?? {} });
    }
  } catch (_e) {}
}

// Collections mapping for Supabase tables
export const COLLECTIONS = {
  USERS: 'users',
  CUSTOMERS: 'stripe_customers',
  SUBSCRIPTIONS: 'stripe_subscriptions',
  PAYMENT_METHODS: 'stripe_payment_methods',
  PAYMENT_HISTORY: 'payment_history',
  IDEMPOTENCY_KEYS: 'idempotency_keys',
  OUTBOX_EVENTS: 'outbox_events',
  STRIPE_EVENTS: 'stripe_events'
};

// Helper to format JSON responses consistently
export const jsonResponse = (data: unknown, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
};

// Helper function to format errors
export const formatError = (error: Error) => {
  // Best-effort Sentry report
  // deno-lint-ignore no-floating-promises
  reportErrorToSentry(error, { source: 'edge_function' });
  return new Response(
    JSON.stringify({
      error: error.message || 'An internal error occurred.',
    }),
    {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};

export { stripe };
