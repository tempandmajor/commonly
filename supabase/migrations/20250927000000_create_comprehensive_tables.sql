-- Create comprehensive missing tables for all functionality
-- This migration adds all tables needed for a fully functional app

-- Categories table for organizing content
CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "name" text UNIQUE NOT NULL,
    "description" text,
    "icon" text,
    "color" text,
    "slug" text UNIQUE,
    "created_at" timestamp with time zone DEFAULT NOW(),
    "updated_at" timestamp with time zone DEFAULT NOW()
);

-- Artists table for music functionality
CREATE TABLE IF NOT EXISTS "public"."artists" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" uuid REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "stage_name" text NOT NULL,
    "bio" text,
    "image_url" text,
    "verified" boolean DEFAULT false,
    "genres" text[] DEFAULT '{}',
    "followers_count" integer DEFAULT 0,
    "social_links" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamp with time zone DEFAULT NOW(),
    "updated_at" timestamp with time zone DEFAULT NOW()
);

-- Podcasts table for podcast functionality
CREATE TABLE IF NOT EXISTS "public"."podcasts" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "title" text NOT NULL,
    "description" text,
    "creator_id" uuid REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "type" text DEFAULT 'audio' CHECK (type IN ('audio', 'video')),
    "thumbnail_url" text,
    "cover_image" text,
    "file_url" text,
    "audio_url" text,
    "video_url" text,
    "duration" integer DEFAULT 0,
    "is_private" boolean DEFAULT false,
    "categories" text[] DEFAULT '{}',
    "tags" text[] DEFAULT '{}',
    "likes" integer DEFAULT 0,
    "comments" integer DEFAULT 0,
    "plays" integer DEFAULT 0,
    "published_at" timestamp with time zone,
    "recorded_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT NOW(),
    "updated_at" timestamp with time zone DEFAULT NOW()
);

-- Messages table for real-time messaging
CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "conversation_id" uuid REFERENCES "public"."conversations"("id") ON DELETE CASCADE,
    "sender_id" uuid REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "receiver_id" uuid REFERENCES "public"."users"("id") ON DELETE SET NULL,
    "content" text NOT NULL,
    "message_type" text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
    "is_read" boolean DEFAULT false,
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamp with time zone DEFAULT NOW(),
    "updated_at" timestamp with time zone DEFAULT NOW()
);

-- Followers table for social functionality
CREATE TABLE IF NOT EXISTS "public"."followers" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "follower_id" uuid REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "following_id" uuid REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "created_at" timestamp with time zone DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

-- Community system tables
CREATE TABLE IF NOT EXISTS "public"."communities" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "name" text NOT NULL,
    "description" text,
    "creator_id" uuid REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "is_private" boolean DEFAULT false,
    "avatar_url" text,
    "banner_url" text,
    "member_count" integer DEFAULT 0,
    "tags" text[] DEFAULT '{}',
    "rules" text[] DEFAULT '{}',
    "settings" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamp with time zone DEFAULT NOW(),
    "updated_at" timestamp with time zone DEFAULT NOW()
);

-- Community memberships
CREATE TABLE IF NOT EXISTS "public"."community_memberships" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "community_id" uuid REFERENCES "public"."communities"("id") ON DELETE CASCADE,
    "user_id" uuid REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "role" text DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'moderator', 'member')),
    "joined_at" timestamp with time zone DEFAULT NOW(),
    "updated_at" timestamp with time zone DEFAULT NOW(),
    UNIQUE(community_id, user_id)
);

-- Posts table for social feeds
CREATE TABLE IF NOT EXISTS "public"."posts" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "author_id" uuid REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "community_id" uuid REFERENCES "public"."communities"("id") ON DELETE SET NULL,
    "content" text NOT NULL,
    "type" text DEFAULT 'text' CHECK (type IN ('text', 'image', 'video', 'link', 'poll')),
    "media_urls" text[] DEFAULT '{}',
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "likes_count" integer DEFAULT 0,
    "comments_count" integer DEFAULT 0,
    "shares_count" integer DEFAULT 0,
    "is_pinned" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT NOW(),
    "updated_at" timestamp with time zone DEFAULT NOW()
);

