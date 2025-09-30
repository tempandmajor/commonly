
-- Create PaymentsTest table for payment verification
CREATE TABLE public."PaymentsTest" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  amount_in_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_type TEXT,
  description TEXT,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  is_all_or_nothing BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create Orders table for order management
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add subscription fields to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS subscription JSONB DEFAULT NULL;

-- Add payment settings to users table for payment preferences
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS payment_settings JSONB DEFAULT '{}'::jsonb;

-- Add stock quantity to products table if not exists
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;

-- Enable RLS for PaymentsTest
ALTER TABLE public."PaymentsTest" ENABLE ROW LEVEL SECURITY;

-- Enable RLS for orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for PaymentsTest
CREATE POLICY "Users can view their own payments" ON public."PaymentsTest"
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payments" ON public."PaymentsTest"
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payments" ON public."PaymentsTest"
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for orders
CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders" ON public.orders
  FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_test_user_id ON public."PaymentsTest"(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_test_status ON public."PaymentsTest"(status);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
