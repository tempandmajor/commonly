// @ts-nocheck
import { stripe } from '../stripe/config.ts';
import type Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createServiceSupabaseClient, corsHeaders, formatError, jsonResponse } from '../stripe-config.ts';

type SupabaseTableQuery = {
  select: (...args: unknown[]) => SupabaseTableQuery & Promise<{ data?: unknown; error?: unknown }>;
  insert: (values: unknown) => SupabaseTableQuery & Promise<{ data?: unknown; error?: unknown }>;
  update: (values: unknown) => SupabaseTableQuery & Promise<{ data?: unknown; error?: unknown }>;
  upsert?: (values: unknown) => SupabaseTableQuery & Promise<{ data?: unknown; error?: unknown }>;
  eq: (field: string, value: unknown) => SupabaseTableQuery;
  is?: (field: string, value: unknown) => SupabaseTableQuery;
  single: () => Promise<{ data?: unknown; error?: unknown }>;
};

type SupabaseLike = {
  from: (table: string) => SupabaseTableQuery;
  rpc: (fn: string, args: Record<string, unknown>) => Promise<unknown>;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!signature || !webhookSecret) {
      return jsonResponse({ error: 'Missing signature or webhook secret' }, 400);
    }

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (_err) {
      return jsonResponse({ error: 'Invalid signature' }, 400);
    }

    const supabase = createServiceSupabaseClient();

    // Persist event if not already stored (idempotent persistence)
    try {
      await (supabase as any)
        .from('stripe_events')
        .insert({ id: event.id, type: event.type, payload: event as any });
    } catch (_e) {}

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(supabase as any, event.data.object as Record<string, unknown>);
        break;
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(supabase as any, event.data.object as Record<string, unknown>);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(supabase as any, event.data.object as Record<string, unknown>);
        break;
      case 'charge.refunded':
        await handleChargeRefunded(supabase as any, event.data.object as Record<string, unknown>);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleSubscriptionChange(supabase as any, event.data.object as Record<string, unknown>);
        break;
      default:
        // No action for other event types
    }

    // Emit domain-specific outbox events for downstream consumers
    try {
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as any;
        const sessionId = session?.id as string | undefined;
        const amountTotal = session?.amount_total as number | undefined;
        const customerId = session?.customer as string | undefined;
        let userId: string | null = null;
        if (customerId) {
          try {
            const { data: customerRow } = await (supabase as any)
              .from('stripe_customers')
              .select('user_id')
              .eq('stripe_customer_id', customerId)
              .single();
            userId = (customerRow as any)?.user_id ?? null;
          } catch (_e) {}
        }
        await (supabase as any)
          .from('outbox_events')
          .insert({ event_type: 'order_paid', payload: { user_id: userId, checkout_session_id: sessionId, amount_total: amountTotal, customer_id: customerId } });
      } else if (event.type === 'charge.refunded') {
        const charge = event.data.object as any;
        const piId = charge?.payment_intent as string | undefined;
        if (piId) {
          try {
            const sessions = await stripe.checkout.sessions.list({ payment_intent: piId, limit: 1 });
            const session = sessions.data?.[0];
            const sessionId = session?.id as string | undefined;
            await (supabase as any)
              .from('outbox_events')
              .insert({ event_type: 'order_refunded', payload: { checkout_session_id: sessionId, payment_intent_id: piId } });
          } catch (_e) {}
        }
      }
    } catch (_e) {}

    // Mark event as processed and emit generic processed event
    try {
      await (supabase as any)
        .from('stripe_events')
        .update({ processed_at: new Date().toISOString() })
        .eq('id', event.id);
      await (supabase as any)
        .from('outbox_events')
        .insert({ event_type: 'stripe_event_processed', payload: { id: event.id, type: event.type } });
    } catch (_e) {}

    return jsonResponse({ received: true }, 200);
  } catch (error) {
    console.error('stripe-webhook top-level error', error);
    return formatError(error as Error);
  }
});

async function recordAnalyticsEvent(
  supabase: SupabaseLike,
  event_type: string,
  event_data: Record<string, unknown>,
  user_id?: string | null,
  session_id?: string | null
) {
  try {
    await supabase
      .from('analytics_events')
      .insert({ event_type, event_data, user_id: user_id ?? null, session_id: session_id ?? null });
  } catch (e) {
    console.error('analytics insert failed', e);
  }
}