-- Post likes
CREATE TABLE IF NOT EXISTS "public"."post_likes" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "post_id" uuid REFERENCES "public"."posts"("id") ON DELETE CASCADE,
    "user_id" uuid REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "created_at" timestamp with time zone DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Post comments
CREATE TABLE IF NOT EXISTS "public"."post_comments" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "post_id" uuid REFERENCES "public"."posts"("id") ON DELETE CASCADE,
    "author_id" uuid REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "parent_id" uuid REFERENCES "public"."post_comments"("id") ON DELETE CASCADE,
    "content" text NOT NULL,
    "likes_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT NOW(),
    "updated_at" timestamp with time zone DEFAULT NOW()
);

-- Orders table for commerce
CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" uuid REFERENCES "public"."users"("id") ON DELETE SET NULL,
    "product_id" uuid REFERENCES "public"."products"("id") ON DELETE SET NULL,
    "quantity" integer NOT NULL DEFAULT 1,
    "total_price" integer NOT NULL, -- in cents
    "status" text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled', 'refunded')),
    "payment_id" uuid REFERENCES "public"."payments"("id") ON DELETE SET NULL,
    "shipping_address" jsonb,
    "billing_address" jsonb,
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamp with time zone DEFAULT NOW(),
    "updated_at" timestamp with time zone DEFAULT NOW()
);

-- Reviews table for products/events
CREATE TABLE IF NOT EXISTS "public"."reviews" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "reviewer_id" uuid REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "reviewee_type" text NOT NULL CHECK (reviewee_type IN ('product', 'event', 'venue', 'caterer', 'user')),
    "reviewee_id" uuid NOT NULL,
    "rating" integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    "title" text,
    "content" text,
    "helpful_count" integer DEFAULT 0,
    "verified_purchase" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT NOW(),
    "updated_at" timestamp with time zone DEFAULT NOW()
);

-- Event attendees
CREATE TABLE IF NOT EXISTS "public"."event_attendees" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "event_id" uuid REFERENCES "public"."events"("id") ON DELETE CASCADE,
    "user_id" uuid REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "status" text DEFAULT 'attending' CHECK (status IN ('attending', 'maybe', 'not_attending')),
    "ticket_type" text,
    "check_in_time" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT NOW(),
    "updated_at" timestamp with time zone DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- User wishlists
CREATE TABLE IF NOT EXISTS "public"."wishlists" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" uuid REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "product_id" uuid REFERENCES "public"."products"("id") ON DELETE CASCADE,
    "created_at" timestamp with time zone DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- Caterers table
CREATE TABLE IF NOT EXISTS "public"."caterers" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" uuid REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "business_name" text NOT NULL,
    "description" text,
    "cuisine_types" text[] DEFAULT '{}',
    "service_areas" text[] DEFAULT '{}',
    "price_range" text,
    "capacity_min" integer,
    "capacity_max" integer,
    "images" text[] DEFAULT '{}',
    "contact_info" jsonb DEFAULT '{}'::jsonb,
    "availability" jsonb DEFAULT '{}'::jsonb,
    "verified" boolean DEFAULT false,
    "rating" decimal(3,2) DEFAULT 0.0,
    "total_orders" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT NOW(),
    "updated_at" timestamp with time zone DEFAULT NOW()
);

-- Projects table for creative projects
CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "title" text NOT NULL,
    "description" text,
    "creator_id" uuid REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "category" text,
    "funding_goal" integer, -- in cents
    "current_funding" integer DEFAULT 0, -- in cents
    "deadline" timestamp with time zone,
    "status" text DEFAULT 'active' CHECK (status IN ('draft', 'active', 'funded', 'cancelled', 'completed')),
    "images" text[] DEFAULT '{}',
    "video_url" text,
    "rewards" jsonb DEFAULT '[]'::jsonb,
    "tags" text[] DEFAULT '{}',
    "backers_count" integer DEFAULT 0,
    "featured" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT NOW(),
    "updated_at" timestamp with time zone DEFAULT NOW()
);

-- Project backers
CREATE TABLE IF NOT EXISTS "public"."project_backers" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "project_id" uuid REFERENCES "public"."projects"("id") ON DELETE CASCADE,
    "user_id" uuid REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "amount" integer NOT NULL, -- in cents
    "reward_tier" text,
    "payment_id" uuid REFERENCES "public"."payments"("id") ON DELETE SET NULL,
    "status" text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'refunded')),
    "created_at" timestamp with time zone DEFAULT NOW(),
    "updated_at" timestamp with time zone DEFAULT NOW()
);

