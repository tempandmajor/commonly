# Stripe Configuration Setup

## 🔑 **Step 1: Configure Stripe Secrets in Supabase**

You need to set the following secrets in your Supabase project:

### Using Supabase CLI:
```bash
# Set your Stripe secret key (test or live)
supabase secrets set STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here

# Set your Stripe webhook secret
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Set your frontend URL for redirects
supabase secrets set FRONTEND_URL=https://your-domain.com
```

### Using Supabase Dashboard:
1. Go to Project Settings → API → Project URL
2. Navigate to Settings → Edge Functions → Environment Variables
3. Add these secrets:
   - `STRIPE_SECRET_KEY`: Your Stripe secret key (sk_test_... or sk_live_...)
   - `STRIPE_WEBHOOK_SECRET`: Your Stripe webhook endpoint secret (whsec_...)
   - `FRONTEND_URL`: Your frontend domain for redirects

## 🎯 **Step 2: Get Your Stripe Keys**

### Test Keys (for development):
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Copy your **Secret key** (starts with `sk_test_`)
3. Copy your **Publishable key** (starts with `pk_test_`)

### Webhook Secret:
1. Go to [Stripe Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Create a new webhook endpoint pointing to: `https://your-project.supabase.co/functions/v1/stripe-webhook`
3. Copy the **Signing secret** (starts with `whsec_`)

## 🚀 **Step 3: Update Frontend Environment**

Update your `.env` file with:
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

## ✅ **Verification**

After setup, your Stripe integration should work for:
- ✅ Event ticket purchases
- ✅ Community subscriptions  
- ✅ Caterer bookings
- ✅ Product purchases
- ✅ Creator Program payments
- ✅ Stripe Connect marketplace

All Edge Functions are already deployed and ready to use! 