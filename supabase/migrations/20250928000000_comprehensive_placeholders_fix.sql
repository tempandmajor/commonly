-- Migration to replace all placeholders with real database functionality
-- Date: 2025-09-28
-- Purpose: Add missing tables and functionality for social features, help system, analytics, and more

-- Enable RLS
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- ============================================================================
-- SOCIAL FEATURES TABLES
-- ============================================================================

-- Social posts table
CREATE TABLE IF NOT EXISTS social_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    image_url TEXT,
    video_url TEXT,
    tags TEXT[] DEFAULT '{}',
    mentions TEXT[] DEFAULT '{}',
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Social post likes
CREATE TABLE IF NOT EXISTS social_post_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

-- Social post comments
CREATE TABLE IF NOT EXISTS social_post_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_comment_id UUID REFERENCES social_post_comments(id) ON DELETE CASCADE,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User follows
CREATE TABLE IF NOT EXISTS user_follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- Social notifications
CREATE TABLE IF NOT EXISTS social_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'mention', 'share')),
    message TEXT NOT NULL,
    post_id UUID REFERENCES social_posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES social_post_comments(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trending tags
CREATE TABLE IF NOT EXISTS trending_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tag TEXT NOT NULL UNIQUE,
    post_count INTEGER DEFAULT 0,
    engagement_score DECIMAL DEFAULT 0,
    trending_rank INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User social stats
CREATE TABLE IF NOT EXISTS user_social_stats (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    posts_count INTEGER DEFAULT 0,
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    likes_received_count INTEGER DEFAULT 0,
    likes_given_count INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- HELP & SUPPORT SYSTEM
-- ============================================================================

-- Help articles table
CREATE TABLE IF NOT EXISTS help_articles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    difficulty_level TEXT DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    estimated_time TEXT,
    view_count INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    featured BOOLEAN DEFAULT FALSE,
    published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support tickets
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    category TEXT NOT NULL,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    resolution TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contact submissions
CREATE TABLE IF NOT EXISTS contact_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    category TEXT DEFAULT 'general_inquiry',
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'responded', 'resolved')),
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    response_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FAQ categories
CREATE TABLE IF NOT EXISTS faq_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- MESSAGING SYSTEM
-- ============================================================================

-- Conversations table (already exists, but let's ensure it has the right structure)
CREATE TABLE IF NOT EXISTS conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT,
    members UUID[] NOT NULL,
    is_group BOOLEAN DEFAULT FALSE,
    last_message JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table (already exists, but let's ensure it has the right structure)
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'audio', 'video')),
    metadata JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ANALYTICS AND STATISTICS
-- ============================================================================

-- Platform analytics
CREATE TABLE IF NOT EXISTS platform_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    metric_name TEXT NOT NULL,
    metric_value DECIMAL NOT NULL,
    metric_type TEXT DEFAULT 'count' CHECK (metric_type IN ('count', 'percentage', 'amount', 'duration')),
    category TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, metric_name, category)
);

-- User activity logs
CREATE TABLE IF NOT EXISTS user_activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CONTENT MANAGEMENT
-- ============================================================================

-- Page content
CREATE TABLE IF NOT EXISTS page_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    page_key TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    content JSONB NOT NULL,
    meta_title TEXT,
    meta_description TEXT,
    published BOOLEAN DEFAULT FALSE,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Site settings
