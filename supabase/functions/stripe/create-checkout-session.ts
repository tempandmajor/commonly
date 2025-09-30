/**
 * Stripe Create Checkout Session Edge Function
 * 
 * This function securely creates a Stripe checkout session on the server side.
 * It protects sensitive Stripe API keys and operations from exposure in client code.
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
    const { 
      amount, 
      currency, 
      description,
      successUrl, 
      cancelUrl,
      customerId,
      metadata,
      connectedAccountId,
      applicationFeeAmount,
      customerEmail
    } = await req.json();

    // Validate required parameters
    if (!amount || !currency || !successUrl || !cancelUrl) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameters' 
        }),
        { status: 400, headers }
      );
    }

    // Prepare line items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price_data: {
          currency,
          product_data: {
            name: description || 'Payment',
          },
          unit_amount: amount, // Stripe expects amount in cents
        },
        quantity: 1,
      },
    ];

    // Prepare checkout session options
    const sessionOptions: Stripe.Checkout.SessionCreateParams = {
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: (metadata || {}) as Record<string, string>,
    };

    // Add customer if provided
    if (customerId) {
      sessionOptions.customer = customerId as string;
    } else if (customerEmail) {
      sessionOptions.customer_email = customerEmail as string;
    }

    // If this is a connected account payment, add the required parameters
    if (connectedAccountId) {
      // Create checkout session on the connected account
      sessionOptions.payment_intent_data = {
        transfer_data: {
          destination: connectedAccountId as string,
        },
      };

      // If there's a platform fee, add it
      if (applicationFeeAmount && applicationFeeAmount > 0) {
        sessionOptions.payment_intent_data = {
          ...(sessionOptions.payment_intent_data || {}),
          application_fee_amount: applicationFeeAmount as number,
        };
      }
    }

    // Create checkout session
    let session: Stripe.Checkout.Session;
    if (connectedAccountId) {
      // For connected accounts, we need to use the Stripe-Account header
      session = await stripe.checkout.sessions.create(
        sessionOptions,
        {
          stripeAccount: connectedAccountId,
        }
      );
    } else {
      // Standard checkout session
      session = await stripe.checkout.sessions.create(sessionOptions);
    }

    // Return session details
    return new Response(
      JSON.stringify({ 
        url: session.url,
        sessionId: session.id 
      }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error('stripe/create-checkout-session error', error);
    const message = (error && typeof error === 'object' && 'message' in error)
      ? String((error as { message?: unknown }).message ?? 'Internal server error')
      : 'Internal server error';
    return new Response(
      JSON.stringify({ 
        error: message 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
