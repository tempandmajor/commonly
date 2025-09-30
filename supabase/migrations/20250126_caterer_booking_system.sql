-- Caterer Booking System Migration
-- This migration creates a comprehensive caterer booking system with proper approval workflow and time slot management

-- Create caterer_bookings table for tracking all caterer bookings
CREATE TABLE public.caterer_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caterer_id UUID REFERENCES public.caterers(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Event Details
    event_title TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_description TEXT,
    start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    guest_count INTEGER NOT NULL,
    
    -- Catering Specific Information
    selected_menu_id UUID, -- References caterer_menus(id)
    dietary_restrictions TEXT,
    service_style TEXT, -- e.g., 'buffet', 'plated', 'family-style'
    event_location TEXT NOT NULL,
    setup_requirements TEXT,
    
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
    
    -- Caterer Response
    caterer_response TEXT,
    responded_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Metadata for additional information
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Add booking settings to caterers table
ALTER TABLE public.caterers 
ADD COLUMN IF NOT EXISTS price_per_person INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS minimum_guests INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS maximum_guests INTEGER DEFAULT 500,
ADD COLUMN IF NOT EXISTS advance_booking_days INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS simultaneous_bookings_allowed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS max_simultaneous_bookings INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS service_radius_miles INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS booking_settings JSONB DEFAULT '{
    "requires_approval": true,
    "response_time_hours": 48,
    "weekend_pricing_multiplier": 1.2,
    "holiday_pricing_multiplier": 1.5,
    "service_fee_percentage": 0.15
}'::jsonb;

-- Create caterer_availability table for managing blocked dates/times
CREATE TABLE public.caterer_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caterer_id UUID REFERENCES public.caterers(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    is_available BOOLEAN DEFAULT true,
    reason TEXT, -- e.g., "vacation", "already booked", "holiday"
    max_bookings_this_slot INTEGER DEFAULT 1, -- For caterers who can handle multiple events
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Allow multiple availability records for same caterer/date for flexible scheduling
    UNIQUE(caterer_id, date, start_time, end_time)
);

-- Create caterer_operating_schedule table for regular schedule
CREATE TABLE public.caterer_operating_schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caterer_id UUID REFERENCES public.caterers(id) ON DELETE CASCADE NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday
    start_time TIME,
    end_time TIME,
    is_available BOOLEAN DEFAULT true,
    max_events_per_day INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(caterer_id, day_of_week)
);

-- Create caterer_service_areas table for geographic coverage
CREATE TABLE public.caterer_service_areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caterer_id UUID REFERENCES public.caterers(id) ON DELETE CASCADE NOT NULL,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    radius_miles INTEGER DEFAULT 25,
    additional_fee_cents INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for all new tables
ALTER TABLE public.caterer_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caterer_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caterer_operating_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caterer_service_areas ENABLE ROW LEVEL SECURITY;

-- RLS Policies for caterer_bookings
CREATE POLICY "Users can view their own bookings" ON public.caterer_bookings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Caterer owners can view bookings for their caterers" ON public.caterer_bookings
    FOR SELECT USING (
        caterer_id IN (SELECT id FROM public.caterers WHERE owner_id = auth.uid())
    );

CREATE POLICY "Users can create bookings" ON public.caterer_bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Caterer owners can update booking status" ON public.caterer_bookings
    FOR UPDATE USING (
        caterer_id IN (SELECT id FROM public.caterers WHERE owner_id = auth.uid())
    );

CREATE POLICY "Users can cancel their own bookings" ON public.caterer_bookings
    FOR UPDATE USING (
        auth.uid() = user_id AND 
        status IN ('pending', 'approved') AND
        OLD.status != 'cancelled'
    );

-- RLS Policies for caterer_availability
CREATE POLICY "Anyone can view caterer availability" ON public.caterer_availability
    FOR SELECT USING (true);

CREATE POLICY "Caterer owners can manage availability" ON public.caterer_availability
    FOR ALL USING (
        caterer_id IN (SELECT id FROM public.caterers WHERE owner_id = auth.uid())
    );

-- RLS Policies for caterer_operating_schedule
CREATE POLICY "Anyone can view operating schedules" ON public.caterer_operating_schedule
    FOR SELECT USING (true);

CREATE POLICY "Caterer owners can manage schedules" ON public.caterer_operating_schedule
    FOR ALL USING (
        caterer_id IN (SELECT id FROM public.caterers WHERE owner_id = auth.uid())
    );

-- RLS Policies for caterer_service_areas
CREATE POLICY "Anyone can view service areas" ON public.caterer_service_areas
    FOR SELECT USING (true);

CREATE POLICY "Caterer owners can manage service areas" ON public.caterer_service_areas
    FOR ALL USING (
        caterer_id IN (SELECT id FROM public.caterers WHERE owner_id = auth.uid())
    );