CREATE TABLE IF NOT EXISTS site_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    category TEXT DEFAULT 'general',
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Social posts indexes
CREATE INDEX IF NOT EXISTS idx_social_posts_creator_id ON social_posts(creator_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_created_at ON social_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_posts_tags ON social_posts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_social_posts_published ON social_posts(is_published, created_at DESC);

-- Social interactions indexes
CREATE INDEX IF NOT EXISTS idx_social_post_likes_post_id ON social_post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_social_post_likes_user_id ON social_post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_social_post_comments_post_id ON social_post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_social_notifications_user_id ON social_notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_notifications_unread ON social_notifications(user_id, is_read, created_at DESC);

-- Help system indexes
CREATE INDEX IF NOT EXISTS idx_help_articles_category ON help_articles(category, published);
CREATE INDEX IF NOT EXISTS idx_help_articles_published ON help_articles(published, featured, view_count DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status, priority, created_at);

-- Messaging indexes
CREATE INDEX IF NOT EXISTS idx_conversations_members ON conversations USING GIN(members);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id, created_at DESC);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_platform_analytics_date ON platform_analytics(date, metric_name);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user ON user_activity_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_action ON user_activity_logs(action, created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE trending_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_social_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Social posts policies
CREATE POLICY "Users can view published posts" ON social_posts
    FOR SELECT USING (is_published = true);

CREATE POLICY "Users can create their own posts" ON social_posts
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own posts" ON social_posts
    FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own posts" ON social_posts
    FOR DELETE USING (auth.uid() = creator_id);

-- Social interactions policies
CREATE POLICY "Users can manage their own likes" ON social_post_likes
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view all comments" ON social_post_comments
    FOR SELECT USING (true);

CREATE POLICY "Users can create comments" ON social_post_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON social_post_comments
    FOR UPDATE USING (auth.uid() = user_id);

-- User follows policies
CREATE POLICY "Users can view follows" ON user_follows
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their follows" ON user_follows
    FOR ALL USING (auth.uid() = follower_id);

-- Notifications policies
CREATE POLICY "Users can view their notifications" ON social_notifications
    FOR ALL USING (auth.uid() = user_id);

-- Help articles policies
CREATE POLICY "Anyone can view published help articles" ON help_articles
    FOR SELECT USING (published = true);

-- Support tickets policies
CREATE POLICY "Users can view their own tickets" ON support_tickets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create tickets" ON support_tickets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can view conversations they're part of" ON conversations
    FOR SELECT USING (auth.uid() = ANY(members));

CREATE POLICY "Users can view messages in their conversations" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversations
            WHERE id = conversation_id
            AND auth.uid() = ANY(members)
        )
    );

CREATE POLICY "Users can send messages to their conversations" ON messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM conversations
            WHERE id = conversation_id
            AND auth.uid() = ANY(members)
        )
    );

-- User activity logs policy
CREATE POLICY "Users can view their own activity" ON user_activity_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Public content policies
CREATE POLICY "Anyone can view published page content" ON page_content
    FOR SELECT USING (published = true);

CREATE POLICY "Anyone can view public site settings" ON site_settings
    FOR SELECT USING (is_public = true);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update social post stats
CREATE OR REPLACE FUNCTION update_social_post_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'social_post_likes' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE social_posts
            SET likes_count = likes_count + 1
            WHERE id = NEW.post_id;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE social_posts
            SET likes_count = GREATEST(likes_count - 1, 0)
            WHERE id = OLD.post_id;
        END IF;
    ELSIF TG_TABLE_NAME = 'social_post_comments' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE social_posts
            SET comments_count = comments_count + 1
            WHERE id = NEW.post_id;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE social_posts
            SET comments_count = GREATEST(comments_count - 1, 0)
            WHERE id = OLD.post_id;
        END IF;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers for social post stats
CREATE TRIGGER trigger_update_post_likes_stats
    AFTER INSERT OR DELETE ON social_post_likes
    FOR EACH ROW EXECUTE FUNCTION update_social_post_stats();

CREATE TRIGGER trigger_update_post_comments_stats
    AFTER INSERT OR DELETE ON social_post_comments
    FOR EACH ROW EXECUTE FUNCTION update_social_post_stats();

-- Function to update user social stats
CREATE OR REPLACE FUNCTION update_user_social_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update follower/following counts
    IF TG_TABLE_NAME = 'user_follows' THEN
        IF TG_OP = 'INSERT' THEN
            -- Update follower count for the followed user
            INSERT INTO user_social_stats (user_id, followers_count)
            VALUES (NEW.following_id, 1)
            ON CONFLICT (user_id)
            DO UPDATE SET followers_count = user_social_stats.followers_count + 1;

            -- Update following count for the follower
            INSERT INTO user_social_stats (user_id, following_count)
            VALUES (NEW.follower_id, 1)
            ON CONFLICT (user_id)
            DO UPDATE SET following_count = user_social_stats.following_count + 1;

        ELSIF TG_OP = 'DELETE' THEN
            -- Update follower count for the unfollowed user
            UPDATE user_social_stats
            SET followers_count = GREATEST(followers_count - 1, 0)
            WHERE user_id = OLD.following_id;

            -- Update following count for the unfollower
            UPDATE user_social_stats
            SET following_count = GREATEST(following_count - 1, 0)
            WHERE user_id = OLD.follower_id;
        END IF;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for user social stats
