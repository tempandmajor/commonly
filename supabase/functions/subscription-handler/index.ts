import { createSupabaseClient, COLLECTIONS, formatError } from '../stripe-config.ts';
import { stripe } from '../stripe/config.ts';
import Stripe from 'https://esm.sh/stripe@12.18.0';

// Handle subscription deleted events
async function handleSubscriptionDeleted(req: Request, subscription: Stripe.Subscription) {
  const supabase = createSupabaseClient(req);
  
  if (subscription.metadata.userId) {
    const { error } = await supabase
      .from(COLLECTIONS.USERS)
      .update({
        subscription_status: 'cancelled',
        subscription_updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.metadata.userId);
      
    if (error) {
      
      throw error;
    }
  }
}

// Handle subscription updated events
async function handleSubscriptionUpdated(req: Request, subscription: Stripe.Subscription) {
  const supabase = createSupabaseClient(req);

  if (subscription.metadata.userId) {
    const { error } = await supabase
      .from(COLLECTIONS.USERS)
      .update({
        subscription_status: subscription.status,
        subscription_updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.metadata.userId);
      
    if (error) {
      
      throw error;
    }
  }
}

// Define the Supabase Edge Function
Deno.serve(async (req) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const requestData = await req.json();
    const { action, subscriptionId } = requestData;
    
    // Get subscription data from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    if (action === 'deleted') {
      await handleSubscriptionDeleted(req, subscription);
      return new Response(
        JSON.stringify({ success: true, message: 'Subscription deleted successfully' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } 
    
    if (action === 'updated') {
      await handleSubscriptionUpdated(req, subscription);
      return new Response(
        JSON.stringify({ success: true, message: 'Subscription updated successfully' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return formatError(error);
  }
});
