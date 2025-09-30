-- Venue Booking System Migration
-- This migration creates a comprehensive venue booking system with proper approval workflow and time slot management

-- Create venue_bookings table for tracking all venue bookings
CREATE TABLE public.venue_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Booking Details
    event_title TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_description TEXT,
    start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    guest_count INTEGER NOT NULL,
    
    -- Contact Information
    contact_phone TEXT,
    contact_email TEXT,
    special_requests TEXT,
    
    -- Booking Status Workflow
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'approved', 'rejected', 'cancelled', 'completed')
    ),
    
    -- Payment Information
    total_amount_cents INTEGER NOT NULL,
    deposit_amount_cents INTEGER,
    payment_status TEXT DEFAULT 'pending' CHECK (
        payment_status IN ('pending', 'deposit_paid', 'fully_paid', 'refunded')
    ),
    payment_intent_id TEXT,
    
    -- Venue Owner Response
    owner_response TEXT,
    responded_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Metadata for additional information
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Add status to venues table if not exists
ALTER TABLE public.venues 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (
    status IN ('pending', 'active', 'inactive', 'suspended')
);

-- Add pricing and booking settings to venues
ALTER TABLE public.venues 
ADD COLUMN IF NOT EXISTS price_per_hour INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS minimum_booking_hours INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS maximum_booking_hours INTEGER DEFAULT 12,
ADD COLUMN IF NOT EXISTS advance_booking_days INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS cancellation_policy TEXT,
ADD COLUMN IF NOT EXISTS instant_booking BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS booking_settings JSONB DEFAULT '{
    "requires_approval": true,
    "response_time_hours": 24,
    "weekend_pricing_multiplier": 1.0,
    "holiday_pricing_multiplier": 1.0
}'::jsonb;

-- Create venue_availability table for managing blocked dates/times
CREATE TABLE public.venue_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    is_available BOOLEAN DEFAULT true,
    reason TEXT, -- e.g., "maintenance", "private event", "holiday"
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure no overlapping availability records for same venue/date
    UNIQUE(venue_id, date, start_time, end_time)
);

-- Create venue_operating_hours table
CREATE TABLE public.venue_operating_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday
    open_time TIME,
    close_time TIME,
    is_closed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(venue_id, day_of_week)
);

-- Enable RLS for all new tables
ALTER TABLE public.venue_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_operating_hours ENABLE ROW LEVEL SECURITY;

-- RLS Policies for venue_bookings
CREATE POLICY "Users can view their own bookings" ON public.venue_bookings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Venue owners can view bookings for their venues" ON public.venue_bookings
    FOR SELECT USING (
        venue_id IN (SELECT id FROM public.venues WHERE owner_id = auth.uid())
    );

CREATE POLICY "Users can create bookings" ON public.venue_bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Venue owners can update booking status" ON public.venue_bookings
    FOR UPDATE USING (
        venue_id IN (SELECT id FROM public.venues WHERE owner_id = auth.uid())
    );

CREATE POLICY "Users can cancel their own bookings" ON public.venue_bookings
    FOR UPDATE USING (
        auth.uid() = user_id AND 
        status IN ('pending', 'approved') AND
        OLD.status != 'cancelled'
    );

-- RLS Policies for venue_availability
CREATE POLICY "Anyone can view venue availability" ON public.venue_availability
    FOR SELECT USING (true);

CREATE POLICY "Venue owners can manage availability" ON public.venue_availability
    FOR ALL USING (
        venue_id IN (SELECT id FROM public.venues WHERE owner_id = auth.uid())
    );

-- RLS Policies for venue_operating_hours
CREATE POLICY "Anyone can view operating hours" ON public.venue_operating_hours
    FOR SELECT USING (true);

CREATE POLICY "Venue owners can manage operating hours" ON public.venue_operating_hours
    FOR ALL USING (
        venue_id IN (SELECT id FROM public.venues WHERE owner_id = auth.uid())
    );

