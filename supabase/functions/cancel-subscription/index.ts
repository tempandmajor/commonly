
import { stripe } from '../stripe/config.ts';
import { createSupabaseClient, formatError } from '../stripe-config.ts';

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

    const { subscriptionId } = await req.json();

    if (!subscriptionId) {
      return new Response(
        JSON.stringify({ error: 'Subscription ID required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Cancel the subscription at the end of the billing period
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    return new Response(
      JSON.stringify({
        success: true,
        subscriptionId: subscription.id,
        status: subscription.status,
        cancelAt: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null
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
