import Stripe from 'https://esm.sh/stripe@12.18.0';

// Initialize Stripe with environment variable
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');

if (!stripeSecretKey) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16', // Updated to latest stable API version
  httpClient: Stripe.createFetchHttpClient(),
});