-- Create function to check for booking conflicts
CREATE OR REPLACE FUNCTION check_booking_conflicts(
    p_venue_id UUID,
    p_start_datetime TIMESTAMP WITH TIME ZONE,
    p_end_datetime TIMESTAMP WITH TIME ZONE,
    p_booking_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    -- Check for overlapping approved bookings
    RETURN NOT EXISTS (
        SELECT 1 FROM venue_bookings 
        WHERE venue_id = p_venue_id
        AND status = 'approved'
        AND (p_booking_id IS NULL OR id != p_booking_id)
        AND (
            (start_datetime <= p_start_datetime AND end_datetime > p_start_datetime) OR
            (start_datetime < p_end_datetime AND end_datetime >= p_end_datetime) OR
            (start_datetime >= p_start_datetime AND end_datetime <= p_end_datetime)
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to get venue availability for a date range
CREATE OR REPLACE FUNCTION get_venue_availability(
    p_venue_id UUID,
    p_start_date DATE,
    p_end_date DATE
) RETURNS TABLE(
    date DATE,
    available_slots JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE date_series AS (
        SELECT p_start_date::date as date
        UNION ALL
        SELECT (date + INTERVAL '1 day')::date
        FROM date_series
        WHERE date < p_end_date
    ),
    operating_hours AS (
        SELECT 
            ds.date,
            EXTRACT(DOW FROM ds.date)::integer as dow,
            voh.open_time,
            voh.close_time,
            voh.is_closed
        FROM date_series ds
        LEFT JOIN venue_operating_hours voh ON voh.venue_id = p_venue_id 
            AND voh.day_of_week = EXTRACT(DOW FROM ds.date)::integer
    ),
    bookings AS (
        SELECT 
            DATE(start_datetime) as booking_date,
            start_datetime::time as start_time,
            end_datetime::time as end_time
        FROM venue_bookings
        WHERE venue_id = p_venue_id
        AND status = 'approved'
        AND DATE(start_datetime) BETWEEN p_start_date AND p_end_date
    ),
    blocked_times AS (
        SELECT 
            va.date,
            va.start_time,
            va.end_time
        FROM venue_availability va
        WHERE va.venue_id = p_venue_id
        AND va.is_available = false
        AND va.date BETWEEN p_start_date AND p_end_date
    )
    SELECT 
        oh.date,
        CASE 
            WHEN oh.is_closed = true OR oh.open_time IS NULL THEN '[]'::jsonb
            ELSE jsonb_build_object(
                'open_time', oh.open_time,
                'close_time', oh.close_time,
                'booked_slots', COALESCE(
                    (SELECT jsonb_agg(
                        jsonb_build_object('start', start_time, 'end', end_time)
                    ) FROM bookings WHERE booking_date = oh.date), 
                    '[]'::jsonb
                ),
                'blocked_slots', COALESCE(
                    (SELECT jsonb_agg(
                        jsonb_build_object('start', start_time, 'end', end_time)
                    ) FROM blocked_times WHERE date = oh.date),
                    '[]'::jsonb
                )
            )
        END as available_slots
    FROM operating_hours oh
    ORDER BY oh.date;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX idx_venue_bookings_venue_id ON venue_bookings(venue_id);
CREATE INDEX idx_venue_bookings_user_id ON venue_bookings(user_id);
CREATE INDEX idx_venue_bookings_status ON venue_bookings(status);
CREATE INDEX idx_venue_bookings_datetime ON venue_bookings(start_datetime, end_datetime);
CREATE INDEX idx_venue_availability_venue_date ON venue_availability(venue_id, date);
CREATE INDEX idx_venue_operating_hours_venue_day ON venue_operating_hours(venue_id, day_of_week);

-- Create updated_at trigger for venue_bookings
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_venue_bookings_updated_at
    BEFORE UPDATE ON venue_bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 