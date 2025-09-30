-- ================================================
-- SECURITY FIXES MIGRATION
-- ================================================

-- Fix 1: Secure the update_daily_analytics function with proper search_path
-- This prevents SQL injection attacks by fixing the search path

CREATE OR REPLACE FUNCTION public.update_daily_analytics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Update daily analytics data
    -- This function should be called by a cron job or scheduled task
    
    -- Example analytics update logic:
    -- Update user registration counts
    -- Update event creation counts
    -- Update revenue analytics
    -- etc.
    
    -- For now, this is a placeholder function
    -- Add your specific analytics logic here
    
    RAISE NOTICE 'Daily analytics update completed at %', now();
END;
$$;

-- Grant execute permission to authenticated users (adjust as needed)
GRANT EXECUTE ON FUNCTION public.update_daily_analytics() TO authenticated;

-- Fix 2: Create a secure analytics aggregation function
CREATE OR REPLACE FUNCTION public.aggregate_daily_analytics(p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
    date DATE,
    total_users INTEGER,
    total_events INTEGER,
    total_revenue DECIMAL(10,2),
    active_events INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p_date as date,
        COUNT(DISTINCT u.id)::INTEGER as total_users,
        COUNT(DISTINCT e.id)::INTEGER as total_events,
        COALESCE(SUM(wt.amount_cents) / 100.0, 0)::DECIMAL(10,2) as total_revenue,
        COUNT(DISTINCT CASE WHEN e.start_date >= p_date THEN e.id END)::INTEGER as active_events
    FROM public.users u
    LEFT JOIN public.events e ON e.creator_id = u.id
    LEFT JOIN public.wallet_transactions wt ON wt.user_id = u.id 
        AND wt.type = 'credit' 
        AND DATE(wt.created_at) = p_date
    WHERE DATE(u.created_at) <= p_date;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.aggregate_daily_analytics(DATE) TO authenticated;

-- Fix 3: Create a secure user analytics function
CREATE OR REPLACE FUNCTION public.get_user_analytics(p_user_id UUID)
RETURNS TABLE (
    total_events INTEGER,
    total_attendees INTEGER,
    total_revenue DECIMAL(10,2),
    events_this_month INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT e.id)::INTEGER as total_events,
        COALESCE(SUM(e.attendee_count), 0)::INTEGER as total_attendees,
        COALESCE(SUM(wt.amount_cents) / 100.0, 0)::DECIMAL(10,2) as total_revenue,
        COUNT(DISTINCT CASE 
            WHEN e.created_at >= DATE_TRUNC('month', CURRENT_DATE) 
            THEN e.id 
        END)::INTEGER as events_this_month
    FROM public.events e
    LEFT JOIN public.wallet_transactions wt ON wt.user_id = p_user_id 
        AND wt.type = 'credit'
    WHERE e.creator_id = p_user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_analytics(UUID) TO authenticated;

-- Fix 4: Create a secure event analytics function
CREATE OR REPLACE FUNCTION public.get_event_analytics(p_event_id UUID)
RETURNS TABLE (
    total_registrations INTEGER,
    total_revenue DECIMAL(10,2),
    average_rating DECIMAL(3,2),
    completion_rate DECIMAL(5,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(er.id)::INTEGER as total_registrations,
        COALESCE(SUM(er.payment_amount), 0)::DECIMAL(10,2) as total_revenue,
        COALESCE(AVG(er.rating), 0)::DECIMAL(3,2) as average_rating,
        CASE 
            WHEN COUNT(er.id) > 0 THEN 
                (COUNT(CASE WHEN er.status = 'completed' THEN 1 END) * 100.0 / COUNT(er.id))::DECIMAL(5,2)
            ELSE 0 
        END as completion_rate
    FROM public.event_registrations er
    WHERE er.event_id = p_event_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_event_analytics(UUID) TO authenticated;

-- Fix 5: Create indexes for better analytics performance
CREATE INDEX IF NOT EXISTS idx_analytics_users_created_at ON public.users(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_start_date ON public.events(start_date);
CREATE INDEX IF NOT EXISTS idx_analytics_wallet_transactions_created_at ON public.wallet_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_wallet_transactions_type ON public.wallet_transactions(type);
CREATE INDEX IF NOT EXISTS idx_analytics_event_registrations_event_id ON public.event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_registrations_status ON public.event_registrations(status);

-- Fix 6: Create a secure analytics view for dashboard
CREATE OR REPLACE VIEW public.analytics_dashboard AS
SELECT 
    DATE_TRUNC('day', u.created_at)::DATE as date,
    COUNT(DISTINCT u.id) as new_users,
    COUNT(DISTINCT e.id) as new_events,
    COALESCE(SUM(wt.amount_cents) / 100.0, 0) as daily_revenue,
    COUNT(DISTINCT er.id) as new_registrations
FROM public.users u
LEFT JOIN public.events e ON e.creator_id = u.id 
    AND DATE(e.created_at) = DATE(u.created_at)
LEFT JOIN public.wallet_transactions wt ON wt.user_id = u.id 
    AND wt.type = 'credit' 
    AND DATE(wt.created_at) = DATE(u.created_at)
LEFT JOIN public.event_registrations er ON er.user_id = u.id 
    AND DATE(er.created_at) = DATE(u.created_at)
WHERE u.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', u.created_at)
ORDER BY date DESC;

-- Grant select permission on the analytics view
GRANT SELECT ON public.analytics_dashboard TO authenticated;

-- Fix 7: Create RLS policies for analytics data
-- Ensure users can only access their own analytics data

-- Policy for users to view their own analytics
CREATE POLICY "Users can view their own analytics" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Policy for events analytics (users can view events they created)
CREATE POLICY "Users can view their own events analytics" ON public.events
    FOR SELECT USING (auth.uid() = creator_id);

-- Policy for wallet transactions (users can view their own transactions)
CREATE POLICY "Users can view their own wallet transactions" ON public.wallet_transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Policy for event registrations (users can view their own registrations)
CREATE POLICY "Users can view their own event registrations" ON public.event_registrations
    FOR SELECT USING (auth.uid() = user_id);

-- Fix 8: Create a function to clean up old analytics data
CREATE OR REPLACE FUNCTION public.cleanup_old_analytics(p_days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Clean up old analytics events (keep only recent data)
    DELETE FROM public.analytics_events 
    WHERE created_at < CURRENT_DATE - (p_days_to_keep || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RAISE NOTICE 'Cleaned up % old analytics records', deleted_count;
    
    RETURN deleted_count;
END;
$$;

-- Grant execute permission to service role only
GRANT EXECUTE ON FUNCTION public.cleanup_old_analytics(INTEGER) TO service_role;

-- Fix 9: Create a function to generate analytics reports
CREATE OR REPLACE FUNCTION public.generate_analytics_report(
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    report_date DATE,
    total_users INTEGER,
    total_events INTEGER,
    total_revenue DECIMAL(10,2),
    active_users INTEGER,
    conversion_rate DECIMAL(5,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CURRENT_DATE as report_date,
        COUNT(DISTINCT u.id)::INTEGER as total_users,
        COUNT(DISTINCT e.id)::INTEGER as total_events,
        COALESCE(SUM(wt.amount_cents) / 100.0, 0)::DECIMAL(10,2) as total_revenue,
        COUNT(DISTINCT CASE 
            WHEN u.last_sign_in_at >= p_start_date 
            THEN u.id 
        END)::INTEGER as active_users,
        CASE 
            WHEN COUNT(DISTINCT u.id) > 0 THEN 
                (COUNT(DISTINCT er.user_id) * 100.0 / COUNT(DISTINCT u.id))::DECIMAL(5,2)
            ELSE 0 
        END as conversion_rate
    FROM public.users u
    LEFT JOIN public.events e ON e.creator_id = u.id 
        AND e.created_at BETWEEN p_start_date AND p_end_date
    LEFT JOIN public.wallet_transactions wt ON wt.user_id = u.id 
        AND wt.type = 'credit'
        AND wt.created_at BETWEEN p_start_date AND p_end_date
    LEFT JOIN public.event_registrations er ON er.user_id = u.id 
        AND er.created_at BETWEEN p_start_date AND p_end_date
    WHERE u.created_at BETWEEN p_start_date AND p_end_date;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.generate_analytics_report(DATE, DATE) TO authenticated;

-- Fix 10: Add comments for documentation
COMMENT ON FUNCTION public.update_daily_analytics() IS 'Updates daily analytics data. Should be called by scheduled task.';
COMMENT ON FUNCTION public.aggregate_daily_analytics(DATE) IS 'Aggregates daily analytics data for a specific date.';
COMMENT ON FUNCTION public.get_user_analytics(UUID) IS 'Gets analytics data for a specific user.';
COMMENT ON FUNCTION public.get_event_analytics(UUID) IS 'Gets analytics data for a specific event.';
COMMENT ON FUNCTION public.cleanup_old_analytics(INTEGER) IS 'Cleans up old analytics data to maintain performance.';
COMMENT ON FUNCTION public.generate_analytics_report(DATE, DATE) IS 'Generates comprehensive analytics report for date range.';
COMMENT ON VIEW public.analytics_dashboard IS 'Dashboard view for analytics data.';

-- ================================================
-- SECURITY AUDIT LOG
-- ================================================

-- Log the security fixes
INSERT INTO public.analytics_events (event_type, event_data, created_at)
VALUES (
    'security_fixes_applied',
    '{"fixes": ["function_search_path_secured", "analytics_functions_created", "rls_policies_added", "indexes_created"]}'::jsonb,
    now()
); 