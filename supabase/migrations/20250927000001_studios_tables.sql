-- Create tables for Studios functionality
-- This enables real studio project management and content creation

-- Studio projects table
CREATE TABLE IF NOT EXISTS "public"."studio_projects" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "title" text NOT NULL,
    "description" text NOT NULL,
    "creator_id" uuid REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "project_type" text NOT NULL CHECK (project_type IN ('scripted_series', 'feature_film', 'documentary', 'reality_competition', 'digital_original', 'live_special')),
    "status" text DEFAULT 'in_development' CHECK (status IN ('in_development', 'in_production', 'post_production', 'completed', 'cancelled')),
    "genre" text[],
    "target_audience" text,
    "budget_range" text,
    "expected_duration" integer, -- in minutes
    "production_start" timestamp with time zone,
    "production_end" timestamp with time zone,
    "release_date" timestamp with time zone,
    "poster_url" text,
    "trailer_url" text,
    "attachments" jsonb DEFAULT '[]'::jsonb, -- Cast, crew, etc.
    "funding_goal" integer, -- in cents
    "current_funding" integer DEFAULT 0, -- in cents
    "backers_count" integer DEFAULT 0,
    "featured" boolean DEFAULT false,
    "public_visibility" boolean DEFAULT true,
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamp with time zone DEFAULT NOW(),
    "updated_at" timestamp with time zone DEFAULT NOW()
);

-- Studio team members table
CREATE TABLE IF NOT EXISTS "public"."studio_team_members" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "project_id" uuid REFERENCES "public"."studio_projects"("id") ON DELETE CASCADE,
    "user_id" uuid REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "role" text NOT NULL, -- Director, Producer, Writer, Actor, etc.
    "department" text, -- Production, Post-Production, Marketing, etc.
    "is_lead" boolean DEFAULT false,
    "contact_info" jsonb DEFAULT '{}'::jsonb,
    "bio" text,
    "credits" text[],
    "joined_at" timestamp with time zone DEFAULT NOW(),
    "status" text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
    UNIQUE(project_id, user_id, role)
);

-- Studio project funding table
CREATE TABLE IF NOT EXISTS "public"."studio_project_funding" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "project_id" uuid REFERENCES "public"."studio_projects"("id") ON DELETE CASCADE,
    "backer_id" uuid REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "amount" integer NOT NULL, -- in cents
    "reward_tier" text,
    "backer_message" text,
    "payment_id" uuid REFERENCES "public"."payments"("id") ON DELETE SET NULL,
    "status" text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'refunded')),
    "created_at" timestamp with time zone DEFAULT NOW(),
    "updated_at" timestamp with time zone DEFAULT NOW()
);

-- Studio project updates table (for production diary/blog)
CREATE TABLE IF NOT EXISTS "public"."studio_project_updates" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "project_id" uuid REFERENCES "public"."studio_projects"("id") ON DELETE CASCADE,
    "author_id" uuid REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "title" text NOT NULL,
    "content" text NOT NULL,
    "update_type" text DEFAULT 'general' CHECK (update_type IN ('general', 'production', 'casting', 'milestone', 'behind_scenes')),
    "media_urls" text[] DEFAULT '{}',
    "is_public" boolean DEFAULT true,
    "scheduled_publish" timestamp with time zone,
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT NOW(),
    "updated_at" timestamp with time zone DEFAULT NOW()
);

-- Studio content library table (for finished content)
CREATE TABLE IF NOT EXISTS "public"."studio_content" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "project_id" uuid REFERENCES "public"."studio_projects"("id") ON DELETE CASCADE,
    "title" text NOT NULL,
    "description" text,
    "content_type" text NOT NULL CHECK (content_type IN ('episode', 'season', 'film', 'trailer', 'behind_scenes', 'extra')),
    "episode_number" integer,
    "season_number" integer,
    "duration" integer, -- in seconds
    "video_url" text,
    "thumbnail_url" text,
    "release_date" timestamp with time zone,
    "is_premium" boolean DEFAULT false,
    "view_count" integer DEFAULT 0,
    "likes_count" integer DEFAULT 0,
    "comments_count" integer DEFAULT 0,
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamp with time zone DEFAULT NOW(),
    "updated_at" timestamp with time zone DEFAULT NOW()
);

