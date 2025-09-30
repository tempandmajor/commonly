-- Payment Service Migration: Standardize Schema
-- 
-- This migration normalizes the database schema for the consolidated payment service
-- by creating standardized tables and consistent Row Level Security policies.

-- Create extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create standardized wallets table if not exists
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  credit_balance DECIMAL(12,2) DEFAULT 0,
  balance_in_cents INTEGER DEFAULT 0,
  available_balance_in_cents INTEGER DEFAULT 0, 
  pending_balance_in_cents INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Ensure one wallet per user
  CONSTRAINT wallets_user_id_unique UNIQUE (user_id)
);

-- Create standardized transactions table if not exists
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id UUID REFERENCES wallets(id),
  amount_in_cents INTEGER NOT NULL,
  description TEXT NOT NULL,
  transaction_type TEXT NOT NULL,
  status TEXT NOT NULL,
  reference_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Enforce status values
  CONSTRAINT transactions_status_check CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  
  -- Enforce transaction types
  CONSTRAINT transactions_type_check CHECK (transaction_type IN (
    'credit_addition', 'credit_deduction', 'payment', 
    'refund', 'transfer', 'bonus', 'miscellaneous'
  ))
);

-- Create standardized payment_methods table if not exists
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  last_four VARCHAR(4),
  expiry_month INTEGER,
  expiry_year INTEGER,
  brand TEXT,
  stripe_payment_method_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Enforce payment method types
  CONSTRAINT payment_methods_type_check CHECK (type IN (
    'credit_card', 'platform_credit', 'bank_account', 'paypal'
  ))
);

-- Create customer mapping table if not exists
CREATE TABLE IF NOT EXISTS payment_customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Ensure one mapping per user
  CONSTRAINT payment_customers_user_id_unique UNIQUE (user_id),
  
  -- Ensure stripe customer id is provided
  CONSTRAINT payment_customers_stripe_id_not_null CHECK (stripe_customer_id IS NOT NULL)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS wallets_user_id_idx ON wallets(user_id);
CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON transactions(user_id);
CREATE INDEX IF NOT EXISTS transactions_wallet_id_idx ON transactions(wallet_id);
CREATE INDEX IF NOT EXISTS transactions_created_at_idx ON transactions(created_at);
CREATE INDEX IF NOT EXISTS transactions_status_idx ON transactions(status);
CREATE INDEX IF NOT EXISTS payment_methods_user_id_idx ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS payment_customers_user_id_idx ON payment_customers(user_id);

-- Create or replace trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to all tables if not exists
DROP TRIGGER IF EXISTS update_wallets_updated_at ON wallets;
CREATE TRIGGER update_wallets_updated_at
BEFORE UPDATE ON wallets
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON transactions
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_methods_updated_at ON payment_methods;
CREATE TRIGGER update_payment_methods_updated_at
BEFORE UPDATE ON payment_methods
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_customers_updated_at ON payment_customers;
CREATE TRIGGER update_payment_customers_updated_at
BEFORE UPDATE ON payment_customers
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_customers ENABLE ROW LEVEL SECURITY;

-- Wallets policies
DROP POLICY IF EXISTS wallets_select_policy ON wallets;
CREATE POLICY wallets_select_policy ON wallets
  FOR SELECT USING (auth.uid() = user_id);

-- Transactions policies
DROP POLICY IF EXISTS transactions_select_policy ON transactions;
CREATE POLICY transactions_select_policy ON transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Payment methods policies
DROP POLICY IF EXISTS payment_methods_select_policy ON payment_methods;
CREATE POLICY payment_methods_select_policy ON payment_methods
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS payment_methods_delete_policy ON payment_methods;
CREATE POLICY payment_methods_delete_policy ON payment_methods
  FOR DELETE USING (auth.uid() = user_id);

-- Payment customers policies
DROP POLICY IF EXISTS payment_customers_select_policy ON payment_customers;
CREATE POLICY payment_customers_select_policy ON payment_customers
  FOR SELECT USING (auth.uid() = user_id);

-- Grant permissions to authenticated users
GRANT SELECT ON wallets TO authenticated;
GRANT SELECT ON transactions TO authenticated;
GRANT SELECT, DELETE ON payment_methods TO authenticated;
GRANT SELECT ON payment_customers TO authenticated;

-- Grant permissions to service_role (for edge functions)
GRANT ALL ON wallets TO service_role;
GRANT ALL ON transactions TO service_role;
GRANT ALL ON payment_methods TO service_role;
GRANT ALL ON payment_customers TO service_role;