CREATE TRIGGER trigger_update_user_social_stats
    AFTER INSERT OR DELETE ON user_follows
    FOR EACH ROW EXECUTE FUNCTION update_user_social_stats();

-- Function to update trending tags
CREATE OR REPLACE FUNCTION update_trending_tags()
RETURNS TRIGGER AS $$
DECLARE
    tag TEXT;
BEGIN
    IF TG_OP = 'INSERT' AND NEW.tags IS NOT NULL THEN
        FOREACH tag IN ARRAY NEW.tags
        LOOP
            INSERT INTO trending_tags (tag, post_count)
            VALUES (tag, 1)
            ON CONFLICT (tag)
            DO UPDATE SET
                post_count = trending_tags.post_count + 1,
                updated_at = NOW();
        END LOOP;
    ELSIF TG_OP = 'DELETE' AND OLD.tags IS NOT NULL THEN
        FOREACH tag IN ARRAY OLD.tags
        LOOP
            UPDATE trending_tags
            SET post_count = GREATEST(post_count - 1, 0),
                updated_at = NOW()
            WHERE tag = tag;
        END LOOP;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for trending tags
CREATE TRIGGER trigger_update_trending_tags
    AFTER INSERT OR DELETE ON social_posts
    FOR EACH ROW EXECUTE FUNCTION update_trending_tags();

-- ============================================================================
-- INSERT DEFAULT DATA
-- ============================================================================

-- Insert default FAQ categories
INSERT INTO faq_categories (name, description, icon, sort_order) VALUES
('events', 'Event creation and management', 'Calendar', 1),
('payments', 'Payment processing and billing', 'CreditCard', 2),
('account', 'Account management and settings', 'Settings', 3),
('products', 'Product listings and sales', 'ShoppingBag', 4),
('community', 'Community features and guidelines', 'Users', 5),
('security', 'Security and privacy settings', 'Shield', 6)
ON CONFLICT (name) DO NOTHING;

-- Insert default help articles
INSERT INTO help_articles (title, content, category, difficulty_level, published, featured) VALUES
('How to create an event', 'To create an event, click the "Create Event" button in the header or go to your dashboard. Fill in the event details including title, description, date, location, and ticket information. You can also set up crowdfunding goals if needed.', 'events', 'beginner', true, true),
('Understanding payment processing', 'We use Stripe for secure payment processing. For regular events, payments are charged immediately when tickets are purchased. For crowdfunded events, payments are authorized but only charged if the funding goal is met.', 'payments', 'intermediate', true, false),
('Setting up your profile', 'Go to your account settings to update your profile information, including your name, bio, profile picture, and contact details. You can also manage your privacy settings and notification preferences.', 'account', 'beginner', true, false)
ON CONFLICT DO NOTHING;

-- Insert default site settings
INSERT INTO site_settings (key, value, category, is_public) VALUES
('contact_email', '"hello@commonlyapp.com"', 'contact', true),
('contact_phone', '"+1 (872) 261-2607"', 'contact', true),
('support_hours', '"Monday to Friday, 9am to 6pm EST"', 'contact', true),
('platform_fees_regular', '20', 'pricing', true),
('platform_fees_creator', '15', 'pricing', true),
('response_time_general', '"24 hours"', 'support', true),
('response_time_technical', '"12 hours"', 'support', true),
('response_time_payment', '"4 hours"', 'support', true),
('response_time_urgent', '"1 hour"', 'support', true)
ON CONFLICT (key) DO NOTHING;

-- Create some sample trending tags
INSERT INTO trending_tags (tag, post_count, engagement_score, trending_rank) VALUES
('Events', 125, 85.5, 1),
('Community', 89, 78.2, 2),
('Networking', 67, 65.8, 3),
('Innovation', 45, 52.3, 4),
('Creative', 38, 48.7, 5)
ON CONFLICT (tag) DO NOTHING;

COMMIT;