-- Studio partnerships table
CREATE TABLE IF NOT EXISTS "public"."studio_partnerships" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "project_id" uuid REFERENCES "public"."studio_projects"("id") ON DELETE CASCADE,
    "partner_name" text NOT NULL,
    "partner_type" text NOT NULL CHECK (partner_type IN ('network', 'streamer', 'distributor', 'financier', 'co_producer', 'sponsor')),
    "contact_email" text,
    "contract_details" jsonb DEFAULT '{}'::jsonb,
    "deal_points" text[],
    "status" text DEFAULT 'negotiating' CHECK (status IN ('interested', 'negotiating', 'agreed', 'signed', 'cancelled')),
    "signed_date" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT NOW(),
    "updated_at" timestamp with time zone DEFAULT NOW()
);

-- Receipt/invoice system for digital purchases
CREATE TABLE IF NOT EXISTS "public"."receipts" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "order_id" uuid REFERENCES "public"."orders"("id") ON DELETE CASCADE,
    "payment_id" uuid REFERENCES "public"."payments"("id") ON DELETE SET NULL,
    "user_id" uuid REFERENCES "public"."users"("id") ON DELETE SET NULL,
    "receipt_number" text UNIQUE NOT NULL,
    "receipt_data" jsonb NOT NULL, -- Full receipt details
    "pdf_url" text, -- Generated PDF receipt URL
    "email_sent" boolean DEFAULT false,
    "download_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT NOW(),
    "updated_at" timestamp with time zone DEFAULT NOW()
);

-- Content creation templates/guides
CREATE TABLE IF NOT EXISTS "public"."creation_guides" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "title" text NOT NULL,
    "content_type" text NOT NULL, -- event, product, community, etc.
    "description" text,
    "content" text NOT NULL, -- Markdown content
    "difficulty_level" text DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    "estimated_time" text, -- "10-15 minutes"
    "category" text,
    "tags" text[] DEFAULT '{}',
    "view_count" integer DEFAULT 0,
    "helpful_count" integer DEFAULT 0,
    "author_id" uuid REFERENCES "public"."users"("id") ON DELETE SET NULL,
    "featured" boolean DEFAULT false,
    "published" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT NOW(),
    "updated_at" timestamp with time zone DEFAULT NOW()
);

-- Image/media management table
CREATE TABLE IF NOT EXISTS "public"."media_assets" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" uuid REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "filename" text NOT NULL,
    "original_filename" text,
    "file_type" text NOT NULL,
    "file_size" integer NOT NULL,
    "width" integer,
    "height" integer,
    "url" text NOT NULL,
    "alt_text" text,
    "usage_context" text, -- product, event, profile, etc.
    "is_public" boolean DEFAULT false,
    "upload_source" text DEFAULT 'user', -- user, admin, system
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamp with time zone DEFAULT NOW(),
    "updated_at" timestamp with time zone DEFAULT NOW()
);

-- Creator earnings/revenue tracking
CREATE TABLE IF NOT EXISTS "public"."creator_earnings" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" uuid REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "earning_type" text NOT NULL CHECK (earning_type IN ('event_ticket', 'product_sale', 'subscription', 'commission', 'royalty', 'bonus')),
    "source_id" uuid NOT NULL, -- ID of the event, product, etc.
    "source_type" text NOT NULL, -- event, product, subscription, etc.
    "gross_amount" integer NOT NULL, -- in cents, before fees
    "platform_fee" integer NOT NULL DEFAULT 0, -- in cents
    "payment_processing_fee" integer NOT NULL DEFAULT 0, -- in cents
    "net_amount" integer NOT NULL, -- in cents, after fees
    "currency" text DEFAULT 'usd',
    "payout_date" timestamp with time zone,
    "payout_status" text DEFAULT 'pending' CHECK (payout_status IN ('pending', 'processing', 'paid', 'failed')),
    "payout_reference" text,
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamp with time zone DEFAULT NOW(),
    "updated_at" timestamp with time zone DEFAULT NOW()
);

-- Support tickets table
CREATE TABLE IF NOT EXISTS "public"."support_tickets" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" uuid REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "subject" text NOT NULL,
    "message" text NOT NULL,
    "category" text NOT NULL DEFAULT 'general',
    "priority" text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    "status" text DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    "assigned_to" uuid REFERENCES "public"."users"("id") ON DELETE SET NULL,
    "resolution" text,
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamp with time zone DEFAULT NOW(),
    "updated_at" timestamp with time zone DEFAULT NOW()
);

-- Enable RLS on all new tables
ALTER TABLE "public"."studio_projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."studio_team_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."studio_project_funding" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."studio_project_updates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."studio_content" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."studio_partnerships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."receipts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."creation_guides" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."media_assets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."creator_earnings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."support_tickets" ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Public read access for published studio projects" ON "public"."studio_projects"
  FOR SELECT USING (public_visibility = true OR creator_id = auth.uid());

