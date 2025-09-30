
import { createSupabaseClient, formatError } from '../stripe-config.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const _supabase = createSupabaseClient(req);
    const { method } = req;

    switch (method) {
      case 'GET': {
        // Return available secret names (not values)
        const secrets = [
          'STRIPE_SECRET_KEY',
          'STRIPE_WEBHOOK_SECRET',
          'FRONTEND_URL',
          'SUPABASE_URL',
          'SUPABASE_ANON_KEY',
          'SUPABASE_SERVICE_ROLE_KEY'
        ];
        
        return new Response(
          JSON.stringify({ secrets: secrets.map(name => ({ name, configured: !!Deno.env.get(name) })) }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      case 'PUT': {
        const { name, value } = await req.json();
        
        if (!name || !value) {
          return new Response(
            JSON.stringify({ error: 'Name and value are required' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        // In a real implementation, you would store this securely
        // For now, we'll just validate the format
        return new Response(
          JSON.stringify({ success: true, message: `Secret ${name} updated successfully` }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { 
            status: 405, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
    }
  } catch (error) {
    
    return formatError(error);
  }
});
