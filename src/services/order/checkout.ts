// Enhanced checkout service that creates orders and Stripe Checkout sessions
import { supabase } from '@/integrations/supabase/client';
import { trackEvent } from '@/services/analyticsService';

const getSiteUrl = () => {
  if (typeof window !== 'undefined' && window.location) return window.location.origin;
  // Fallback to env if on server-side rendering contexts
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
};

export const generateCheckoutUrl = (productId: string, quantity: number): string => {
  // Generate a checkout URL with product and quantity parameters
  const params = new URLSearchParams({
    product: productId,
    quantity: quantity.toString(),
  });
  return `/checkout?${params.toString()}`;
};

/**
 * Create an order in the database
 */
export const createOrder = async (
  userId: string,
  productId: string,
  quantity: number,
  totalPrice: number
) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        product_id: productId,
        quantity,
        total_price: totalPrice,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Start a Stripe Checkout session for a product purchase using Stripe Connect destination charges.
 * - Creates a Checkout Session via the Edge Function `stripe/create-checkout-session`
 * - Persists a pending order with the `checkout_session_id`
 * - Returns the Checkout URL for client redirect
 */
export const startStripeCheckout = async (
  buyerId: string,
  productId: string,
  quantity: number
): Promise<{ url: string; sessionId: string }> => {
  // Client-side analytics: attempt to create a checkout session
  try {
    const label = JSON.stringify({ source: 'client', productId, quantity });
    trackEvent('checkout', 'session_create_attempt', label, 1);
  } catch (_) {
    /* non-blocking */
  }

  // Fetch product with creator for payout and pricing
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, name, price_in_cents, store_id, creator_id')
    .eq('id', productId)
    .single();
  if (productError || !product) throw productError || new Error('Product not found');

  // Get creator connected account id (handle both possible column names)
  const { data: creator, error: creatorError } = await supabase
    .from('users')
    .select('stripe_connect_account_id, stripe_account_id')
    .eq('id', product.creator_id)
    .single();
  if (creatorError) throw creatorError;
  const connectedAccountId = (creator?.stripe_connect_account_id || creator?.stripe_account_id) as
    | string
    | undefined;
  if (!connectedAccountId) throw new Error('Seller is not connected to Stripe');

  const amount = (product.price_in_cents || 0) * quantity; // in cents
  const platformFeePercent = 20; // default platform fee; can be dynamic later
  const applicationFeeAmount = Math.round(amount * (platformFeePercent / 100));

  const baseUrl = getSiteUrl();
  const successUrl = `${baseUrl}/purchase-success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${baseUrl}/payment-cancelled`;

  // Create Stripe Checkout Session via Edge Function
  const { data: checkoutRes, error: functionError } = await supabase.functions.invoke(
    'stripe/create-checkout-session',
    {
      body: {
        amount,
        currency: 'usd',
        description: product.name,
        successUrl,
        cancelUrl,
        metadata: { productId, quantity: String(quantity) as string, buyerId },
        connectedAccountId,
        applicationFeeAmount,
      },
    }
  );
  if (functionError) {
    try {
      const label = JSON.stringify({
        source: 'client',
        productId,
        quantity,
        error: String(functionError?.message || functionError) as string,
      });
      trackEvent('checkout', 'session_create_failed', label, 1);
    } catch (_) {}
    throw functionError;
  }
  const sessionUrl = checkoutRes?.url as string | undefined;
  const sessionId = checkoutRes?.sessionId as string | undefined;
  if (!sessionUrl || !sessionId) throw new Error('Failed to create checkout session');

  // Create pending order with session metadata
  const totalPrice = amount; // cents
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: buyerId,
      product_id: productId,
      quantity,
      total_price: totalPrice,
      status: 'pending',
      store_id: product.store_id,
      checkout_session_id: sessionId,
      application_fee: applicationFeeAmount,
    })
    .select('id')
    .single();
  if (orderError) throw orderError;
  if (!order?.id) throw new Error('Failed to create order');

  // Client-side analytics: session created
  try {
    const label = JSON.stringify({
      source: 'client',
      productId,
      quantity,
      sessionId,
      orderId: order.id,
    });
    trackEvent('checkout', 'session_created', label, 1);
  } catch (_) {
    /* non-blocking */
  }

  return { url: sessionUrl, sessionId };
};