async function invokePrintifySubmit(orderId: string) {
  const url = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceRoleKey) {
    console.warn('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for invoking printify function');
    return;
  }
  try {
    const resp = await fetch(`${url}/functions/v1/printify-submit-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`
      },
      body: JSON.stringify({ orderId })
    });
    if (!resp.ok) {
      const text = await resp.text();
      console.error('printify-submit-order invocation failed', resp.status, text);
    }
  } catch (e) {
    console.error('invokePrintifySubmit error', e);
  }
}

async function handleCheckoutCompleted(supabase: SupabaseLike, session: Record<string, unknown>) {
  try {
    const customerId = session.customer as string | null;
    const paymentIntentId = session.payment_intent as string | null;
    const sessionId = session.id as string | null;
    
    // Get user from customer ID
    const { data: customerData } = await supabase
      .from('stripe_customers')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (customerData) {
      // Record the payment
      await supabase.from('payments').insert({
        user_id: (customerData as Record<string, unknown>).user_id,
        stripe_payment_id: paymentIntentId,
        amount_in_cents: session.amount_total as number,
        status: 'completed',
        payment_method: Array.isArray(session.payment_method_types) ? (session.payment_method_types as string[])[0] : undefined,
        description: 'Checkout session completed',
        metadata: session.metadata as Record<string, unknown> | null
      });

      // Update wallet if needed
      if ((session.metadata as Record<string, string> | undefined)?.add_to_wallet === 'true') {
        await supabase.rpc('update_wallet_balance', {
          p_user_id: (customerData as Record<string, unknown>).user_id,
          p_amount_cents: session.amount_total as number
        });
      }
    }

    // Also mark related order (if any) as processing since checkout completed
    if (sessionId) {
      // We inserted orders with `checkout_session_id` during checkout creation
      await supabase
        .from('orders')
        .update({ status: 'processing' })
        .eq('checkout_session_id', sessionId);
      // Optionally try to save payment_intent_id if the column exists; avoid breaking on schema differences
      if (paymentIntentId) {
        try {
          await supabase
            .from('orders')
            .update({ payment_intent_id: paymentIntentId })
            .eq('checkout_session_id', sessionId);
        } catch (_e) {
          // Ignore if column doesn't exist
        }
      }
    }

    // Analytics: checkout session completed (created)
    const userId = (customerData as Record<string, unknown> | undefined)?.user_id as string | undefined;
    await recordAnalyticsEvent(
      supabase,
      'checkout_session_completed',
      { amount_total: session.amount_total, currency: (session.currency as string | undefined) || 'usd' },
      userId || null,
      sessionId
    );
  } catch (err) {
    console.error('handleCheckoutCompleted error', err);
  }
}

async function handlePaymentSucceeded(supabase: SupabaseLike, paymentIntent: Record<string, unknown>) {
  try {
    // Update payment status
    await supabase
      .from('payments')
      .update({ status: 'completed' })
      .eq('stripe_payment_id', paymentIntent.id as string);

    // Link PaymentIntent back to Checkout Session to find the order
    const piId = paymentIntent.id as string | undefined;
    if (piId) {
      try {
        const sessions = await stripe.checkout.sessions.list({ payment_intent: piId, limit: 1 });
        const session = sessions.data?.[0];
        if (session?.id) {
          // Mark the order as paid
          await supabase
            .from('orders')
            .update({ status: 'paid' })
            .eq('checkout_session_id', session.id);

          // Update application_fee if present on PI
          const appFee = (paymentIntent as { application_fee_amount?: number }).application_fee_amount;
          if (typeof appFee === 'number') {
            try {
              await supabase
                .from('orders')
                .update({ application_fee: appFee })
                .eq('checkout_session_id', session.id);
            } catch (_e) {
              // ignore if column is missing; we already wrote it at creation time
            }
          }

          // Fetch order to get ID for fulfillment
          try {
            const { data: orderRow } = await (supabase as any)
              .from('orders')
              .select('id')
              .eq('checkout_session_id', session.id)
              .single();
            const orderId = (orderRow as { id?: string } | null)?.id;
            if (orderId) {
              await invokePrintifySubmit(orderId);
            }
          } catch (e) {
            console.error('fetch order for printify failed', e);
          }

          // Analytics: payment succeeded
          let userId: string | null = null;
          try {
            if (session.customer) {
              const { data: cust } = await (supabase as any)
                .from('stripe_customers')
                .select('user_id')
                .eq('stripe_customer_id', session.customer)
                .single();
              userId = (cust as any)?.user_id ?? null;
            }
          } catch (_e) {}
          await recordAnalyticsEvent(
            supabase,
            'payment_succeeded',
            { payment_intent_id: piId, checkout_session_id: session.id, application_fee: appFee ?? null },
            userId,
            session.id
          );
        }
      } catch (e) {
        console.error('handlePaymentSucceeded link session error', e);
      }
    }
  } catch (err) {
    console.error('handlePaymentSucceeded error', err);
  }
}

