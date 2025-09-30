-- Migration to replace ContentTest mock data with proper tables
-- This migration creates all tables that were previously using ContentTest as a placeholder

-- Communities table
CREATE TABLE IF NOT EXISTS "public"."communities" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "name" text NOT NULL,
    "description" text,
    "owner_id" uuid REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "is_private" boolean DEFAULT false,
    "location" text,
    "tags" text[] DEFAULT '{}'::text[],
    "image_url" text,
    "banner_url" text,
    "member_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT NOW(),
    "updated_at" timestamp with time zone DEFAULT NOW()
);

-- Community members table
CREATE TABLE IF NOT EXISTS "public"."community_members" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "community_id" uuid REFERENCES "public"."communities"("id") ON DELETE CASCADE,
    "user_id" uuid REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "role" text DEFAULT 'member',
    "joined_at" timestamp with time zone DEFAULT NOW(),
    "created_at" timestamp with time zone DEFAULT NOW(),
    "updated_at" timestamp with time zone DEFAULT NOW(),
    UNIQUE("community_id", "user_id")
);

-- Podcasts table
CREATE TABLE IF NOT EXISTS "public"."podcasts" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "title" text NOT NULL,
    "description" text,
    "creator_id" uuid REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "image_url" text,
    "audio_url" text NOT NULL,
    "duration_seconds" integer,
    "is_featured" boolean DEFAULT false,
    "is_public" boolean DEFAULT true,
    "play_count" integer DEFAULT 0,
    "tags" text[] DEFAULT '{}'::text[],
    "created_at" timestamp with time zone DEFAULT NOW(),
    "updated_at" timestamp with time zone DEFAULT NOW()
);

-- Podcast comments table
CREATE TABLE IF NOT EXISTS "public"."podcast_comments" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "podcast_id" uuid REFERENCES "public"."podcasts"("id") ON DELETE CASCADE,
    "user_id" uuid REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "content" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT NOW(),
    "updated_at" timestamp with time zone DEFAULT NOW()
);

-- Promotions table
CREATE TABLE IF NOT EXISTS "public"."promotions" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "name" text NOT NULL,
    "description" text,
    "creator_id" uuid REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "type" text NOT NULL,
    "discount_amount" numeric(10,2),
    "discount_percentage" integer,
    "code" text,
    "start_date" timestamp with time zone,
    "end_date" timestamp with time zone,
    "max_uses" integer,
    "current_uses" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "applies_to" text[] DEFAULT '{}'::text[],
    "minimum_purchase" numeric(10,2) DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT NOW(),
    "updated_at" timestamp with time zone DEFAULT NOW()
);

-- Promotional credits table
CREATE TABLE IF NOT EXISTS "public"."promotional_credits" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" uuid REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "amount" numeric(10,2) NOT NULL,
    "currency" text DEFAULT 'usd',
    "promotion_id" uuid REFERENCES "public"."promotions"("id") ON DELETE SET NULL,
    "expires_at" timestamp with time zone,
    "is_used" boolean DEFAULT false,
    "used_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT NOW(),
    "updated_at" timestamp with time zone DEFAULT NOW()
);

-- Caterers table
CREATE TABLE IF NOT EXISTS "public"."caterers" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "name" text NOT NULL,
    "description" text,
    "owner_id" uuid REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "image_url" text,
    "contact_email" text,
    "contact_phone" text,
    "location" text,
    "is_featured" boolean DEFAULT false,
    "rating" numeric(3,2),
    "price_range" text,
    "cuisine_types" text[] DEFAULT '{}'::text[],
    "created_at" timestamp with time zone DEFAULT NOW(),
    "updated_at" timestamp with time zone DEFAULT NOW()
);

-- User activities table for analytics
CREATE TABLE IF NOT EXISTS "public"."user_activities" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" uuid REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "action" text NOT NULL,
    "resource_type" text,
    "resource_id" text,
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamp with time zone DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE "public"."communities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."community_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."podcasts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."podcast_comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."promotions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."promotional_credits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."caterers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_activities" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Communities
CREATE POLICY "Public communities are viewable by everyone" ON "public"."communities"
  FOR SELECT USING (NOT is_private);
  
CREATE POLICY "Private communities are viewable by members" ON "public"."communities"
  FOR SELECT USING (
    is_private AND EXISTS (
      SELECT 1 FROM "public"."community_members" 
      WHERE "community_id" = "communities"."id" AND "user_id" = auth.uid()
    )
  );

CREATE POLICY "Communities can be created by authenticated users" ON "public"."communities"
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  
CREATE POLICY "Communities can be updated by owners" ON "public"."communities"
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Communities can be deleted by owners" ON "public"."communities"
  FOR DELETE USING (owner_id = auth.uid());

-- RLS Policies for Community Members
CREATE POLICY "Community members are viewable by everyone" ON "public"."community_members"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "public"."communities" 
      WHERE "id" = "community_members"."community_id" AND NOT "is_private"
    )
  );

CREATE POLICY "Private community members are viewable by other members" ON "public"."community_members"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "public"."community_members" AS cm
      JOIN "public"."communities" AS c ON c.id = cm.community_id
      WHERE c.id = "community_members"."community_id" 
      AND c.is_private
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join communities" ON "public"."community_members"
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave communities" ON "public"."community_members"
  FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for Podcasts
CREATE POLICY "Public podcasts are viewable by everyone" ON "public"."podcasts"
  FOR SELECT USING (is_public);

