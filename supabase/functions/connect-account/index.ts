import { stripe } from '../stripe/config.ts';
import { createSupabaseClient, formatError } from '../stripe-config.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

    // Get frontend URL from environment or use production URL
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://commonlyapp.com';

    switch (req.method) {
      case 'GET': {
        // Get account status
        const { data: userData } = await supabase
          .from('users')
          .select('stripe_account_id')
          .eq('id', user.id)
          .single();

        if (!userData?.stripe_account_id) {
          return new Response(
            JSON.stringify({ 
              isConnected: false,
              accountId: null,
              requiresOnboarding: true
            }),
            {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        // Check account status with Stripe
        const account = await stripe.accounts.retrieve(userData.stripe_account_id);
        
        return new Response(
          JSON.stringify({
            isConnected: account.details_submitted && account.charges_enabled,
            accountId: account.id,
            requiresOnboarding: !account.details_submitted,
            chargesEnabled: account.charges_enabled,
            payoutsEnabled: account.payouts_enabled
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      case 'POST': {
        const { action } = await req.json();

        if (action === 'create_onboarding_link') {
          // Get or create Stripe Connect account
          let accountId;
          const { data: existingUser } = await supabase
            .from('users')
            .select('stripe_account_id')
            .eq('id', user.id)
            .single();

          if (existingUser?.stripe_account_id) {
            accountId = existingUser.stripe_account_id;
          } else {
            // Create new Connect account
            const account = await stripe.accounts.create({
              type: 'express',
              country: 'US', // Default to US, could be configurable
              email: user.email,
            });

            accountId = account.id;

            // Save account ID to user record
            await supabase
              .from('users')
              .update({ stripe_account_id: accountId })
              .eq('id', user.id);
          }

          // Create onboarding link with proper URLs
          const accountLink = await stripe.accountLinks.create({
            account: accountId,
            refresh_url: `${frontendUrl}/connect/refresh`,
            return_url: `${frontendUrl}/connect/complete`,
            type: 'account_onboarding',
          });

          return new Response(
            JSON.stringify({
              url: accountLink.url,
              accountId: accountId
            }),
            {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        if (action === 'create_dashboard_link') {
          const { data: userData } = await supabase
            .from('users')
            .select('stripe_account_id')
            .eq('id', user.id)
            .single();

          if (!userData?.stripe_account_id) {
            return new Response(
              JSON.stringify({ error: 'No Connect account found' }),
              { 
                status: 404, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            );
          }

          const loginLink = await stripe.accounts.createLoginLink(userData.stripe_account_id);

          return new Response(
            JSON.stringify({
              url: loginLink.url
            }),
            {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { 
            status: 400, 
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
