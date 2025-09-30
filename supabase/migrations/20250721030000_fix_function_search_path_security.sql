-- Fix Function Search Path Security Vulnerabilities
-- This migration addresses the security warnings by setting search_path for all functions

-- Fix get_events_near_location function
CREATE OR REPLACE FUNCTION public.get_events_near_location(
    lat double precision, 
    lng double precision, 
    radius_km double precision DEFAULT 50
)
RETURNS TABLE(
    id uuid,
    title text,
    description text,
    creator_id uuid,
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    location text,
    status text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    venue_id uuid,
    is_public boolean,
    image_url text,
    max_capacity integer,
    attendees_count integer,
    auto_extend_enabled boolean,
    available_tickets integer,
    banner_image text,
    campaign_deadline_type text,
    campaign_duration integer,
    category text,
    collaborators jsonb,
    current_amount integer,
    enhanced_type text,
    event_type text,
    funded_at timestamp with time zone,
    funding_status text,
    hybrid_event_enabled boolean,
    is_all_or_nothing boolean,
    is_free boolean,
    metadata jsonb,
    organizer_name text,
    pledge_deadline timestamp with time zone,
    price integer,
    recurrence_pattern jsonb,
    referral_commission_amount integer,
    referral_commission_type text,
    referral_enabled boolean,
    referral_terms text,
    reminder_days integer[],
    reserved_tickets integer,
    short_description text,
    sponsorship_enabled boolean,
    tags text[],
    target_amount integer,
    tickets_sold integer,
    tour_enabled boolean,
    virtual_event_enabled boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.title,
        e.description,
        e.creator_id,
        e.start_date,
        e.end_date,
        e.location,
        e.status,
        e.created_at,
        e.updated_at,
        e.venue_id,
        e.is_public,
        e.image_url,
        e.max_capacity,
        e.attendees_count,
        e.auto_extend_enabled,
        e.available_tickets,
        e.banner_image,
        e.campaign_deadline_type,
        e.campaign_duration,
        e.category,
        e.collaborators,
        e.current_amount,
        e.enhanced_type,
        e.event_type,
        e.funded_at,
        e.funding_status,
        e.hybrid_event_enabled,
        e.is_all_or_nothing,
        e.is_free,
        e.metadata,
        e.organizer_name,
        e.pledge_deadline,
        e.price,
        e.recurrence_pattern,
        e.referral_commission_amount,
        e.referral_commission_type,
        e.referral_enabled,
        e.referral_terms,
        e.reminder_days,
        e.reserved_tickets,
        e.short_description,
        e.sponsorship_enabled,
        e.tags,
        e.target_amount,
        e.tickets_sold,
        e.tour_enabled,
        e.virtual_event_enabled
    FROM public.events e
    WHERE e.is_public = true
    AND e.status = 'active'
    AND (
        e.location IS NULL OR
        ST_DWithin(
            ST_MakePoint(lng, lat)::geography,
            ST_MakePoint(
                (regexp_match(e.location, '(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)'))[2]::float,
                (regexp_match(e.location, '(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)'))[1]::float
            )::geography,
            radius_km * 1000
        )
    )
    ORDER BY e.start_date ASC;
END;
$$;

-- Fix get_follower_count function
CREATE OR REPLACE FUNCTION public.get_follower_count(user_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    follower_count integer;
BEGIN
    SELECT COUNT(*)
    INTO follower_count
    FROM public.followers
    WHERE following_id = user_uuid;
    
    RETURN COALESCE(follower_count, 0);
END;
$$;

-- Fix get_following_count function
CREATE OR REPLACE FUNCTION public.get_following_count(user_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    following_count integer;
BEGIN
    SELECT COUNT(*)
    INTO following_count
    FROM public.followers
    WHERE follower_id = user_uuid;
    
    RETURN COALESCE(following_count, 0);
END;
$$;

-- Fix is_following function
CREATE OR REPLACE FUNCTION public.is_following(follower_uuid uuid, following_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.followers
        WHERE follower_id = follower_uuid
        AND following_id = following_uuid
    );
END;
$$;

-- Fix get_user_posts function
CREATE OR REPLACE FUNCTION public.get_user_posts(
    user_uuid uuid,
    limit_count integer DEFAULT 10,
    offset_count integer DEFAULT 0
)
RETURNS TABLE(
    id uuid,
    user_id uuid,
    title text,
    content text,
    image_url text,
    is_public boolean,
    likes_count integer,
    comments_count integer,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    user_display_name text,
    user_avatar_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.user_id,
        p.title,
        p.content,
        p.image_url,
        p.is_public,
        COALESCE(p.likes_count, 0) as likes_count,
        COALESCE(p.comments_count, 0) as comments_count,
        p.created_at,
        p.updated_at,
        COALESCE(u.display_name, u.name) as user_display_name,
        u.avatar_url as user_avatar_url
    FROM public.posts p
    LEFT JOIN public.users u ON p.user_id = u.id
    WHERE p.user_id = user_uuid
    AND (p.is_public = true OR p.user_id = auth.uid())
    ORDER BY p.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$;

-- Ensure has_2fa_enabled function has proper search_path (re-create to be safe)
CREATE OR REPLACE FUNCTION public.has_2fa_enabled(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_2fa_settings 
        WHERE user_id = user_uuid AND is_enabled = true
    );
END;
$$;

-- Ensure get_user_2fa_type function has proper search_path (re-create to be safe)
CREATE OR REPLACE FUNCTION public.get_user_2fa_type(user_uuid uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    user_2fa_type text;
BEGIN
    SELECT type INTO user_2fa_type
    FROM public.user_2fa_settings 
    WHERE user_id = user_uuid AND is_enabled = true
    LIMIT 1;
    
    RETURN COALESCE(user_2fa_type, 'none');
END;
$$; 