-- Phase 1: Critical Role-Based Access Control Fix
-- Create secure role system to replace the vulnerable is_admin column

-- Create role enum
CREATE TYPE public.app_role AS ENUM ('user', 'admin', 'event_organizer', 'venue_owner', 'caterer', 'moderator');

-- Create user_roles table for secure role management
CREATE TABLE public.user_roles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.app_role NOT NULL DEFAULT 'user',
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    metadata JSONB DEFAULT '{}',
    UNIQUE(user_id, role)
);

-- Enable RLS on user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles safely
CREATE OR REPLACE FUNCTION public.check_user_role(user_uuid UUID, required_role public.app_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.user_roles 
        WHERE user_id = user_uuid 
        AND role = required_role
    );
END;
$$;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN public.check_user_role(user_uuid, 'admin');
END;
$$;

-- Create function to get user roles
CREATE OR REPLACE FUNCTION public.get_user_roles(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE(role public.app_role)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN QUERY
    SELECT ur.role
    FROM public.user_roles ur
    WHERE ur.user_id = user_uuid;
END;
$$;

-- Create secure function to assign roles (only admins can assign roles)
CREATE OR REPLACE FUNCTION public.assign_user_role(target_user_id UUID, new_role public.app_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    -- Only admins can assign roles
    IF NOT public.is_admin(current_user_id) THEN
        RAISE EXCEPTION 'Access denied: Only administrators can assign roles';
    END IF;
    
    -- Prevent self-assignment of admin role
    IF current_user_id = target_user_id AND new_role = 'admin' THEN
        RAISE EXCEPTION 'Access denied: Cannot self-assign admin role';
    END IF;
    
    -- Insert the role assignment
    INSERT INTO public.user_roles (user_id, role, assigned_by)
    VALUES (target_user_id, new_role, current_user_id)
    ON CONFLICT (user_id, role) 
    DO UPDATE SET 
        assigned_by = EXCLUDED.assigned_by,
        updated_at = now();
    
    RETURN TRUE;
END;
$$;

-- Create RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Migrate existing admin users to new role system
INSERT INTO public.user_roles (user_id, role, assigned_by)
SELECT id, 'admin'::public.app_role, id
FROM public.users 
WHERE is_admin = true
ON CONFLICT (user_id, role) DO NOTHING;

-- Update existing RLS policies to use secure role checking
-- Admin Settings
DROP POLICY IF EXISTS "Admins can manage admin settings" ON public.admin_settings;
CREATE POLICY "Admins can manage admin settings"
ON public.admin_settings
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Contact Submissions
DROP POLICY IF EXISTS "Admins can update contact submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Admins can view all contact submissions" ON public.contact_submissions;

CREATE POLICY "Admins can update contact submissions"
ON public.contact_submissions
FOR UPDATE
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view all contact submissions"
ON public.contact_submissions
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Update trigger for automatic timestamps
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();