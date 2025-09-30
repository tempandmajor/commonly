import { createSupabaseClient, COLLECTIONS, formatError } from '../stripe-config.ts';
import { stripe } from '../stripe/config.ts';

// Define the Supabase Edge Function for scheduled tasks
// Note: This will need to be triggered via a cron job in the Supabase dashboard
Deno.serve(async (req) => {
  // Only allow POST requests with a valid admin API key
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Verify authorization
    const authHeader = req.headers.get('Authorization');
    const apiKey = Deno.env.get('SUPABASE_CRON_KEY');
    
    if (!authHeader || !apiKey || !authHeader.includes(apiKey)) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Get task type from request
    const { taskType } = await req.json();
    
    if (!taskType) {
      return new Response(
        JSON.stringify({ error: 'Task type is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const supabase = createSupabaseClient(req);
    type ExpiredSubscriptionsResult = { processed: number; updated: number; errors: number };
    type PendingPaymentsResult = { processed: number; retried: number; errors: number };
    type SyncSubscriptionsResult = { processed: number; synced: number; errors: number };
    type TaskResults = {
      expiredSubscriptions?: ExpiredSubscriptionsResult;
      processedPayments?: PendingPaymentsResult;
      syncedSubscriptions?: SyncSubscriptionsResult;
    };
    const results: TaskResults = {};
    
    switch (taskType) {
      case 'check-expired-subscriptions':
        results.expiredSubscriptions = await handleExpiredSubscriptions(supabase);
        break;
      case 'process-pending-payments':
        results.processedPayments = await handlePendingPayments(supabase);
        break;
      case 'sync-stripe-subscriptions':
        results.syncedSubscriptions = await syncStripeSubscriptions(supabase);
        break;
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid task type' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        taskType,
        results,
        timestamp: new Date().toISOString()
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('scheduled-tasks: top-level error', error);
    return formatError(error as Error);
  }
});

/**
 * Handle expired subscriptions
 */
type SupabaseResult = { data?: unknown; error?: unknown };
type SupabaseQuery = {
  select: (...args: unknown[]) => SupabaseQuery & Promise<SupabaseResult>;
  lt: (field: string, value: unknown) => SupabaseQuery & Promise<SupabaseResult>;
  eq: (field: string, value: unknown) => SupabaseQuery & Promise<SupabaseResult>;
  in: (field: string, values: unknown[]) => SupabaseQuery & Promise<SupabaseResult>;
  update: (values: Record<string, unknown>) => SupabaseQuery & Promise<SupabaseResult>;
};

type SupabaseLike = {
  from: (table: string) => SupabaseQuery & Promise<{ data?: unknown; error?: unknown }>;
};

async function handleExpiredSubscriptions(supabase: SupabaseLike) {
  const now = new Date();
  const results = { processed: 0, updated: 0, errors: 0 };
  
  // Get subscriptions that are marked as active but have expired
  const { data: subscriptions, error } = await supabase
    .from(COLLECTIONS.SUBSCRIPTIONS)
    .select('user_id, subscription_id')
    .lt('current_period_end', now.toISOString())
    .eq('status', 'active');
  
  if (error) {
    
    results.errors++;
    return results;
  }
  
  results.processed = (subscriptions as unknown[]).length;
  
  // Update each expired subscription
  for (const subscription of subscriptions as Array<{ user_id: string; subscription_id: string }>) {
    try {
      // Update subscription in Supabase
      await supabase
        .from(COLLECTIONS.SUBSCRIPTIONS)
        .update({
          status: 'expired',
          updated_at: now.toISOString()
        })
        .eq('subscription_id', subscription.subscription_id);
      
      // Update user's subscription status
      await supabase
        .from(COLLECTIONS.USERS)
        .update({
          subscription_status: 'expired',
          subscription_updated_at: now.toISOString()
        })
        .eq('id', subscription.user_id);
      
      results.updated++;
    } catch (err) {
      console.error('scheduled-tasks: handleExpiredSubscriptions error updating subscription/user', err);
      results.errors++;
    }
  }
  
  return results;
}

/**
 * Handle pending payments that need to be retried
 */
async function handlePendingPayments(supabase: SupabaseLike) {
  const now = new Date();
  // Set retry window to 24 hours ago
  const retryWindow = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const results = { processed: 0, retried: 0, errors: 0 };
  
  // Get payment intents that are still in a pending state and due for retry
  const { data: pendingPayments, error } = await supabase
    .from('payment_history')
    .select('id, payment_intent_id, retry_count')
    .eq('status', 'requires_payment_method')
    .lt('created_at', retryWindow.toISOString())
    .lt('retry_count', 3); // Max 3 retry attempts
  
  if (error) {
    
    results.errors++;
    return results;
  }
  
  results.processed = (pendingPayments as unknown[]).length;
  
  // Attempt to retry each pending payment
  for (const payment of pendingPayments as Array<{ id: string; payment_intent_id: string; retry_count: number }>) {
    try {
      // Try to confirm the payment intent with off session flag
      await stripe.paymentIntents.confirm(payment.payment_intent_id, {
        off_session: true
      });
      
      // Update the retry count
      await supabase
        .from('payment_history')
        .update({
          retry_count: payment.retry_count + 1,
          last_retry_at: now.toISOString()
        })
        .eq('id', payment.id);
      
      results.retried++;
    } catch (err) {
      console.error('scheduled-tasks: handlePendingPayments retry error', err);
      results.errors++;
    }
  }
  
  return results;
}

/**
 * Sync subscription data from Stripe to Supabase
 */
async function syncStripeSubscriptions(supabase: SupabaseLike) {
  const now = new Date();
  const results = { processed: 0, synced: 0, errors: 0 };
  
  // Get all subscription records
  const { data: subscriptions, error } = await supabase
    .from(COLLECTIONS.SUBSCRIPTIONS)
    .select('subscription_id, user_id')
    .in('status', ['active', 'trialing', 'past_due']);
  
  if (error) {
    
    results.errors++;
    return results;
  }
  
  results.processed = subscriptions.length;
  
  // Sync each subscription with Stripe
  for (const subscription of subscriptions) {
    try {
      // Get subscription details from Stripe
      const stripeSubscription = await stripe.subscriptions.retrieve(subscription.subscription_id);
      
      // Update subscription in Supabase
      await supabase
        .from(COLLECTIONS.SUBSCRIPTIONS)
        .update({
          status: stripeSubscription.status,
          current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
          cancel_at: stripeSubscription.cancel_at 
            ? new Date(stripeSubscription.cancel_at * 1000).toISOString() 
            : null,
          canceled_at: stripeSubscription.canceled_at 
            ? new Date(stripeSubscription.canceled_at * 1000).toISOString() 
            : null,
          updated_at: now.toISOString()
        })
        .eq('subscription_id', subscription.subscription_id);
      
      // Also update user status if needed
      if (stripeSubscription.status !== 'active' && stripeSubscription.status !== 'trialing') {
        await supabase
          .from(COLLECTIONS.USERS)
          .update({
            subscription_status: stripeSubscription.status,
            subscription_updated_at: now.toISOString()
          })
          .eq('id', subscription.user_id);
      }
      
      results.synced++;
    } catch (err) {
      console.error('scheduled-tasks: syncStripeSubscriptions error syncing subscription', err);
      results.errors++;
    }
  }
  
  return results;
}
