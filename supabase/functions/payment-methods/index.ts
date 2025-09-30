// @ts-nocheck
import { stripe } from '../stripe/config.ts';
import { createSupabaseClient, formatError, corsHeaders, jsonResponse, createServiceSupabaseClient } from '../stripe-config.ts';
import { getStripeCustomerId, createOrRetrieveStripeCustomer } from '../stripe/utils/customer-utils.ts';

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
      return jsonResponse({ error: 'User not authenticated' }, 401);
    }

    // Ensure a Stripe customer exists for this user
    let customerId = await getStripeCustomerId(req, user.id);
    if (!customerId) {
      try {
        customerId = await createOrRetrieveStripeCustomer(req, user.id, user.email || '');
      } catch (_e) {
        return jsonResponse({ paymentMethods: [], hasPaymentMethods: false, paymentMethodCount: 0 }, 200);
      }
    }

    switch (req.method) {
      case 'GET': {
        const paymentMethods = await stripe.paymentMethods.list({ customer: customerId, type: 'card' });
        return jsonResponse({
          paymentMethods: paymentMethods.data,
          hasPaymentMethods: paymentMethods.data.length > 0,
          paymentMethodCount: paymentMethods.data.length
        });
      }

      case 'POST': {
        const idempotencyKey = req.headers.get('idempotency-key') || undefined;
        let previousResponse: any | null = null;
        if (idempotencyKey) {
          try {
            const service = createServiceSupabaseClient();
            const { data } = await (service as any)
              .from('idempotency_keys')
              .select('response, status_code')
              .eq('key', idempotencyKey)
              .single();
            if (data?.response) {
              previousResponse = data;
            }
          } catch (_e) {}
        }

        if (previousResponse) {
          return jsonResponse(previousResponse.response, previousResponse.status_code ?? 200);
        }

        const setupIntent = await stripe.setupIntents.create({
          customer: customerId,
          usage: 'off_session',
          payment_method_types: ['card'],
        });

        const body = { client_secret: setupIntent.client_secret, setup_intent_id: setupIntent.id };

        // Outbox event for setup intent created
        try {
          const service = createServiceSupabaseClient();
          await (service as any).from('outbox_events').insert({
            event_type: 'setup_intent_created',
            payload: { user_id: user.id, stripe_customer_id: customerId, setup_intent_id: setupIntent.id }
          });
        } catch (_e) {}

        if (idempotencyKey) {
          try {
            const service = createServiceSupabaseClient();
            await (service as any).from('idempotency_keys').insert({ key: idempotencyKey, response: body, status_code: 200 });
          } catch (_e) {}
        }

        return jsonResponse(body, 200);
      }

      case 'DELETE': {
        const { payment_method_id } = await req.json();
        if (!payment_method_id) {
          return jsonResponse({ error: 'Payment method ID required' }, 400);
        }
        await stripe.paymentMethods.detach(payment_method_id);
        return jsonResponse({ success: true }, 200);
      }

      default:
        return jsonResponse({ error: 'Method not allowed' }, 405);
    }
  } catch (error) {
    return formatError(error);
  }
});
