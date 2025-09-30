-- Foundations: idempotency, outbox, stripe_events (RLS enabled)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Idempotency keys
CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  key text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '24 hours',
  response jsonb,
  status_code int
);
ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;

-- Outbox events
CREATE TABLE IF NOT EXISTS public.outbox_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);
CREATE INDEX IF NOT EXISTS outbox_events_unprocessed_idx ON public.outbox_events (processed_at) WHERE processed_at IS NULL;
ALTER TABLE public.outbox_events ENABLE ROW LEVEL SECURITY;

-- Stripe events persistence
CREATE TABLE IF NOT EXISTS public.stripe_events (
  id text PRIMARY KEY,
  type text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);
CREATE INDEX IF NOT EXISTS stripe_events_unprocessed_idx ON public.stripe_events (processed_at) WHERE processed_at IS NULL;
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY; 