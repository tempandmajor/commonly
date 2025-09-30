-- Create caterer_reviews table
CREATE TABLE IF NOT EXISTS public.caterer_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  caterer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for better query performance
CREATE INDEX idx_caterer_reviews_caterer_id ON public.caterer_reviews(caterer_id);
CREATE INDEX idx_caterer_reviews_user_id ON public.caterer_reviews(user_id);
CREATE INDEX idx_caterer_reviews_created_at ON public.caterer_reviews(created_at DESC);

-- Enable RLS
ALTER TABLE public.caterer_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all caterer reviews" ON public.caterer_reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own caterer reviews" ON public.caterer_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own caterer reviews" ON public.caterer_reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own caterer reviews" ON public.caterer_reviews
  FOR DELETE USING (auth.uid() = user_id);

-- Create helpful votes table for tracking who marked reviews as helpful
CREATE TABLE IF NOT EXISTS public.caterer_review_helpful_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.caterer_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(review_id, user_id)
);

-- Enable RLS for helpful votes
ALTER TABLE public.caterer_review_helpful_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for helpful votes
CREATE POLICY "Users can view all helpful votes" ON public.caterer_review_helpful_votes
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own helpful votes" ON public.caterer_review_helpful_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own helpful votes" ON public.caterer_review_helpful_votes
  FOR DELETE USING (auth.uid() = user_id); 