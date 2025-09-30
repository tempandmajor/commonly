import { createSupabaseClient, formatError, corsHeaders, jsonResponse, COLLECTIONS, createServiceSupabaseClient } from '../stripe-config.ts';
import { stripe } from '../stripe/config.ts';

// Define the Supabase Edge Function for payment handling operations
Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Parse the URL to get the pathname
  const url = new URL(req.url);
  const path = url.pathname.split('/').pop();
  
  // Handle different operations based on the path
  switch (path) {
    case 'methods':
      return handlePaymentMethods(req);
    case 'set-default':
      return handleSetDefaultMethod(req);
    case 'add-method':
      return handleAddPaymentMethod(req);
    case 'remove-method':
      return handleRemovePaymentMethod(req);
    default:
      return jsonResponse({ error: 'Operation not found' }, 404);
  }
});

/**
 * Get a user's payment methods
 */
async function handlePaymentMethods(req: Request) {
  try {
    const supabase = createSupabaseClient(req);
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session?.user) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const userId = session.user.id;
    const email = session.user.email;
    if (!email) {
      return jsonResponse({ error: 'User email not found' }, 400);
    }
    
    const { data: customerData } = await supabase
      .from(COLLECTIONS.CUSTOMERS)
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();
    
    let stripeCustomerId = customerData?.stripe_customer_id as string | undefined;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({ email: email!, metadata: { userId } });
      stripeCustomerId = customer.id;
      await supabase
        .from(COLLECTIONS.CUSTOMERS)
        .insert({ user_id: userId, stripe_customer_id: stripeCustomerId, email, created_at: new Date().toISOString() });
    }
    
    const paymentMethods = await stripe.paymentMethods.list({ customer: stripeCustomerId, type: 'card' });
    const customer = await stripe.customers.retrieve(stripeCustomerId);
    const defaultPaymentMethodId = typeof customer === 'object' && !('deleted' in customer) && (customer as any).invoice_settings?.default_payment_method || null;

    return jsonResponse({ paymentMethods: paymentMethods.data, defaultPaymentMethodId });
  } catch (error) {
    return formatError(error as Error);
  }
}

/**
 * Set a default payment method
 */
async function handleSetDefaultMethod(req: Request) {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const supabase = createSupabaseClient(req);
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session?.user) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const userId = session.user.id;
    const { paymentMethodId } = await req.json();
    if (!paymentMethodId) {
      return jsonResponse({ error: 'Payment method ID is required' }, 400);
    }
    
    const { data: customerData } = await supabase
      .from(COLLECTIONS.CUSTOMERS)
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();
    
    if (!customerData?.stripe_customer_id) {
      return jsonResponse({ error: 'No Stripe customer found for this user' }, 404);
    }
    
    await stripe.customers.update(customerData.stripe_customer_id, { invoice_settings: { default_payment_method: paymentMethodId } });

    // Write outbox event (best-effort)
    try {
      const service = createServiceSupabaseClient();
      await (service as any).from('outbox_events').insert({
        event_type: 'default_payment_method_set',
        payload: { user_id: userId, payment_method_id: paymentMethodId }
      });
    } catch (_e) {}
    
    return jsonResponse({ success: true, message: 'Default payment method updated' });
  } catch (error) {
    return formatError(error as Error);
  }
}

/**
 * Add a new payment method
 */
async function handleAddPaymentMethod(req: Request) {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const supabase = createSupabaseClient(req);
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session?.user) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const userId = session.user.id;
    const { paymentMethodId } = await req.json();
    if (!paymentMethodId) {
      return jsonResponse({ error: 'Payment method ID is required' }, 400);
    }
    
    const { data: customerData } = await supabase
      .from(COLLECTIONS.CUSTOMERS)
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();
    
    if (!customerData?.stripe_customer_id) {
      return jsonResponse({ error: 'No Stripe customer found for this user' }, 404);
    }
    
    await stripe.paymentMethods.attach(paymentMethodId, { customer: customerData.stripe_customer_id });

    // Outbox: payment method added
    try {
      const service = createServiceSupabaseClient();
      await (service as any).from('outbox_events').insert({
        event_type: 'payment_method_added',
        payload: { user_id: userId, payment_method_id: paymentMethodId }
      });
    } catch (_e) {}
    
    return jsonResponse({ success: true, message: 'Payment method added' });
  } catch (error) {
    return formatError(error as Error);
  }
}

/**
 * Remove a payment method
 */
async function handleRemovePaymentMethod(req: Request) {
  if (req.method !== 'DELETE') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const supabase = createSupabaseClient(req);
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session?.user) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }
    
    const { paymentMethodId } = await req.json();
    if (!paymentMethodId) {
      return jsonResponse({ error: 'Payment method ID is required' }, 400);
    }
    
    await stripe.paymentMethods.detach(paymentMethodId);

    // Outbox: payment method removed
    try {
      const service = createServiceSupabaseClient();
      await (service as any).from('outbox_events').insert({
        event_type: 'payment_method_removed',
        payload: { user_id: (await (createSupabaseClient(req)).auth.getUser()).data.user?.id ?? null, payment_method_id: paymentMethodId }
      });
    } catch (_e) {}

    return jsonResponse({ success: true, message: 'Payment method removed' });
  } catch (error) {
    return formatError(error as Error);
  }
}
