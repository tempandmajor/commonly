-- Promotional Campaigns Migration
-- This creates the infrastructure for automated promotional campaigns

-- Create promotional campaigns table
CREATE TABLE IF NOT EXISTS public.promotional_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    campaign_type VARCHAR(50) NOT NULL DEFAULT 'signup', -- signup, milestone, referral, custom
    status VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft, active, paused, completed, expired
    
    -- Campaign rules
    trigger_event VARCHAR(50) NOT NULL, -- user_signup, first_event, profile_complete, etc.
    target_audience JSONB DEFAULT '{}', -- Rules for who qualifies
    max_recipients INTEGER, -- Maximum number of users (null = unlimited)
    current_recipients INTEGER DEFAULT 0,
    
    -- Credit details
    credit_amount DECIMAL(10,2) NOT NULL,
    credit_currency VARCHAR(3) DEFAULT 'USD',
    credit_description TEXT,
    credit_message TEXT, -- Message shown to user when they receive credit
    
    -- Usage restrictions
    usage_restrictions JSONB DEFAULT '{}', -- What credits can/cannot be used for
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Campaign lifecycle
    starts_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    ends_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create campaign analytics table
CREATE TABLE IF NOT EXISTS public.campaign_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES public.promotional_campaigns(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Event tracking
    event_type VARCHAR(50) NOT NULL, -- credit_issued, credit_used, credit_expired
    credit_amount DECIMAL(10,2),
    used_for VARCHAR(100), -- What the credit was used for
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Ensure unique credit issuance per user per campaign
    UNIQUE(campaign_id, user_id, event_type) DEFERRABLE INITIALLY DEFERRED
);

-- Create campaign eligibility tracking
CREATE TABLE IF NOT EXISTS public.campaign_eligibility (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES public.promotional_campaigns(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Eligibility status
    is_eligible BOOLEAN NOT NULL DEFAULT true,
    eligibility_checked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    disqualification_reason TEXT,
    
    -- Credit status
    credit_issued BOOLEAN DEFAULT false,
    credit_issued_at TIMESTAMP WITH TIME ZONE,
    credit_amount DECIMAL(10,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Ensure unique eligibility per user per campaign
    UNIQUE(campaign_id, user_id)
);

-- Enable RLS
ALTER TABLE public.promotional_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_eligibility ENABLE ROW LEVEL SECURITY;

-- RLS Policies for promotional_campaigns (Admin only for creation/modification)
CREATE POLICY "Admin can manage campaigns" ON public.promotional_campaigns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Users can view active campaigns
CREATE POLICY "Users can view active campaigns" ON public.promotional_campaigns
    FOR SELECT USING (status = 'active');

-- RLS Policies for campaign_analytics (Admin can view all, users can view their own)
CREATE POLICY "Admin can view all analytics" ON public.campaign_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "Users can view their own analytics" ON public.campaign_analytics
    FOR SELECT USING (user_id = auth.uid());

-- RLS Policies for campaign_eligibility (Admin can manage, users can view their own)
CREATE POLICY "Admin can manage eligibility" ON public.campaign_eligibility
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "Users can view their eligibility" ON public.campaign_eligibility
    FOR SELECT USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_promotional_campaigns_status ON public.promotional_campaigns(status);
CREATE INDEX idx_promotional_campaigns_type ON public.promotional_campaigns(campaign_type, trigger_event);
CREATE INDEX idx_campaign_analytics_campaign ON public.campaign_analytics(campaign_id);
CREATE INDEX idx_campaign_analytics_user ON public.campaign_analytics(user_id);
CREATE INDEX idx_campaign_eligibility_campaign ON public.campaign_eligibility(campaign_id);
CREATE INDEX idx_campaign_eligibility_user ON public.campaign_eligibility(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_promotional_campaigns_updated_at 
    BEFORE UPDATE ON public.promotional_campaigns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_eligibility_updated_at 
    BEFORE UPDATE ON public.campaign_eligibility 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert the "First 1000 Users" campaign
INSERT INTO public.promotional_campaigns (
    name,
    description,
    campaign_type,
    status,
    trigger_event,
    target_audience,
    max_recipients,
    credit_amount,
    credit_currency,
    credit_description,
    credit_message,
    usage_restrictions,
    starts_at,
    ends_at
) VALUES (
    'First 1000 Users Welcome Campaign',
    'Welcome campaign providing $1000 promotional credit to the first 1000 users who sign up',
    'signup',
    'active',
    'user_signup',
    '{"user_number": {"max": 1000}}',
    1000,
    1000.00,
    'USD',
    'Welcome bonus for early community members',
    'Thank you for joining the Commonly community! To show our appreciation, here is $1,000 promotional credit to promote your future events. This credit cannot be used toward subscription fees.',
    '{"excluded_categories": ["subscription", "membership_fees", "premium_features"], "allowed_categories": ["event_promotion", "venue_booking", "event_tickets", "marketing"]}',
    now(),
    now() + INTERVAL '1 year'
);

-- Create view for campaign dashboard
CREATE OR REPLACE VIEW public.campaign_dashboard AS
SELECT 
    pc.id,
    pc.name,
    pc.status,
    pc.credit_amount,
    pc.max_recipients,
    pc.current_recipients,
    COALESCE(pc.max_recipients - pc.current_recipients, 0) as remaining_slots,
    pc.starts_at,
    pc.ends_at,
    COUNT(ce.id) as total_eligible_users,
    COUNT(CASE WHEN ce.credit_issued = true THEN 1 END) as credits_issued,
    SUM(CASE WHEN ce.credit_issued = true THEN ce.credit_amount ELSE 0 END) as total_credits_issued,
    pc.created_at
FROM public.promotional_campaigns pc
LEFT JOIN public.campaign_eligibility ce ON pc.id = ce.campaign_id
GROUP BY pc.id, pc.name, pc.status, pc.credit_amount, pc.max_recipients, 
         pc.current_recipients, pc.starts_at, pc.ends_at, pc.created_at
ORDER BY pc.created_at DESC; 