CREATE POLICY "Private podcasts are viewable by creators" ON "public"."podcasts"
  FOR SELECT USING (NOT is_public AND creator_id = auth.uid());

CREATE POLICY "Podcasts can be created by authenticated users" ON "public"."podcasts"
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Podcasts can be updated by creators" ON "public"."podcasts"
  FOR UPDATE USING (creator_id = auth.uid());

CREATE POLICY "Podcasts can be deleted by creators" ON "public"."podcasts"
  FOR DELETE USING (creator_id = auth.uid());

-- RLS Policies for Podcast Comments
CREATE POLICY "Comments on public podcasts are viewable by everyone" ON "public"."podcast_comments"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "public"."podcasts" 
      WHERE "id" = "podcast_comments"."podcast_id" AND "is_public"
    )
  );

CREATE POLICY "Comments on private podcasts are viewable by creators" ON "public"."podcast_comments"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "public"."podcasts" 
      WHERE "id" = "podcast_comments"."podcast_id" AND NOT "is_public" AND "creator_id" = auth.uid()
    )
  );

CREATE POLICY "Users can comment on podcasts" ON "public"."podcast_comments"
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM "public"."podcasts" 
      WHERE "id" = "podcast_comments"."podcast_id" AND 
      (
        "is_public" OR "creator_id" = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete their own comments" ON "public"."podcast_comments"
  FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for Promotions
CREATE POLICY "Active promotions are viewable by everyone" ON "public"."promotions"
  FOR SELECT USING (is_active);

CREATE POLICY "All promotions are viewable by creators" ON "public"."promotions"
  FOR SELECT USING (creator_id = auth.uid());

CREATE POLICY "Promotions can be created by authenticated users" ON "public"."promotions"
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Promotions can be updated by creators" ON "public"."promotions"
  FOR UPDATE USING (creator_id = auth.uid());

CREATE POLICY "Promotions can be deleted by creators" ON "public"."promotions"
  FOR DELETE USING (creator_id = auth.uid());

-- RLS Policies for Promotional Credits
CREATE POLICY "Users can view their own promotional credits" ON "public"."promotional_credits"
  FOR SELECT USING (user_id = auth.uid());

-- RLS Policies for Caterers
CREATE POLICY "Caterers are viewable by everyone" ON "public"."caterers"
  FOR SELECT USING (true);

CREATE POLICY "Caterers can be created by authenticated users" ON "public"."caterers"
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Caterers can be updated by owners" ON "public"."caterers"
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Caterers can be deleted by owners" ON "public"."caterers"
  FOR DELETE USING (owner_id = auth.uid());

-- RLS Policies for User Activities
CREATE POLICY "Users can view their own activities" ON "public"."user_activities"
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own activity records" ON "public"."user_activities"
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_communities_owner_id" ON "public"."communities"("owner_id");
CREATE INDEX IF NOT EXISTS "idx_communities_is_private" ON "public"."communities"("is_private");
CREATE INDEX IF NOT EXISTS "idx_communities_tags" ON "public"."communities" USING GIN("tags");

CREATE INDEX IF NOT EXISTS "idx_community_members_community_id" ON "public"."community_members"("community_id");
CREATE INDEX IF NOT EXISTS "idx_community_members_user_id" ON "public"."community_members"("user_id");

CREATE INDEX IF NOT EXISTS "idx_podcasts_creator_id" ON "public"."podcasts"("creator_id");
CREATE INDEX IF NOT EXISTS "idx_podcasts_is_public" ON "public"."podcasts"("is_public");
CREATE INDEX IF NOT EXISTS "idx_podcasts_is_featured" ON "public"."podcasts"("is_featured");
CREATE INDEX IF NOT EXISTS "idx_podcasts_tags" ON "public"."podcasts" USING GIN("tags");

CREATE INDEX IF NOT EXISTS "idx_podcast_comments_podcast_id" ON "public"."podcast_comments"("podcast_id");
CREATE INDEX IF NOT EXISTS "idx_podcast_comments_user_id" ON "public"."podcast_comments"("user_id");

CREATE INDEX IF NOT EXISTS "idx_promotions_creator_id" ON "public"."promotions"("creator_id");
CREATE INDEX IF NOT EXISTS "idx_promotions_is_active" ON "public"."promotions"("is_active");
CREATE INDEX IF NOT EXISTS "idx_promotions_code" ON "public"."promotions"("code");
CREATE INDEX IF NOT EXISTS "idx_promotions_applies_to" ON "public"."promotions" USING GIN("applies_to");

CREATE INDEX IF NOT EXISTS "idx_promotional_credits_user_id" ON "public"."promotional_credits"("user_id");
CREATE INDEX IF NOT EXISTS "idx_promotional_credits_promotion_id" ON "public"."promotional_credits"("promotion_id");

CREATE INDEX IF NOT EXISTS "idx_caterers_owner_id" ON "public"."caterers"("owner_id");
CREATE INDEX IF NOT EXISTS "idx_caterers_is_featured" ON "public"."caterers"("is_featured");
CREATE INDEX IF NOT EXISTS "idx_caterers_cuisine_types" ON "public"."caterers" USING GIN("cuisine_types");

CREATE INDEX IF NOT EXISTS "idx_user_activities_user_id" ON "public"."user_activities"("user_id");
CREATE INDEX IF NOT EXISTS "idx_user_activities_action" ON "public"."user_activities"("action");
CREATE INDEX IF NOT EXISTS "idx_user_activities_resource_type" ON "public"."user_activities"("resource_type");
