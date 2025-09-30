-- Migration to add database functions for managing community member counts
-- These functions are used by the community service to keep member_count in sync

-- Function to increment the member count for a community
CREATE OR REPLACE FUNCTION increment_community_member_count(community_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE communities
  SET member_count = member_count + 1
  WHERE id = community_id;
END;
$$;

-- Function to decrement the member count for a community
CREATE OR REPLACE FUNCTION decrement_community_member_count(community_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE communities
  SET member_count = GREATEST(member_count - 1, 0)
  WHERE id = community_id;
END;
$$;

-- Add RLS policies for these functions
GRANT EXECUTE ON FUNCTION increment_community_member_count TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_community_member_count TO authenticated;

-- Create trigger to automatically update member count when members are added or removed
CREATE OR REPLACE FUNCTION update_community_member_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM increment_community_member_count(NEW.community_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM decrement_community_member_count(OLD.community_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create the trigger on the community_members table
DROP TRIGGER IF EXISTS community_member_count_trigger ON community_members;
CREATE TRIGGER community_member_count_trigger
AFTER INSERT OR DELETE ON community_members
FOR EACH ROW
EXECUTE FUNCTION update_community_member_count();

-- Create tables for community subscription settings and subscribers if they don't exist yet
CREATE TABLE IF NOT EXISTS community_subscription_settings (
  community_id UUID PRIMARY KEY REFERENCES communities(id) ON DELETE CASCADE,
  is_subscription_enabled BOOLEAN DEFAULT FALSE,
  monthly_price DECIMAL(10, 2),
  yearly_price DECIMAL(10, 2),
  currency TEXT DEFAULT 'usd',
  features JSONB DEFAULT '[]'::JSONB,
  description TEXT,
  stripe_product_id TEXT,
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for community_subscription_settings
ALTER TABLE community_subscription_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Community owners can manage their subscription settings"
  ON community_subscription_settings
  FOR ALL
  USING (
    community_id IN (
      SELECT id FROM communities WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view subscription settings"
  ON community_subscription_settings
  FOR SELECT
  USING (true);

-- Create community subscribers table
CREATE TABLE IF NOT EXISTS community_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  subscription_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, community_id)
);

-- Add RLS policies for community_subscribers
ALTER TABLE community_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions"
  ON community_subscribers
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Community owners can view their subscribers"
  ON community_subscribers
  FOR SELECT
  USING (
    community_id IN (
      SELECT id FROM communities WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage all subscriptions"
  ON community_subscribers
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Create community events table
CREATE TABLE IF NOT EXISTS community_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  is_virtual BOOLEAN DEFAULT FALSE,
  meeting_url TEXT,
  is_subscribers_only BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for community_events
ALTER TABLE community_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view non-subscriber events"
  ON community_events
  FOR SELECT
  USING (NOT is_subscribers_only);

CREATE POLICY "Subscribers can view subscriber-only events"
  ON community_events
  FOR SELECT
  USING (
    is_subscribers_only = false OR
    (
      community_id IN (
        SELECT community_id FROM community_subscribers 
        WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

CREATE POLICY "Community owners can manage events"
  ON community_events
  FOR ALL
  USING (
    community_id IN (
      SELECT id FROM communities WHERE owner_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_community_subscribers_user_id ON community_subscribers(user_id);
CREATE INDEX IF NOT EXISTS idx_community_subscribers_community_id ON community_subscribers(community_id);
CREATE INDEX IF NOT EXISTS idx_community_events_community_id ON community_events(community_id);
CREATE INDEX IF NOT EXISTS idx_community_events_start_date ON community_events(start_date);
