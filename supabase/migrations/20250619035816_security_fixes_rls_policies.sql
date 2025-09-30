-- CRITICAL SECURITY FIXES
-- This migration addresses 17 security vulnerabilities identified by Supabase advisor

-- 1. Enable RLS on ContentTest table (was completely unprotected)
ALTER TABLE "public"."ContentTest" ENABLE ROW LEVEL SECURITY;

-- 2. Add RLS policies for all tables that have RLS enabled but no policies

-- Users table policies
CREATE POLICY "Users can view own profile" ON "public"."users"
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON "public"."users"
  FOR UPDATE USING (auth.uid() = id);

-- Events policies  
CREATE POLICY "Public events are viewable by all" ON "public"."events"
  FOR SELECT USING (is_public = true OR creator_id = auth.uid());

CREATE POLICY "Users can create events" ON "public"."events"
  FOR INSERT WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Event creators can update their events" ON "public"."events"
  FOR UPDATE USING (creator_id = auth.uid());

CREATE POLICY "Event creators can delete their events" ON "public"."events"
  FOR DELETE USING (creator_id = auth.uid());

-- Payments policies
CREATE POLICY "Users can view own payments" ON "public"."payments"
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own payments" ON "public"."payments"
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON "public"."transactions"
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own transactions" ON "public"."transactions"
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Credit transactions policies
CREATE POLICY "Users can view own credit transactions" ON "public"."credit_transactions"
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own credit transactions" ON "public"."credit_transactions"
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Wallets policies
CREATE POLICY "Users can view own wallet" ON "public"."wallets"
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own wallet" ON "public"."wallets"
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can create own wallet" ON "public"."wallets"
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON "public"."notifications"
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" ON "public"."notifications"
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own notifications" ON "public"."notifications"
  FOR UPDATE USING (user_id = auth.uid());

-- Products policies
CREATE POLICY "Public products are viewable" ON "public"."products"
  FOR SELECT USING (status = 'active' OR creator_id = auth.uid());

CREATE POLICY "Users can create products" ON "public"."products"
  FOR INSERT WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Product creators can update their products" ON "public"."products"
  FOR UPDATE USING (creator_id = auth.uid());

CREATE POLICY "Product creators can delete their products" ON "public"."products"
  FOR DELETE USING (creator_id = auth.uid());

-- Stores policies
CREATE POLICY "Public stores are viewable" ON "public"."stores"
  FOR SELECT USING (status = 'active' OR owner_id = auth.uid());

CREATE POLICY "Users can create stores" ON "public"."stores"
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Store owners can update their stores" ON "public"."stores"
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Store owners can delete their stores" ON "public"."stores"
  FOR DELETE USING (owner_id = auth.uid());

-- Venues policies
CREATE POLICY "Venues are publicly viewable" ON "public"."venues"
  FOR SELECT USING (true);

CREATE POLICY "Users can create venues" ON "public"."venues"
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Venue owners can update their venues" ON "public"."venues"
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Venue owners can delete their venues" ON "public"."venues"
  FOR DELETE USING (owner_id = auth.uid());

-- Locations policies
CREATE POLICY "Locations are publicly viewable" ON "public"."locations"
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create locations" ON "public"."locations"
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update locations" ON "public"."locations"
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- User locations policies
CREATE POLICY "Users can view own locations" ON "public"."user_locations"
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own locations" ON "public"."user_locations"
  FOR ALL USING (user_id = auth.uid());

-- Conversations policies
CREATE POLICY "Users can view conversations they're part of" ON "public"."conversations"
  FOR SELECT USING (
    auth.uid()::text = ANY(
      SELECT jsonb_array_elements_text(members)
    )
  );

CREATE POLICY "Users can create conversations" ON "public"."conversations"
  FOR INSERT WITH CHECK (
    auth.uid()::text = ANY(
      SELECT jsonb_array_elements_text(members)
    )
  );

CREATE POLICY "Users can update conversations they're part of" ON "public"."conversations"
  FOR UPDATE USING (
    auth.uid()::text = ANY(
      SELECT jsonb_array_elements_text(members)
    )
  );

-- Referral codes policies
CREATE POLICY "Users can view own referral codes" ON "public"."referral_codes"
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own referral codes" ON "public"."referral_codes"
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own referral codes" ON "public"."referral_codes"
  FOR UPDATE USING (user_id = auth.uid());

-- ContentTest policies (for testing - more permissive)
CREATE POLICY "ContentTest is publicly readable" ON "public"."ContentTest"
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create ContentTest" ON "public"."ContentTest"
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update ContentTest" ON "public"."ContentTest"
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- 3. Fix function security issue - handle_new_user with mutable search_path
DROP FUNCTION IF EXISTS handle_new_user();
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW());
  RETURN NEW;
END;
$$;

-- Recreate the trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();
