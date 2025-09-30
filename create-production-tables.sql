-- Essential Production Tables for CommonlyApp Launch
-- Run this in your Supabase SQL editor to create required tables

-- ================================================
-- EVENTS AND EVENT MANAGEMENT
-- ================================================

-- Events table (main events)
CREATE TABLE IF NOT EXISTS public.events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    location TEXT,
    price DECIMAL(10,2) DEFAULT 0,
    date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    image_url TEXT,
    creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    attendee_count INTEGER DEFAULT 0,
    max_attendees INTEGER,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled', 'ended')),
    tags TEXT[],
    virtual_link TEXT,
    featured BOOLEAN DEFAULT FALSE,
    requirements TEXT,
    agenda TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event registrations
CREATE TABLE IF NOT EXISTS public.event_registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    registration_date TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'pending', 'cancelled')),
    ticket_type TEXT DEFAULT 'general',
    payment_status TEXT DEFAULT 'completed',
    UNIQUE(event_id, user_id)
);

-- User favorites
CREATE TABLE IF NOT EXISTS public.user_favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- ================================================
-- WALLET AND PAYMENTS
-- ================================================

-- Wallet balances
CREATE TABLE IF NOT EXISTS public.wallet_balances (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    balance DECIMAL(10,2) DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wallet transactions
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'transfer', 'payment', 'refund')),
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    description TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    reference_id TEXT,
    recipient_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- MESSAGING AND NOTIFICATIONS
-- ================================================

-- Conversations
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    participants UUID[] NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'file')),
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'general',
    status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read')),
    action_url TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- PROFILES (if not exists)
-- ================================================

-- Ensure profiles table exists
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    location TEXT,
    website TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- INDEXES FOR PERFORMANCE
-- ================================================

-- Events indexes
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category);
CREATE INDEX IF NOT EXISTS idx_events_creator ON public.events(creator_id);
CREATE INDEX IF NOT EXISTS idx_events_featured ON public.events(featured);

-- Event registrations indexes
CREATE INDEX IF NOT EXISTS idx_registrations_event ON public.event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_user ON public.event_registrations(user_id);

-- Wallet transactions indexes
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created ON public.wallet_transactions(created_at);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.messages(created_at);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.notifications(status);

-- ================================================
-- RLS (ROW LEVEL SECURITY) POLICIES
-- ================================================

-- Enable RLS on all tables
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Events policies
CREATE POLICY "Events are viewable by everyone" ON public.events FOR SELECT USING (true);
CREATE POLICY "Events can be created by authenticated users" ON public.events FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Events can be updated by creators" ON public.events FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Events can be deleted by creators" ON public.events FOR DELETE USING (auth.uid() = creator_id);

-- Event registrations policies
CREATE POLICY "Users can view their own registrations" ON public.event_registrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can register for events" ON public.event_registrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their registrations" ON public.event_registrations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can cancel their registrations" ON public.event_registrations FOR DELETE USING (auth.uid() = user_id);

-- User favorites policies  
CREATE POLICY "Users can view their favorites" ON public.user_favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add favorites" ON public.user_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove favorites" ON public.user_favorites FOR DELETE USING (auth.uid() = user_id);

-- Wallet policies
CREATE POLICY "Users can view their wallet balance" ON public.wallet_balances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their wallet balance" ON public.wallet_balances FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can create wallet balance" ON public.wallet_balances FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their transactions" ON public.wallet_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create transactions" ON public.wallet_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Messaging policies
CREATE POLICY "Users can view conversations they participate in" ON public.conversations FOR SELECT USING (auth.uid() = ANY(participants));
CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT WITH CHECK (auth.uid() = ANY(participants));

CREATE POLICY "Users can view messages in their conversations" ON public.messages FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.conversations 
        WHERE id = conversation_id AND auth.uid() = ANY(participants)
    )
);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Notifications policies
CREATE POLICY "Users can view their notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ================================================
-- UTILITY FUNCTIONS
-- ================================================

-- Function to increment attendee count
CREATE OR REPLACE FUNCTION increment_attendee_count(event_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.events 
    SET attendee_count = COALESCE(attendee_count, 0) + 1,
        updated_at = NOW()
    WHERE id = event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement attendee count
CREATE OR REPLACE FUNCTION decrement_attendee_count(event_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.events 
    SET attendee_count = GREATEST(COALESCE(attendee_count, 0) - 1, 0),
        updated_at = NOW()
    WHERE id = event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update wallet balance
CREATE OR REPLACE FUNCTION update_wallet_balance(p_user_id UUID, p_amount DECIMAL)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.wallet_balances (user_id, balance, updated_at)
    VALUES (p_user_id, p_amount, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
        balance = wallet_balances.balance + p_amount,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- TRIGGERS
-- ================================================

-- Trigger to auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Profile creation trigger (creates profile when user signs up)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, created_at)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NOW());
    
    -- Create initial wallet balance
    INSERT INTO public.wallet_balances (user_id, balance, updated_at)
    VALUES (NEW.id, 0, NOW());
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply user creation trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================================================
-- SAMPLE DATA (OPTIONAL - REMOVE IN PRODUCTION)
-- ================================================

-- Insert sample events (remove this section for production)
-- INSERT INTO public.events (title, description, category, location, price, date, creator_id, status, featured)
-- VALUES 
--     ('Tech Conference 2025', 'Annual technology conference', 'Technology', 'San Francisco, CA', 299.00, '2025-03-15 09:00:00+00', auth.uid(), 'published', true),
--     ('Art Gallery Opening', 'Modern art exhibition', 'Art', 'New York, NY', 0.00, '2025-02-20 18:00:00+00', auth.uid(), 'published', false);

COMMIT; 