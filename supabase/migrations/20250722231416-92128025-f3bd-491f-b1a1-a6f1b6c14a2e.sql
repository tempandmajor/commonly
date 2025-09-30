
-- Create products table for store functionality
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT,
  images TEXT[],
  status TEXT DEFAULT 'active',
  inventory_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policies for products
CREATE POLICY "Anyone can view active products" ON products
  FOR SELECT USING (status = 'active');

CREATE POLICY "Sellers can manage their products" ON products
  FOR ALL USING (seller_id = auth.uid());

-- Create stores table
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on stores
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Create policies for stores
CREATE POLICY "Anyone can view active stores" ON stores
  FOR SELECT USING (status = 'active');

CREATE POLICY "Owners can manage their stores" ON stores
  FOR ALL USING (owner_id = auth.uid());

-- Create caterer_menus table
CREATE TABLE IF NOT EXISTS caterer_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caterer_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  category TEXT,
  dietary_restrictions TEXT[],
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on caterer_menus
ALTER TABLE caterer_menus ENABLE ROW LEVEL SECURITY;

-- Create policies for caterer_menus
CREATE POLICY "Anyone can view available menus" ON caterer_menus
  FOR SELECT USING (available = true);

-- Create caterer_reviews table
CREATE TABLE IF NOT EXISTS caterer_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caterer_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on caterer_reviews
ALTER TABLE caterer_reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for caterer_reviews
CREATE POLICY "Anyone can view reviews" ON caterer_reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own reviews" ON caterer_reviews
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own reviews" ON caterer_reviews
  FOR UPDATE USING (user_id = auth.uid());

-- Create content table for content management
CREATE TABLE IF NOT EXISTS content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on content
ALTER TABLE content ENABLE ROW LEVEL SECURITY;

-- Create policies for content
CREATE POLICY "Anyone can view published content" ON content
  FOR SELECT USING (status = 'published');

CREATE POLICY "Authors can manage their content" ON content
  FOR ALL USING (author_id = auth.uid());

-- Create analytics_events table for tracking
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on analytics_events
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Create policy for analytics_events
CREATE POLICY "Users can view their own analytics events" ON analytics_events
  FOR SELECT USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_stores_owner_id ON stores(owner_id);
CREATE INDEX IF NOT EXISTS idx_caterer_menus_caterer_id ON caterer_menus(caterer_id);
CREATE INDEX IF NOT EXISTS idx_caterer_reviews_caterer_id ON caterer_reviews(caterer_id);
CREATE INDEX IF NOT EXISTS idx_content_author_id ON content(author_id);
CREATE INDEX IF NOT EXISTS idx_content_type ON content(content_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