-- Fix missing columns in existing tables
ALTER TABLE "public"."products" ADD COLUMN IF NOT EXISTS "images" text[] DEFAULT '{}';
ALTER TABLE "public"."products" ADD COLUMN IF NOT EXISTS "category" text;
ALTER TABLE "public"."products" ADD COLUMN IF NOT EXISTS "in_stock" boolean DEFAULT true;
ALTER TABLE "public"."products" ADD COLUMN IF NOT EXISTS "stock_quantity" integer;
ALTER TABLE "public"."products" ADD COLUMN IF NOT EXISTS "tags" text[] DEFAULT '{}';

ALTER TABLE "public"."events" ADD COLUMN IF NOT EXISTS "category" text;
ALTER TABLE "public"."events" ADD COLUMN IF NOT EXISTS "tags" text[] DEFAULT '{}';
ALTER TABLE "public"."events" ADD COLUMN IF NOT EXISTS "price" integer; -- in cents
ALTER TABLE "public"."events" ADD COLUMN IF NOT EXISTS "is_free" boolean DEFAULT true;
ALTER TABLE "public"."events" ADD COLUMN IF NOT EXISTS "attendees_count" integer DEFAULT 0;

ALTER TABLE "public"."venues" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'active';

ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "bio" text;
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "location" text;
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "website" text;

-- Enable RLS on all new tables
ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."artists" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."podcasts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."followers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."communities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."community_memberships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."posts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."post_likes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."post_comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."event_attendees" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."wishlists" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."caterers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."project_backers" ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for public read access where appropriate
CREATE POLICY "Public read access for categories" ON "public"."categories"
  FOR SELECT USING (true);

CREATE POLICY "Public read access for artists" ON "public"."artists"
  FOR SELECT USING (true);

CREATE POLICY "Artists can update own profile" ON "public"."artists"
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can create artist profile" ON "public"."artists"
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Public read access for podcasts" ON "public"."podcasts"
  FOR SELECT USING (NOT is_private OR creator_id = auth.uid());

CREATE POLICY "Users can create podcasts" ON "public"."podcasts"
  FOR INSERT WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Users can update own podcasts" ON "public"."podcasts"
  FOR UPDATE USING (creator_id = auth.uid());

CREATE POLICY "Users can view messages in their conversations" ON "public"."messages"
  FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages" ON "public"."messages"
  FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Public read access for followers" ON "public"."followers"
  FOR SELECT USING (true);

CREATE POLICY "Users can follow/unfollow" ON "public"."followers"
  FOR ALL USING (follower_id = auth.uid());

