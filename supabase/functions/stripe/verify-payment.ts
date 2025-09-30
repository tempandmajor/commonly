/**
 * Stripe Verify Payment Edge Function
 * 
 * This function securely verifies a Stripe payment on the server side.
 * It retrieves the checkout session or payment intent status and confirms the payment was successful.
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@12.4.0?target=deno';

// Initialize Stripe with the secret key (securely stored in environment)
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
if (!stripeSecretKey) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
  try {
    // CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Content-Type': 'application/json',
    };

    // Handle CORS preflight request
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers,
      });
    }

    // Parse request body
    const { sessionId, paymentIntentId } = await req.json();

    // Validate input - we need either a session ID or payment intent ID
    if (!sessionId && !paymentIntentId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing sessionId or paymentIntentId'
        }),
        { status: 400, headers }
      );
    }

    let paymentStatus;
    let customerId;
    let amount;
    let currency;
    let paymentId;
    let metadata;

    // If we have a session ID, retrieve the checkout session
    if (sessionId) {
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['payment_intent', 'line_items']
      });

      // Get payment status
      if (session.payment_status === 'paid') {
        paymentStatus = 'completed';
      } else if (session.payment_status === 'unpaid') {
        paymentStatus = 'pending';
      } else {
        paymentStatus = 'failed';
      }

      // Get customer ID
      customerId = session.customer;

      // Get amount and currency
      if (session.amount_total) {
        amount = session.amount_total;
        currency = session.currency;
      }

      // Get payment intent ID
      if (session.payment_intent) {
        paymentId = typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent.id;
      }

      // Get metadata
      metadata = session.metadata;
    }
    // If we have a payment intent ID, retrieve the payment intent
    else if (paymentIntentId) {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      // Get payment status
      if (paymentIntent.status === 'succeeded') {
        paymentStatus = 'completed';
      } else if (
        paymentIntent.status === 'processing' ||
        paymentIntent.status === 'requires_action' ||
        paymentIntent.status === 'requires_confirmation'
      ) {
        paymentStatus = 'pending';
      } else {
        paymentStatus = 'failed';
      }

      // Get customer ID
      customerId = paymentIntent.customer;

      // Get amount and currency
      amount = paymentIntent.amount;
      currency = paymentIntent.currency;

      // Get payment intent ID
      paymentId = paymentIntent.id;

      // Get metadata
      metadata = paymentIntent.metadata;
    }

    // Return verification result
    return new Response(
      JSON.stringify({
        success: paymentStatus === 'completed',
        status: paymentStatus,
        paymentId,
        customerId,
        amount,
        currency,
        metadata
      }),
      { status: 200, headers }
    );
  } catch (error) {
    
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
