/**
 * @file Helper functions for Edge Function implementations
 */

import Stripe from 'stripe';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { WebhookEventResponse } from './index';

/**
 * Create a Supabase client for Edge Functions
 * @returns Supabase client
 */
export function createSupabaseAdmin(): SupabaseClient<Database> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_U as string;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_K as string;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
    },
  });
}

/**
 * Create a Stripe client for Edge Functions
 * @returns Stripe client
 */
export function createStripeClient(): Stripe {
  const stripeSecretKey = process.env.STRIPE_SECRET_K as string;

  if (!stripeSecretKey) {
    throw new Error('Missing Stripe secret key');
  }

  return new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16',
  });
}

/**
 * Get Stripe customer ID for a user, creating one if needed
 * @param supabase Supabase client
 * @param stripe Stripe client
 * @param userId User ID
 * @returns Stripe customer ID
 */
export async function getOrCreateStripeCustomer(
  supabase: SupabaseClient<Database>,
  stripe: Stripe,
  userId: string
): Promise<string> {
  // First check if user already has a Stripe customer ID
  const { data: user, error } = await supabase
    .from('users')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if (error) throw error;

  // If customer ID exists, return it
  if (user?.stripe_customer_id) {
    return user.stripe_customer_id;
  }

  // Get user details to create a customer
  const { data: userProfile, error: profileError } = await supabase
    .from('profiles')
    .select('email, display_name')
    .eq('id', userId)
    .single();

  if (profileError) throw profileError;

  // Create a new customer in Stripe
  const customer = await stripe.customers.create({
    email: userProfile.email,
    name: userProfile.display_name || undefined,
    metadata: {
      userId,
    },
  });

  // Save the customer ID to the database
  const { error: updateError } = await supabase
    .from('users')
    .update({ stripe_customer_id: customer.id })
    .eq('id', userId);

  if (updateError) throw updateError;

  return customer.id;
}

/**
 * Handle errors in Edge Functions
 * @param error Error object
 * @param message Optional context message
 * @returns Formatted error response
 */
export function handleEdgeError(
  error: unknown,
  message: string = 'Edge function error'
): {
  error: string;
  details?: string;
  code?: string;
} {
  let errorMessage = message;
  let errorDetails = undefined;
  let errorCode = undefined;

  // Extract details from different error types
  if (error instanceof Stripe.errors.StripeError) {
    errorMessage = error.message;
    errorCode = error.code;
    errorDetails = error.type;
  } else if (error instanceof Error) {
    errorMessage = error.message;
    errorDetails = error.stack;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else if (typeof error === 'object' && error !== null) {
    errorMessage = (error as unknown).message || message;
    errorDetails = JSON.stringify(error);
  }

  return {
    error: errorMessage,
    details: errorDetails,
    code: errorCode,
  };
}

/**
 * Process a Stripe webhook event
 * @param stripe Stripe client
 * @param signature Stripe signature header
 * @param payload Raw request body
 * @param webhookSecret Webhook signing secret
 * @returns Webhook processing result
 */
export async function processWebhookEvent(
  stripe: Stripe,
  signature: string,
  payload: string | Buffer,
  webhookSecret: string
): Promise<WebhookEventResponse> {
  try {
    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    // Process different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;

      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      // Additional event handlers can be added here
    }

    return {
      received: true,
      processed: true,
      eventType: event.type,
    };
  } catch (error) {
    return {
      received: true,
      processed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Handle successful payment intent
 * @param paymentIntent Payment intent object
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  // Implementation would store the payment in the database and update user credits/status
}

/**
 * Handle failed payment intent
 * @param paymentIntent Payment intent object
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  // Implementation would update the payment status in the database
}

/**
 * Handle completed checkout session
 * @param session Checkout session object
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  // Implementation would fulfill the order or add credits to the user's account
  // Extract user ID from metadata
  const userId = session.metadata?.userId;

  if (!userId) {
    return;
  }

  // If this was a credit purchase, add the credits to the user's account
  if (session.metadata?.type === 'credit_purchase') {
    const amount = Number(session.metadata?.amount || 0) as number;

    if (amount > 0) {
      const supabase = createSupabaseAdmin();

      // Add credit transaction
      await supabase.from('transactions').insert({
        user_id: userId,
        wallet_id: userId,
        amount_in_cents: amount * 100,
        transaction_type: 'credit_addition',
        description: 'Credit purchase',
        status: 'completed',
        reference_id: session.id,
        created_at: new Date().toISOString(),
        metadata: { stripeSession: session.id },
      });

      // Update wallet balance
      await updateWalletBalance(supabase, userId, amount);
    }
  }
}

/**
 * Update wallet balance
 * @param supabase Supabase client
 * @param userId User ID
 * @param amount Amount to add (can be negative for deductions)
 */
async function updateWalletBalance(
  supabase: SupabaseClient<Database>,
  userId: string,
  amount: number
): Promise<void> {
  // Get current wallet
  const { data: wallet, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  if (!wallet) {
    // Create wallet if it doesn't exist
    await supabase.from('wallets').insert({
      user_id: userId,
      credit_balance: amount,
      balance: amount,
      balance_in_cents: Math.round(amount * 100),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return;
  }

  // Determine which balance field to use
  const balanceFields = ['credit_balance', 'credits', 'balance', 'balance_in_cents'];
  const balanceField = balanceFields.find(
    field => wallet[field as keyof typeof wallet] !== undefined
  );

  if (!balanceField) {
    throw new Error('No valid balance field found in wallet record');
  }

  // Calculate new balance
  let currentBalance = Number(wallet[balanceField as keyof typeof wallet]) as number;

  // Handle cents conversion if needed
  if (balanceField === 'balance_in_cents') {
    currentBalance = currentBalance / 100;
    currentBalance += amount;
    currentBalance = Math.round(currentBalance * 100);
  } else {
    currentBalance += amount;
  }

  // Update wallet
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  updateData[balanceField] = currentBalance;

  await supabase.from('wallets').update(updateData).eq('user_id', userId);
}
