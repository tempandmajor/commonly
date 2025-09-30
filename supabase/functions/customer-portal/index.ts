
import { stripe } from '../stripe/config.ts';
import { createSupabaseClient, formatError } from '../stripe-config.ts';
import { getStripeCustomerId } from '../stripe/utils/customer-utils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createSupabaseClient(req);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'User not authenticated' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { returnUrl } = await req.json();
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:3000';
    
    const customerId = await getStripeCustomerId(req, user.id);
    
    if (!customerId) {
      return new Response(
        JSON.stringify({ error: 'Customer not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || `${frontendUrl}/settings`,
    });

    return new Response(
      JSON.stringify({
        url: session.url,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    
    return formatError(error);
  }
});