CREATE POLICY "Users can create studio projects" ON "public"."studio_projects"
  FOR INSERT WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Users can update own studio projects" ON "public"."studio_projects"
  FOR UPDATE USING (creator_id = auth.uid());

CREATE POLICY "Public read access for published studio content" ON "public"."studio_content"
  FOR SELECT USING (
    project_id IN (SELECT id FROM studio_projects WHERE public_visibility = true) OR
    project_id IN (SELECT id FROM studio_projects WHERE creator_id = auth.uid())
  );

CREATE POLICY "Team members can view project details" ON "public"."studio_team_members"
  FOR SELECT USING (
    user_id = auth.uid() OR
    project_id IN (SELECT id FROM studio_projects WHERE creator_id = auth.uid())
  );

CREATE POLICY "Project creators can manage team" ON "public"."studio_team_members"
  FOR ALL USING (
    project_id IN (SELECT id FROM studio_projects WHERE creator_id = auth.uid())
  );

CREATE POLICY "Users can view own funding" ON "public"."studio_project_funding"
  FOR SELECT USING (
    backer_id = auth.uid() OR
    project_id IN (SELECT id FROM studio_projects WHERE creator_id = auth.uid())
  );

CREATE POLICY "Users can fund projects" ON "public"."studio_project_funding"
  FOR INSERT WITH CHECK (backer_id = auth.uid());

CREATE POLICY "Public read access for published updates" ON "public"."studio_project_updates"
  FOR SELECT USING (
    is_public = true AND published_at <= NOW() OR
    project_id IN (SELECT id FROM studio_projects WHERE creator_id = auth.uid())
  );