async function handlePaymentFailed(supabase: SupabaseLike, paymentIntent: Record<string, unknown>) {
  try {
    // Update payment status
    await supabase
      .from('payments')
      .update({ status: 'failed' })
      .eq('stripe_payment_id', paymentIntent.id as string);

    // Attempt to mark any related order as failed
    const piId = paymentIntent.id as string | undefined;
    if (piId) {
      try {
        const sessions = await stripe.checkout.sessions.list({ payment_intent: piId, limit: 1 });
        const session = sessions.data?.[0];
        if (session?.id) {
          await supabase
            .from('orders')
            .update({ status: 'failed' })
            .eq('checkout_session_id', session.id);

          // Analytics: payment failed
          let userId: string | null = null;
          try {
            if (session.customer) {
              const { data: cust } = await (supabase as any)
                .from('stripe_customers')
                .select('user_id')
                .eq('stripe_customer_id', session.customer)
                .single();
              userId = (cust as any)?.user_id ?? null;
            }
          } catch (_e) {}
          await recordAnalyticsEvent(
            supabase,
            'payment_failed',
            { payment_intent_id: piId, checkout_session_id: session.id },
            userId,
            session.id
          );
        }
      } catch (e) {
        console.error('handlePaymentFailed link session error', e);
      }
    }
  } catch (err) {
    console.error('handlePaymentFailed error', err);
  }
}

async function handleSubscriptionChange(supabase: SupabaseLike, subscription: Record<string, unknown>) {
  try {
    const customerId = subscription.customer as string | null;
    
    // Get user from customer ID
    const { data: customerData } = await supabase
      .from('stripe_customers')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (customerData) {
      // Update or create subscription record
      await supabase
        .from('stripe_subscriptions')
        .upsert({
          user_id: (customerData as Record<string, unknown>).user_id,
          stripe_subscription_id: subscription.id as string,
          status: subscription.status as string,
          current_period_start: new Date((subscription.current_period_start as number) * 1000).toISOString(),
          current_period_end: new Date((subscription.current_period_end as number) * 1000).toISOString(),
          metadata: subscription.metadata as Record<string, unknown> | null
        });
    }
  } catch (error) {
    console.error('handleSubscriptionChange error', error);
  }
}

async function handleChargeRefunded(supabase: SupabaseLike, charge: Record<string, unknown>) {
  try {
    // Update order status if we can match it via PaymentIntent->Session
    const piId = charge.payment_intent as string | undefined;
    if (piId) {
      try {
        const sessions = await stripe.checkout.sessions.list({ payment_intent: piId, limit: 1 });
        const session = sessions.data?.[0];
        if (session?.id) {
          await supabase
            .from('orders')
            .update({ status: 'refunded' })
            .eq('checkout_session_id', session.id);

          // Analytics: payment refunded
          let userId: string | null = null;
          try {
            if (session.customer) {
              const { data: cust } = await (supabase as any)
                .from('stripe_customers')
                .select('user_id')
                .eq('stripe_customer_id', session.customer)
                .single();
              userId = (cust as any)?.user_id ?? null;
            }
          } catch (_e) {}
          await recordAnalyticsEvent(
            supabase,
            'payment_refunded',
            { charge_id: charge.id, payment_intent_id: piId, checkout_session_id: session.id },
            userId,
            session.id
          );
        }
      } catch (e) {
        console.error('handleChargeRefunded link session error', e);
      }
    }
  } catch (err) {
    console.error('handleChargeRefunded error', err);
  }
}
