-- Create missing tables for edge functions
-- These tables are referenced in the edge functions but don't exist in the database

-- Stripe customers table
CREATE TABLE IF NOT EXISTS "public"."stripe_customers" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" uuid REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "stripe_customer_id" text UNIQUE NOT NULL,
    "email" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT NOW(),
    "updated_at" timestamp with time zone DEFAULT NOW()
);

-- Stripe subscriptions table
CREATE TABLE IF NOT EXISTS "public"."stripe_subscriptions" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" uuid REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "stripe_subscription_id" text UNIQUE NOT NULL,
    "status" text NOT NULL,
    "current_period_start" timestamp with time zone,
    "current_period_end" timestamp with time zone,
    "cancel_at" timestamp with time zone,
    "canceled_at" timestamp with time zone,
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamp with time zone DEFAULT NOW(),
    "updated_at" timestamp with time zone DEFAULT NOW()
);

-- Pledges table for event funding
CREATE TABLE IF NOT EXISTS "public"."pledges" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" uuid REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "event_id" uuid REFERENCES "public"."events"("id") ON DELETE CASCADE,
    "amount" numeric(10,2) NOT NULL,
    "currency" text DEFAULT 'usd',
    "payment_intent_id" text,
    "status" text NOT NULL DEFAULT 'pending',
    "created_at" timestamp with time zone DEFAULT NOW(),
    "updated_at" timestamp with time zone DEFAULT NOW()
);

-- Payment history table for tracking all payment activities
CREATE TABLE IF NOT EXISTS "public"."payment_history" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" uuid REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "payment_intent_id" text,
    "amount_in_cents" integer NOT NULL,
    "currency" text DEFAULT 'usd',
    "status" text NOT NULL,
    "retry_count" integer DEFAULT 0,
    "last_retry_at" timestamp with time zone,
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamp with time zone DEFAULT NOW(),
    "updated_at" timestamp with time zone DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE "public"."stripe_customers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."stripe_subscriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."pledges" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."payment_history" ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for new tables
CREATE POLICY "Users can view own stripe customer data" ON "public"."stripe_customers"
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view own subscriptions" ON "public"."stripe_subscriptions"
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view own pledges" ON "public"."pledges"
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create pledges" ON "public"."pledges"
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own payment history" ON "public"."payment_history"
  FOR SELECT USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_stripe_customers_user_id" ON "public"."stripe_customers"("user_id");
CREATE INDEX IF NOT EXISTS "idx_stripe_customers_stripe_id" ON "public"."stripe_customers"("stripe_customer_id");
CREATE INDEX IF NOT EXISTS "idx_stripe_subscriptions_user_id" ON "public"."stripe_subscriptions"("user_id");
CREATE INDEX IF NOT EXISTS "idx_pledges_user_id" ON "public"."pledges"("user_id");
CREATE INDEX IF NOT EXISTS "idx_pledges_event_id" ON "public"."pledges"("event_id");
CREATE INDEX IF NOT EXISTS "idx_payment_history_user_id" ON "public"."payment_history"("user_id"); 