CREATE POLICY "Team members can create updates" ON "public"."studio_project_updates"
  FOR INSERT WITH CHECK (
    author_id = auth.uid() AND (
      project_id IN (SELECT id FROM studio_projects WHERE creator_id = auth.uid()) OR
      project_id IN (SELECT project_id FROM studio_team_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can view own receipts" ON "public"."receipts"
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Public read access for published guides" ON "public"."creation_guides"
  FOR SELECT USING (published = true);

CREATE POLICY "Users can view own media" ON "public"."media_assets"
  FOR SELECT USING (user_id = auth.uid() OR is_public = true);

CREATE POLICY "Users can upload media" ON "public"."media_assets"
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own earnings" ON "public"."creator_earnings"
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view own support tickets" ON "public"."support_tickets"
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create support tickets" ON "public"."support_tickets"
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_studio_projects_creator_id" ON "public"."studio_projects"("creator_id");
CREATE INDEX IF NOT EXISTS "idx_studio_projects_status" ON "public"."studio_projects"("status");
CREATE INDEX IF NOT EXISTS "idx_studio_projects_type" ON "public"."studio_projects"("project_type");
CREATE INDEX IF NOT EXISTS "idx_studio_team_members_project_id" ON "public"."studio_team_members"("project_id");
CREATE INDEX IF NOT EXISTS "idx_studio_team_members_user_id" ON "public"."studio_team_members"("user_id");
CREATE INDEX IF NOT EXISTS "idx_studio_project_funding_project_id" ON "public"."studio_project_funding"("project_id");
CREATE INDEX IF NOT EXISTS "idx_studio_project_funding_backer_id" ON "public"."studio_project_funding"("backer_id");
CREATE INDEX IF NOT EXISTS "idx_studio_project_updates_project_id" ON "public"."studio_project_updates"("project_id");
CREATE INDEX IF NOT EXISTS "idx_studio_content_project_id" ON "public"."studio_content"("project_id");
CREATE INDEX IF NOT EXISTS "idx_receipts_order_id" ON "public"."receipts"("order_id");
CREATE INDEX IF NOT EXISTS "idx_receipts_user_id" ON "public"."receipts"("user_id");
CREATE INDEX IF NOT EXISTS "idx_creation_guides_content_type" ON "public"."creation_guides"("content_type");
CREATE INDEX IF NOT EXISTS "idx_media_assets_user_id" ON "public"."media_assets"("user_id");
CREATE INDEX IF NOT EXISTS "idx_creator_earnings_user_id" ON "public"."creator_earnings"("user_id");
CREATE INDEX IF NOT EXISTS "idx_creator_earnings_source" ON "public"."creator_earnings"("source_type", "source_id");
CREATE INDEX IF NOT EXISTS "idx_support_tickets_user_id" ON "public"."support_tickets"("user_id");
CREATE INDEX IF NOT EXISTS "idx_support_tickets_status" ON "public"."support_tickets"("status");

-- Create function to generate receipt numbers
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS text AS $$
DECLARE
    receipt_number text;
    counter integer;
BEGIN
    -- Get current year and month
    SELECT 'R' || to_char(NOW(), 'YYYYMM') || '-' ||
           LPAD((EXTRACT(epoch FROM NOW()) % 100000)::text, 5, '0')
    INTO receipt_number;

    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM receipts WHERE receipt_number = receipt_number) LOOP
        receipt_number := 'R' || to_char(NOW(), 'YYYYMM') || '-' ||
                         LPAD((EXTRACT(epoch FROM NOW()) % 100000 + floor(random() * 1000))::text, 5, '0');
    END LOOP;

    RETURN receipt_number;
END;
$$ LANGUAGE plpgsql;

-- Create function to update funding counts
CREATE OR REPLACE FUNCTION update_studio_project_funding()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'confirmed' THEN
      UPDATE studio_projects
      SET current_funding = current_funding + NEW.amount,
          backers_count = backers_count + 1
      WHERE id = NEW.project_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'confirmed' AND NEW.status = 'confirmed' THEN
      UPDATE studio_projects
      SET current_funding = current_funding + NEW.amount,
          backers_count = backers_count + 1
      WHERE id = NEW.project_id;
    ELSIF OLD.status = 'confirmed' AND NEW.status != 'confirmed' THEN
      UPDATE studio_projects
      SET current_funding = current_funding - OLD.amount,
          backers_count = backers_count - 1
      WHERE id = NEW.project_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.status = 'confirmed' THEN
      UPDATE studio_projects
      SET current_funding = current_funding - OLD.amount,
          backers_count = backers_count - 1
      WHERE id = OLD.project_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for funding updates
DROP TRIGGER IF EXISTS trigger_update_studio_project_funding ON "public"."studio_project_funding";
CREATE TRIGGER trigger_update_studio_project_funding
  AFTER INSERT OR UPDATE OR DELETE ON "public"."studio_project_funding"
  FOR EACH ROW EXECUTE FUNCTION update_studio_project_funding();

-- Create function to update content stats
CREATE OR REPLACE FUNCTION update_studio_content_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Update view counts, likes, etc. when content metadata changes
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Insert default creation guides
INSERT INTO "public"."creation_guides" ("title", "content_type", "description", "content", "difficulty_level", "estimated_time", "category") VALUES
('Getting Started with Events', 'event', 'Learn how to create your first event on Commonly', '# Creating Your First Event\n\n## Planning Your Event\n\n1. **Define your purpose**: What do you want to achieve?\n2. **Know your audience**: Who are you creating this for?\n3. **Set your budget**: How much funding do you need?\n\n## Event Setup\n\n1. **Choose a compelling title**\n2. **Write a detailed description**\n3. **Set your funding goal**\n4. **Add engaging images**\n\n## Launch Strategy\n\n1. **Share with your network**\n2. **Use social media**\n3. **Engage with your community**', 'beginner', '10-15 minutes', 'events'),

('Product Listing Best Practices', 'product', 'Maximize your product sales with these proven strategies', '# Product Listing Optimization\n\n## Photography Tips\n\n1. **Use natural lighting**\n2. **Show multiple angles**\n3. **Include lifestyle shots**\n4. **Maintain consistent style**\n\n## Writing Compelling Descriptions\n\n1. **Lead with benefits**\n2. **Use bullet points**\n3. **Include specifications**\n4. **Address common questions**\n\n## Pricing Strategy\n\n1. **Research competitors**\n2. **Consider your costs**\n3. **Test different price points**', 'intermediate', '15-20 minutes', 'products'),

('Building Community Engagement', 'community', 'Foster active and engaged communities', '# Community Building Strategies\n\n## Content Planning\n\n1. **Create a content calendar**\n2. **Mix content types**\n3. **Encourage user-generated content**\n\n## Engagement Tactics\n\n1. **Ask questions**\n2. **Host regular events**\n3. **Recognize active members**\n4. **Create discussion prompts**\n\n## Growth Techniques\n\n1. **Partner with other communities**\n2. **Cross-promote content**\n3. **Invite expert guests**', 'intermediate', '12-18 minutes', 'community'),

('Studio Project Development', 'studio', 'Plan and execute professional content projects', '# Studio Project Development\n\n## Pre-Production\n\n1. **Develop your concept**\n2. **Write a compelling pitch**\n3. **Create a project timeline**\n4. **Assemble your team**\n\n## Production Planning\n\n1. **Location scouting**\n2. **Equipment requirements**\n3. **Casting decisions**\n4. **Budget allocation**\n\n## Post-Production\n\n1. **Editing workflow**\n2. **Sound design**\n3. **Color grading**\n4. **Final delivery**', 'advanced', '25-30 minutes', 'studio')

ON CONFLICT (title) DO NOTHING;