-- Phase 2: Enhanced Security Functions and Rate Limiting

-- Create table for security audit logging
CREATE TABLE IF NOT EXISTS public.security_audit_log (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on security audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Create policy for security audit log
CREATE POLICY "Users can view their own audit logs"
ON public.security_audit_log
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all audit logs"
ON public.security_audit_log
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Create policy for system to insert audit logs
CREATE POLICY "System can insert audit logs"
ON public.security_audit_log
FOR INSERT
WITH CHECK (true);

-- Update existing database functions to include search_path security
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

CREATE OR REPLACE FUNCTION public.get_user_2fa_type(user_uuid uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    user_2fa_type TEXT;
BEGIN
    SELECT type INTO user_2fa_type
    FROM public.user_2fa_settings 
    WHERE user_id = user_uuid AND is_enabled = true
    LIMIT 1;
    
    RETURN COALESCE(user_2fa_type, 'none');
END;
$$;

-- Create enhanced rate limiting function
CREATE OR REPLACE FUNCTION public.check_rate_limit_enhanced(
    p_action text, 
    p_limit_count integer DEFAULT 10, 
    p_time_window interval DEFAULT '01:00:00'::interval,
    p_user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    action_count integer;
BEGIN
    -- Count recent actions by this user
    SELECT COUNT(*)
    INTO action_count
    FROM public.security_audit_log
    WHERE user_id = p_user_id
    AND action = p_action
    AND created_at > (now() - p_time_window);
    
    -- Return false if limit exceeded
    IF action_count >= p_limit_count THEN
        -- Log the rate limit violation
        INSERT INTO public.security_audit_log (
            user_id, action, resource_type, metadata
        ) VALUES (
            p_user_id,
            'rate_limit_exceeded',
            'security',
            jsonb_build_object(
                'action', p_action,
                'count', action_count,
                'limit', p_limit_count,
                'time_window', p_time_window::text
            )
        );
        RETURN false;
    END IF;
    
    RETURN true;
END;
$$;

-- Create secure session management function
CREATE OR REPLACE FUNCTION public.log_security_event(
    p_action text, 
    p_resource_type text DEFAULT NULL::text, 
    p_resource_id uuid DEFAULT NULL::uuid, 
    p_metadata jsonb DEFAULT '{}'::jsonb,
    p_user_id uuid DEFAULT auth.uid()
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.security_audit_log (
        user_id,
        action,
        resource_type,
        resource_id,
        metadata
    ) VALUES (
        p_user_id,
        p_action,
        p_resource_type,
        p_resource_id,
        p_metadata
    );
END;
$$;