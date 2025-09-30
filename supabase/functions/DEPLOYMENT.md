# Deploying Supabase Edge Functions

This guide explains how to deploy the CommonlyApp Edge Functions to your Supabase project.

## Prerequisites

1. Install the Supabase CLI if you haven't already:
```bash
npm install -g supabase
```

2. Login to your Supabase account:
```bash
supabase login
```

3. Link your project (replace `your-project-ref` with your actual project reference):
```bash
supabase link --project-ref your-project-ref
```

## Setting Environment Variables

Before deployment, make sure to set the following environment variables in your Supabase project:

1. Go to your Supabase project dashboard
2. Navigate to Settings > API > Environment Variables
3. Set the following variables:

```
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_signing_secret
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
FRONTEND_URL=your_frontend_url
SUPABASE_CRON_KEY=your_cron_secret_key
```

## Deploy All Functions

To deploy all functions at once:

```bash
supabase functions deploy --project-ref your-project-ref
```

## Deploy Individual Functions

To deploy a specific function:

```bash
supabase functions deploy function-name --project-ref your-project-ref
```

For example:
```bash
supabase functions deploy payment-methods --project-ref your-project-ref
```

## Testing Deployed Functions

After deployment, you can test each function directly in the browser or using an API tool like Postman, Insomnia, or curl.

Example curl command:
```bash
curl -X POST https://your-project-ref.supabase.co/functions/v1/payment-methods \
  -H "Authorization: Bearer YOUR_SUPABASE_AUTH_TOKEN" \
  -H "Content-Type: application/json"
```

## Scheduling Tasks

For scheduled tasks, you'll need to set up a Supabase cron job or use an external service like GitHub Actions:

1. Go to your Supabase dashboard
2. Navigate to Database > Functions > Scheduled Functions
3. Create a new scheduled function with the appropriate schedule
4. The function should make a request to your edge function endpoint with proper authorization

Example schedule function:
```sql
-- Run every day at midnight UTC
CREATE OR REPLACE FUNCTION handle_expired_subscriptions()
RETURNS void
LANGUAGE 'plpgsql'
AS $$
BEGIN
  PERFORM
    net.http_post(
      url := 'https://your-project-ref.supabase.co/functions/v1/scheduled-tasks/expired-subscriptions',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_CRON_KEY"}'::jsonb
    );
END;
$$;

SELECT cron.schedule(
  'handle-expired-subscriptions',
  '0 0 * * *',  -- cron expression: At 00:00 every day
  $$SELECT handle_expired_subscriptions()$$
);
```

## Function Status and Logs

To monitor your functions:

1. Check function logs in the Supabase Dashboard under Edge Functions
2. Use the Supabase CLI to get logs:
   ```bash
   supabase functions logs --project-ref your-project-ref
   ```

## Function Call Examples from Frontend

See the `/src/services/supabase/edge-functions.ts` file for examples of how to call these functions from your frontend code.
