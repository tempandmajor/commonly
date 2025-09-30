-- Outbox enhancements: attempts, backoff, DLQ
DO $$ BEGIN
  ALTER TABLE public.outbox_events
    ADD COLUMN IF NOT EXISTS attempts int NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS next_attempt_at timestamptz NOT NULL DEFAULT now();
EXCEPTION WHEN undefined_table THEN
  -- table may not exist in some environments; ignore
  NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.outbox_dead_letter (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_event_id uuid NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  attempt int NOT NULL,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.outbox_dead_letter ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS outbox_events_retry_idx ON public.outbox_events (next_attempt_at) WHERE processed_at IS NULL;
CREATE INDEX IF NOT EXISTS outbox_dead_letter_created_idx ON public.outbox_dead_letter (created_at DESC); 