-- Create function to check for caterer booking conflicts
CREATE OR REPLACE FUNCTION check_caterer_booking_conflicts(
    p_caterer_id UUID,
    p_start_datetime TIMESTAMP WITH TIME ZONE,
    p_end_datetime TIMESTAMP WITH TIME ZONE,
    p_booking_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    caterer_settings RECORD;
    existing_bookings_count INTEGER;
    max_allowed INTEGER;
BEGIN
    -- Get caterer's simultaneous booking settings
    SELECT 
        simultaneous_bookings_allowed,
        max_simultaneous_bookings
    INTO caterer_settings
    FROM caterers 
    WHERE id = p_caterer_id;
    
    -- If caterer doesn't allow simultaneous bookings, check for any conflicts
    IF NOT caterer_settings.simultaneous_bookings_allowed THEN
        RETURN NOT EXISTS (
            SELECT 1 FROM caterer_bookings 
            WHERE caterer_id = p_caterer_id
            AND status = 'approved'
            AND (p_booking_id IS NULL OR id != p_booking_id)
            AND (
                (start_datetime <= p_start_datetime AND end_datetime > p_start_datetime) OR
                (start_datetime < p_end_datetime AND end_datetime >= p_end_datetime) OR
                (start_datetime >= p_start_datetime AND end_datetime <= p_end_datetime)
            )
        );
    END IF;
    
    -- If simultaneous bookings are allowed, check against max limit
    max_allowed := COALESCE(caterer_settings.max_simultaneous_bookings, 1);
    
    SELECT COUNT(*)
    INTO existing_bookings_count
    FROM caterer_bookings 
    WHERE caterer_id = p_caterer_id
    AND status = 'approved'
    AND (p_booking_id IS NULL OR id != p_booking_id)
    AND (
        (start_datetime <= p_start_datetime AND end_datetime > p_start_datetime) OR
        (start_datetime < p_end_datetime AND end_datetime >= p_end_datetime) OR
        (start_datetime >= p_start_datetime AND end_datetime <= p_end_datetime)
    );
    
    RETURN existing_bookings_count < max_allowed;
END;
$$ LANGUAGE plpgsql;

-- Create function to get caterer availability for a date range
CREATE OR REPLACE FUNCTION get_caterer_availability(
    p_caterer_id UUID,
    p_start_date DATE,
    p_end_date DATE
) RETURNS TABLE(
    date DATE,
    availability_info JSONB
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
    operating_schedule AS (
        SELECT 
            ds.date,
            EXTRACT(DOW FROM ds.date)::integer as dow,
            cos.start_time,
            cos.end_time,
            cos.is_available,
            cos.max_events_per_day
        FROM date_series ds
        LEFT JOIN caterer_operating_schedule cos ON cos.caterer_id = p_caterer_id 
            AND cos.day_of_week = EXTRACT(DOW FROM ds.date)::integer
    ),
    existing_bookings AS (
        SELECT 
            DATE(start_datetime) as booking_date,
            COUNT(*) as booking_count,
            array_agg(
                jsonb_build_object(
                    'start', start_datetime::time, 
                    'end', end_datetime::time,
                    'guest_count', guest_count,
                    'event_title', event_title
                )
            ) as bookings
        FROM caterer_bookings
        WHERE caterer_id = p_caterer_id
        AND status = 'approved'
        AND DATE(start_datetime) BETWEEN p_start_date AND p_end_date
        GROUP BY DATE(start_datetime)
    ),
    blocked_times AS (
        SELECT 
            ca.date,
            ca.start_time,
            ca.end_time,
            ca.is_available,
            ca.reason
        FROM caterer_availability ca
        WHERE ca.caterer_id = p_caterer_id
        AND ca.date BETWEEN p_start_date AND p_end_date
    ),
    caterer_settings AS (
        SELECT 
            simultaneous_bookings_allowed,
            max_simultaneous_bookings
        FROM caterers 
        WHERE id = p_caterer_id
    )
    SELECT 
        os.date,
        CASE 
            WHEN os.is_available = false OR os.start_time IS NULL THEN 
                jsonb_build_object(
                    'available', false,
                    'reason', 'Not operating this day'
                )
            ELSE jsonb_build_object(
                'available', true,
                'operating_hours', jsonb_build_object(
                    'start', os.start_time,
                    'end', os.end_time
                ),
                'simultaneous_bookings_allowed', cs.simultaneous_bookings_allowed,
                'max_simultaneous_bookings', cs.max_simultaneous_bookings,
                'current_bookings', COALESCE(eb.booking_count, 0),
                'bookings', COALESCE(eb.bookings, '[]'::jsonb),
                'blocked_periods', COALESCE(
                    (SELECT jsonb_agg(
                        jsonb_build_object(
                            'start', bt.start_time, 
                            'end', bt.end_time,
                            'reason', bt.reason
                        )
                    ) FROM blocked_times bt WHERE bt.date = os.date AND bt.is_available = false),
                    '[]'::jsonb
                ),
                'spots_remaining', GREATEST(0, 
                    COALESCE(cs.max_simultaneous_bookings, 1) - COALESCE(eb.booking_count, 0)
                )
            )
        END as availability_info
    FROM operating_schedule os
    CROSS JOIN caterer_settings cs
    LEFT JOIN existing_bookings eb ON eb.booking_date = os.date
    ORDER BY os.date;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX idx_caterer_bookings_caterer_id ON caterer_bookings(caterer_id);
CREATE INDEX idx_caterer_bookings_user_id ON caterer_bookings(user_id);
CREATE INDEX idx_caterer_bookings_status ON caterer_bookings(status);
CREATE INDEX idx_caterer_bookings_datetime ON caterer_bookings(start_datetime, end_datetime);
CREATE INDEX idx_caterer_availability_caterer_date ON caterer_availability(caterer_id, date);
CREATE INDEX idx_caterer_operating_schedule_caterer_day ON caterer_operating_schedule(caterer_id, day_of_week);
CREATE INDEX idx_caterer_service_areas_caterer ON caterer_service_areas(caterer_id);

-- Create updated_at trigger for caterer_bookings
CREATE OR REPLACE FUNCTION update_caterer_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_caterer_bookings_updated_at
    BEFORE UPDATE ON caterer_bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_caterer_updated_at_column(); 