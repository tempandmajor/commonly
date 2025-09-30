-- Create Projects Table Migration
-- This migration creates the missing projects table that's referenced in the application but doesn't exist in the database

-- Create projects table with proper foreign key relationships
CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "title" text NOT NULL,
    "description" text,
    "category" text,
    "status" text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed', 'draft')),
    "creator_id" uuid REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "start_date" timestamp with time zone,
    "end_date" timestamp with time zone,
    "location" text,
    "requirements" text,
    "skills_needed" text[] DEFAULT '{}'::text[],
    "team_size" integer,
    "target_amount" numeric(10,2) DEFAULT 0,
    "current_amount" numeric(10,2) DEFAULT 0,
    "image_url" text,
    "tags" text[] DEFAULT '{}'::text[],
    "created_at" timestamp with time zone DEFAULT NOW(),
    "updated_at" timestamp with time zone DEFAULT NOW()
);

-- Enable Row Level Security for projects
ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for projects
CREATE POLICY "Anyone can view active projects" ON "public"."projects"
    FOR SELECT USING (status IN ('active', 'completed'));

CREATE POLICY "Project creators can manage their projects" ON "public"."projects"
    FOR ALL USING (creator_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_projects_creator_id" ON "public"."projects"("creator_id");
CREATE INDEX IF NOT EXISTS "idx_projects_status" ON "public"."projects"("status");
CREATE INDEX IF NOT EXISTS "idx_projects_category" ON "public"."projects"("category");
CREATE INDEX IF NOT EXISTS "idx_projects_created_at" ON "public"."projects"("created_at");

-- Add sample projects data to test the functionality
INSERT INTO "public"."projects" (
    "title", 
    "description", 
    "category", 
    "status", 
    "creator_id", 
    "location", 
    "team_size", 
    "target_amount", 
    "current_amount",
    "tags"
) VALUES 
(
    'Community Garden Initiative',
    'Creating a sustainable community garden to provide fresh produce for local families and promote environmental awareness.',
    'Environment',
    'active',
    (SELECT id FROM "public"."users" LIMIT 1), -- Use first available user as creator
    'Downtown Community Center',
    8,
    5000.00,
    1250.00,
    ARRAY['sustainability', 'community', 'gardening', 'environment']
),
(
    'Local Tech Meetup Series',
    'Monthly meetups for tech enthusiasts to network, share knowledge, and collaborate on innovative projects.',
    'Technology',
    'active',
    (SELECT id FROM "public"."users" LIMIT 1),
    'Tech Hub Co-working Space',
    15,
    2500.00,
    800.00,
    ARRAY['technology', 'networking', 'meetup', 'collaboration']
),
(
    'Youth Mentorship Program',
    'Connecting experienced professionals with young people to provide career guidance and skill development opportunities.',
    'Education',
    'active',
    (SELECT id FROM "public"."users" LIMIT 1),
    'Community Learning Center',
    12,
    7500.00,
    2100.00,
    ARRAY['mentorship', 'youth', 'education', 'career']
),
(
    'Art Installation Project',
    'Creating a public art installation that celebrates local culture and brings the community together through creative expression.',
    'Arts',
    'active',
    (SELECT id FROM "public"."users" LIMIT 1),
    'Central Park Plaza',
    6,
    10000.00,
    3500.00,
    ARRAY['art', 'community', 'culture', 'public-space']
),
(
    'Senior Digital Literacy Program',
    'Teaching essential digital skills to senior citizens to help them stay connected with family and access online services.',
    'Education',
    'completed',
    (SELECT id FROM "public"."users" LIMIT 1),
    'Senior Community Center',
    10,
    3000.00,
    3000.00,
    ARRAY['education', 'seniors', 'technology', 'literacy']
);

-- Only insert sample data if there are users in the database
-- If no users exist, create a placeholder user for testing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "public"."users" LIMIT 1) THEN
        INSERT INTO "public"."users" (id, email, display_name) 
        VALUES (gen_random_uuid(), 'placeholder@example.com', 'Project Creator')
        ON CONFLICT (email) DO NOTHING;
    END IF;
END $$; 