CREATE POLICY "Public read access for communities" ON "public"."communities"
  FOR SELECT USING (NOT is_private OR id IN (
    SELECT community_id FROM community_memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create communities" ON "public"."communities"
  FOR INSERT WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Community owners/admins can update" ON "public"."communities"
  FOR UPDATE USING (id IN (
    SELECT community_id FROM community_memberships
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY "Users can view community memberships" ON "public"."community_memberships"
  FOR SELECT USING (
    user_id = auth.uid() OR
    community_id IN (SELECT id FROM communities WHERE NOT is_private)
  );

CREATE POLICY "Users can join communities" ON "public"."community_memberships"
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave communities" ON "public"."community_memberships"
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Public read access for posts" ON "public"."posts"
  FOR SELECT USING (
    community_id IS NULL OR
    community_id IN (SELECT id FROM communities WHERE NOT is_private) OR
    community_id IN (SELECT community_id FROM community_memberships WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create posts" ON "public"."posts"
  FOR INSERT WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can update own posts" ON "public"."posts"
  FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Users can delete own posts" ON "public"."posts"
  FOR DELETE USING (author_id = auth.uid());

CREATE POLICY "Users can like posts" ON "public"."post_likes"
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Public read access for post comments" ON "public"."post_comments"
  FOR SELECT USING (true);

CREATE POLICY "Users can comment on posts" ON "public"."post_comments"
  FOR INSERT WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can update own comments" ON "public"."post_comments"
  FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Users can view own orders" ON "public"."orders"
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create orders" ON "public"."orders"
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Public read access for reviews" ON "public"."reviews"
  FOR SELECT USING (true);

CREATE POLICY "Users can create reviews" ON "public"."reviews"
  FOR INSERT WITH CHECK (reviewer_id = auth.uid());

CREATE POLICY "Users can update own reviews" ON "public"."reviews"
  FOR UPDATE USING (reviewer_id = auth.uid());

CREATE POLICY "Public read access for event attendees" ON "public"."event_attendees"
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own attendance" ON "public"."event_attendees"
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view own wishlist" ON "public"."wishlists"
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own wishlist" ON "public"."wishlists"
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Public read access for caterers" ON "public"."caterers"
  FOR SELECT USING (true);

CREATE POLICY "Users can create caterer profile" ON "public"."caterers"
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own caterer profile" ON "public"."caterers"
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Public read access for projects" ON "public"."projects"
  FOR SELECT USING (status = 'active' OR creator_id = auth.uid());

CREATE POLICY "Users can create projects" ON "public"."projects"
  FOR INSERT WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Users can update own projects" ON "public"."projects"
  FOR UPDATE USING (creator_id = auth.uid());

CREATE POLICY "Public read access for project backers" ON "public"."project_backers"
  FOR SELECT USING (true);

CREATE POLICY "Users can back projects" ON "public"."project_backers"
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own backing" ON "public"."project_backers"
  FOR SELECT USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_artists_user_id" ON "public"."artists"("user_id");
CREATE INDEX IF NOT EXISTS "idx_podcasts_creator_id" ON "public"."podcasts"("creator_id");
CREATE INDEX IF NOT EXISTS "idx_podcasts_type" ON "public"."podcasts"("type");
CREATE INDEX IF NOT EXISTS "idx_messages_conversation_id" ON "public"."messages"("conversation_id");
CREATE INDEX IF NOT EXISTS "idx_messages_sender_id" ON "public"."messages"("sender_id");
CREATE INDEX IF NOT EXISTS "idx_followers_follower_id" ON "public"."followers"("follower_id");
CREATE INDEX IF NOT EXISTS "idx_followers_following_id" ON "public"."followers"("following_id");
CREATE INDEX IF NOT EXISTS "idx_communities_creator_id" ON "public"."communities"("creator_id");
CREATE INDEX IF NOT EXISTS "idx_community_memberships_user_id" ON "public"."community_memberships"("user_id");
CREATE INDEX IF NOT EXISTS "idx_community_memberships_community_id" ON "public"."community_memberships"("community_id");
CREATE INDEX IF NOT EXISTS "idx_posts_author_id" ON "public"."posts"("author_id");
CREATE INDEX IF NOT EXISTS "idx_posts_community_id" ON "public"."posts"("community_id");
CREATE INDEX IF NOT EXISTS "idx_post_likes_post_id" ON "public"."post_likes"("post_id");
CREATE INDEX IF NOT EXISTS "idx_post_likes_user_id" ON "public"."post_likes"("user_id");
CREATE INDEX IF NOT EXISTS "idx_post_comments_post_id" ON "public"."post_comments"("post_id");
CREATE INDEX IF NOT EXISTS "idx_orders_user_id" ON "public"."orders"("user_id");
CREATE INDEX IF NOT EXISTS "idx_orders_product_id" ON "public"."orders"("product_id");
CREATE INDEX IF NOT EXISTS "idx_reviews_reviewee_type_id" ON "public"."reviews"("reviewee_type", "reviewee_id");
CREATE INDEX IF NOT EXISTS "idx_event_attendees_event_id" ON "public"."event_attendees"("event_id");
CREATE INDEX IF NOT EXISTS "idx_event_attendees_user_id" ON "public"."event_attendees"("user_id");
CREATE INDEX IF NOT EXISTS "idx_wishlists_user_id" ON "public"."wishlists"("user_id");
CREATE INDEX IF NOT EXISTS "idx_caterers_user_id" ON "public"."caterers"("user_id");
CREATE INDEX IF NOT EXISTS "idx_projects_creator_id" ON "public"."projects"("creator_id");
CREATE INDEX IF NOT EXISTS "idx_projects_status" ON "public"."projects"("status");
CREATE INDEX IF NOT EXISTS "idx_project_backers_project_id" ON "public"."project_backers"("project_id");
CREATE INDEX IF NOT EXISTS "idx_project_backers_user_id" ON "public"."project_backers"("user_id");

-- Insert default categories
INSERT INTO "public"."categories" ("name", "description", "slug") VALUES
('Technology', 'Tech events, conferences, and meetups', 'technology'),
('Music', 'Concerts, festivals, and music events', 'music'),
('Business', 'Networking, conferences, and business events', 'business'),
('Education', 'Workshops, courses, and educational events', 'education'),
('Entertainment', 'Shows, parties, and entertainment events', 'entertainment'),
('Sports', 'Sports events, tournaments, and fitness', 'sports'),
('Food & Drink', 'Food festivals, tastings, and culinary events', 'food-drink'),
('Health & Wellness', 'Yoga, meditation, and wellness events', 'health-wellness'),
('Arts & Design', 'Art exhibitions, design workshops, and creative events', 'arts-design'),
('Travel', 'Travel meetups, destination events, and adventures', 'travel')
ON CONFLICT (name) DO NOTHING;

-- Create function to update follower counts
CREATE OR REPLACE FUNCTION update_follower_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE artists SET followers_count = followers_count + 1
    WHERE user_id = NEW.following_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE artists SET followers_count = followers_count - 1
    WHERE user_id = OLD.following_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for follower count updates
DROP TRIGGER IF EXISTS trigger_update_follower_count ON "public"."followers";
CREATE TRIGGER trigger_update_follower_count
  AFTER INSERT OR DELETE ON "public"."followers"
  FOR EACH ROW EXECUTE FUNCTION update_follower_count();

-- Create function to update community member counts
CREATE OR REPLACE FUNCTION update_community_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE communities SET member_count = member_count + 1
    WHERE id = NEW.community_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE communities SET member_count = member_count - 1
    WHERE id = OLD.community_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for community member count updates
DROP TRIGGER IF EXISTS trigger_update_community_member_count ON "public"."community_memberships";
CREATE TRIGGER trigger_update_community_member_count
  AFTER INSERT OR DELETE ON "public"."community_memberships"
  FOR EACH ROW EXECUTE FUNCTION update_community_member_count();

-- Create function to update post stats
CREATE OR REPLACE FUNCTION update_post_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF TG_TABLE_NAME = 'post_likes' THEN
      UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_TABLE_NAME = 'post_comments' THEN
      UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF TG_TABLE_NAME = 'post_likes' THEN
      UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    ELSIF TG_TABLE_NAME = 'post_comments' THEN
      UPDATE posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for post stats updates
DROP TRIGGER IF EXISTS trigger_update_post_likes_count ON "public"."post_likes";
CREATE TRIGGER trigger_update_post_likes_count
  AFTER INSERT OR DELETE ON "public"."post_likes"
  FOR EACH ROW EXECUTE FUNCTION update_post_stats();

DROP TRIGGER IF EXISTS trigger_update_post_comments_count ON "public"."post_comments";
CREATE TRIGGER trigger_update_post_comments_count
  AFTER INSERT OR DELETE ON "public"."post_comments"
  FOR EACH ROW EXECUTE FUNCTION update_post_stats();

-- Create function to update event attendee counts
CREATE OR REPLACE FUNCTION update_event_attendee_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'attending' THEN
      UPDATE events SET attendees_count = attendees_count + 1 WHERE id = NEW.event_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'attending' AND NEW.status = 'attending' THEN
      UPDATE events SET attendees_count = attendees_count + 1 WHERE id = NEW.event_id;
    ELSIF OLD.status = 'attending' AND NEW.status != 'attending' THEN
      UPDATE events SET attendees_count = attendees_count - 1 WHERE id = NEW.event_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.status = 'attending' THEN
      UPDATE events SET attendees_count = attendees_count - 1 WHERE id = OLD.event_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for event attendee count updates
DROP TRIGGER IF EXISTS trigger_update_event_attendee_count ON "public"."event_attendees";
CREATE TRIGGER trigger_update_event_attendee_count
  AFTER INSERT OR UPDATE OR DELETE ON "public"."event_attendees"
  FOR EACH ROW EXECUTE FUNCTION update_event_attendee_count();