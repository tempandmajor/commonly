# Supabase Edge Functions for CommonlyApp

This directory contains the Supabase Edge Functions that replace the previous Firebase Cloud Functions. These serverless functions handle various aspects of the application including payment processing, subscription management, and user interactions with Stripe.

## Function Overview

### Authentication and Configuration

- **stripe-config.ts** - Central configuration for Stripe and helper functions
- **stripe/config.ts** - Stripe initialization

### Payment Processing

- **payment-methods** - Manage user payment methods
- **payment-handler** - Handle various payment operations
- **create-checkout-session** - Create Stripe checkout sessions for one-time payments

### Subscription Management

- **check-subscription** - Check a user's subscription status
- **cancel-subscription** - Cancel an active subscription
- **customer-portal** - Create a Stripe customer portal session for subscription management
- **subscription-handler** - Handle subscription webhooks and events

### Stripe Connect

- **connect-account** - Create and manage Stripe Connect accounts for event organizers

### Pledges and Events

- **pledge-functions** - Create, cancel, and check status of event pledges

### Scheduled Tasks

- **scheduled-tasks** - Scheduled maintenance tasks for subscriptions and payments
- **stripe-webhook** - Handle Stripe webhook events

## Deployment

These functions are automatically deployed when pushed to the Supabase project. Each function directory contains an `index.ts` file which is the entry point for that function.

### Environment Variables Required

The following environment variables must be set in the Supabase project:

- `STRIPE_SECRET_KEY` - Your Stripe secret API key
- `STRIPE_WEBHOOK_SECRET` - Webhook signing secret from Stripe
- `SUPABASE_URL` - URL of your Supabase project
- `SUPABASE_ANON_KEY` - Anonymous key for client authentication (required for proper user auth)
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for database operations
- `FRONTEND_URL` - URL of the frontend application (for redirects)
- `SUPABASE_CRON_KEY` - Secret key for scheduled tasks authentication

## Troubleshooting Common Issues

### 1. Stripe Connect 401 Unauthorized Errors

**✅ ISSUE RESOLVED**: The authentication issue in the `connect-account` function has been fixed!

**What was wrong**: The edge function was incorrectly handling the Authorization header by trying to use the Bearer token as an API key instead of using proper Supabase client authentication.

**What was fixed**: Updated the `createSupabaseClient` function to use the correct authentication pattern:
```typescript
// OLD (incorrect):
const apiKey = authHeader ? authHeader.replace('Bearer ', '') : supabaseServiceKey;
return createClient(supabaseUrl, apiKey, {...});

// NEW (correct):
return createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: { Authorization: authHeader! },
  },
  auth: { persistSession: false, autoRefreshToken: false }
});
```

**If you still get 401 errors, check:**

1. **Missing Environment Variables** - Ensure these are set in Supabase Dashboard → Project Settings → Edge Functions:
   ```
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
   STRIPE_SECRET_KEY=sk_test_... or sk_live_...
   FRONTEND_URL=https://your-domain.com
   ```

2. **User Authentication** - Verify user is logged in:
   ```javascript
   // Test in browser console
   const { data: { session } } = await supabase.auth.getSession();
   console.log('User authenticated:', !!session?.access_token);
   ```

3. **Test the Fixed Function**:
   ```bash
   curl -X POST "https://bmhsrfvrpxmwydzepzyi.supabase.co/functions/v1/connect-account" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"action": "create_onboarding_link"}'
   ```

### 2. Storage Bucket Creation Errors (400 Bad Request)

Storage bucket errors during app initialization are usually safe to ignore as they often indicate:
- Buckets already exist
- RLS policies prevent creation
- Service role permissions

**To resolve:**
1. Check if buckets exist in Supabase dashboard
2. Verify storage policies in Database > Policies
3. Ensure service role has proper permissions

### 3. Edge Function Deployment Issues

**Common Deployment Problems:**
- Missing environment variables
- Incorrect function structure
- Import/export syntax errors

**Debugging Steps:**
1. Check function logs in Supabase dashboard
2. Verify all imports are using Deno-compatible URLs
3. Test functions locally using `supabase functions serve`

### 4. Stripe Configuration Issues

**Verify Stripe Setup:**
- Test and live API keys are correctly set
- Webhook endpoints are configured
- Connect platform settings are enabled in Stripe dashboard

**Check Stripe Connect Settings:**
1. Go to Stripe Dashboard > Connect > Settings
2. Ensure "Express accounts" is enabled
3. Verify redirect URLs match your frontend

## Testing

Each function can be tested locally using the Supabase CLI:

```bash
supabase functions serve <function-name> --env-file .env.local
```

Make sure you have a local `.env.local` file with the required environment variables.

## Security Considerations

- All functions enforce authentication where appropriate
- Authorization is verified before any sensitive operations
- Data is validated before being processed
- User ownership is verified before operations on user resources

## Error Handling

All functions use consistent error handling through the `formatError` helper, which:

1. Logs errors to the console
2. Returns appropriate HTTP status codes
3. Provides meaningful error messages while hiding sensitive details
