
import { stripe } from '../stripe/config.ts';
import { createSupabaseClient, formatError } from '../stripe-config.ts';
import { getStripeCustomerId } from '../stripe/utils/customer-utils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

    const customerId = await getStripeCustomerId(req, user.id);
    
    if (!customerId) {
      return new Response(
        JSON.stringify({ 
          hasActiveSubscription: false,
          subscriptionId: null,
          subscriptionStatus: null,
          subscriptionTier: null,
          subscriptionEndsAt: null
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get active subscriptions for the customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    });

    const activeSubscription = subscriptions.data[0];

    if (activeSubscription) {
      return new Response(
        JSON.stringify({
          hasActiveSubscription: true,
          subscriptionId: activeSubscription.id,
          subscriptionStatus: activeSubscription.status,
          subscriptionTier: activeSubscription.metadata.tier || 'pro',
          subscriptionEndsAt: new Date(activeSubscription.current_period_end * 1000).toISOString()
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          hasActiveSubscription: false,
          subscriptionId: null,
          subscriptionStatus: null,
          subscriptionTier: null,
          subscriptionEndsAt: null
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    
    return formatError(error);
  }
});
