-- Add fulfillment-related columns to orders table if they do not already exist
ALTER TABLE IF EXISTS public.orders
  ADD COLUMN IF NOT EXISTS fulfillment_status text,
  ADD COLUMN IF NOT EXISTS fulfillment_ref text,
  ADD COLUMN IF NOT EXISTS tracking_number text,
  ADD COLUMN IF NOT EXISTS carrier text,
  ADD COLUMN IF NOT EXISTS tracking_url text,
  ADD COLUMN IF NOT EXISTS fulfillment_error text,
  ADD COLUMN IF NOT EXISTS shipped_at timestamptz;

-- Optional: simple status enum emulation via CHECK (soft)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'orders' AND c.conname = 'orders_fulfillment_status_check'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_fulfillment_status_check
      CHECK (
        fulfillment_status IS NULL OR fulfillment_status IN (
          'created','accepted','in_production','printed','shipped','cancelled','submitted','submission_failed'
        )
      );
  END IF;
END$$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_status ON public.orders(fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_ref ON public.orders(fulfillment_ref);
CREATE INDEX IF NOT EXISTS idx_orders_shipped_at ON public.orders(shipped_at);
