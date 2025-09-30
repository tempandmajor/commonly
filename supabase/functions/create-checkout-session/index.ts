
import { stripe } from '../stripe/config.ts';
import { createSupabaseClient, formatError } from '../stripe-config.ts';
import { createOrRetrieveStripeCustomer } from '../stripe/utils/customer-utils.ts';

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

    const requestData = await req.json();
    const {
      amount,
      currency = 'usd',
      description,
      metadata = {},
      success_url,
      cancel_url,
      customer_email,
      is_all_or_nothing = false,
      product_id: _product_id,
      event_id,
      pledge_deadline
    } = requestData;

    // Get or create Stripe customer
    const customerId = await createOrRetrieveStripeCustomer(
      req,
      user.id,
      customer_email || user.email || ''
    );

    const lineItems = [{
      price_data: {
        currency,
        product_data: {
          name: description,
        },
        unit_amount: Math.round(amount * 100),
      },
      quantity: 1,
    }];

    const checkoutOptions: Record<string, unknown> = {
      customer: customerId,
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: metadata.type === 'subscription' ? 'subscription' : 'payment',
      success_url,
      cancel_url,
      metadata: {
        ...metadata,
        userId: user.id,
        isAllOrNothing: is_all_or_nothing ? 'true' : 'false',
        eventId: event_id || '',
        pledgeDeadline: pledge_deadline || ''
      },
    };

    // For all-or-nothing events, use manual capture
    if (is_all_or_nothing) {
      checkoutOptions.payment_intent_data = {
        setup_future_usage: 'off_session',
        capture_method: 'manual',
      };
    }

    const session = await stripe.checkout.sessions.create(checkoutOptions);

    return new Response(
      JSON.stringify({
        id: session.id,
        url: session.url,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    // Ensure correct Error typing for formatter
    return formatError(error as Error);
  }
});
