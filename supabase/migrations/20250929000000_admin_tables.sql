-- ================================================
-- ADMIN TABLES MIGRATION
-- Creates missing tables for admin dashboard functionality
-- ================================================

-- Create reports table for system reports
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_type TEXT NOT NULL CHECK (report_type IN ('users', 'events', 'revenue', 'analytics', 'security', 'system')),
  title TEXT NOT NULL,
  description TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  generated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  file_url TEXT,
  file_size_bytes BIGINT,
  status TEXT NOT NULL DEFAULT 'generating' CHECK (status IN ('generating', 'ready', 'failed')),
  error_message TEXT,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create management_dashboard table for centralized dashboard data
CREATE TABLE IF NOT EXISTS public.management_dashboard (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL DEFAULT 0,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('count', 'currency', 'percentage', 'duration')),
  category TEXT NOT NULL CHECK (category IN ('users', 'events', 'revenue', 'engagement', 'performance')),
  period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'yearly', 'all_time')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create security_logs table for audit trail
CREATE TABLE IF NOT EXISTS public.security_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('login', 'logout', 'failed_login', 'password_change', 'permission_change', 'api_access', 'data_export', 'data_import')),
  action TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  resource_type TEXT,
  resource_id UUID,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'high', 'critical')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create system_settings table for platform configuration
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  setting_type TEXT NOT NULL CHECK (setting_type IN ('general', 'notification', 'email', 'security', 'api', 'feature')),
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  last_modified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create admin_actions table for tracking admin operations
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('user_suspend', 'user_reactivate', 'content_approve', 'content_reject', 'venue_approve', 'venue_suspend', 'report_resolve')),
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================
-- INDEXES FOR PERFORMANCE
-- ================================================

CREATE INDEX IF NOT EXISTS idx_reports_type ON public.reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_management_dashboard_category ON public.management_dashboard(category);
CREATE INDEX IF NOT EXISTS idx_management_dashboard_period ON public.management_dashboard(period);
CREATE INDEX IF NOT EXISTS idx_management_dashboard_date ON public.management_dashboard(date DESC);
CREATE INDEX IF NOT EXISTS idx_management_dashboard_metric_name ON public.management_dashboard(metric_name);

CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON public.security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON public.security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_severity ON public.security_logs(severity);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON public.security_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_system_settings_type ON public.system_settings(setting_type);

CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON public.admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_action_type ON public.admin_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON public.admin_actions(created_at DESC);

-- ================================================
-- TRIGGERS FOR UPDATED_AT
-- ================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_reports_updated_at ON public.reports;
CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_management_dashboard_updated_at ON public.management_dashboard;
CREATE TRIGGER update_management_dashboard_updated_at
  BEFORE UPDATE ON public.management_dashboard
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_system_settings_updated_at ON public.system_settings;
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- RLS POLICIES - Admin Only Access
-- ================================================

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.management_dashboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- Reports: Admin only
CREATE POLICY "Admins can view all reports" ON public.reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can create reports" ON public.reports
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update reports" ON public.reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Management Dashboard: Admin only
CREATE POLICY "Admins can view dashboard data" ON public.management_dashboard
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "System can insert dashboard data" ON public.management_dashboard
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update dashboard data" ON public.management_dashboard
  FOR UPDATE USING (true);

-- Security Logs: Admin only read
CREATE POLICY "Admins can view security logs" ON public.security_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "System can create security logs" ON public.security_logs
  FOR INSERT WITH CHECK (true);

-- System Settings: Admin only
CREATE POLICY "Admins can view all settings" ON public.system_settings
  FOR SELECT USING (
    is_public = true OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage settings" ON public.system_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Admin Actions: Admin only
CREATE POLICY "Admins can view admin actions" ON public.admin_actions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can create admin actions" ON public.admin_actions
  FOR INSERT WITH CHECK (
    auth.uid() = admin_id AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- ================================================
-- HELPER FUNCTIONS
-- ================================================

-- Function to refresh dashboard metrics
CREATE OR REPLACE FUNCTION public.refresh_management_dashboard()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete old daily metrics
  DELETE FROM public.management_dashboard
  WHERE period = 'daily' AND date < CURRENT_DATE - INTERVAL '30 days';

  -- Insert or update today's metrics
  INSERT INTO public.management_dashboard (metric_name, metric_value, metric_type, category, period, date)
  VALUES
    ('total_users', (SELECT COUNT(*) FROM public.users), 'count', 'users', 'daily', CURRENT_DATE),
    ('new_users_today', (SELECT COUNT(*) FROM public.users WHERE DATE(created_at) = CURRENT_DATE), 'count', 'users', 'daily', CURRENT_DATE),
    ('total_events', (SELECT COUNT(*) FROM public.events), 'count', 'events', 'daily', CURRENT_DATE),
    ('active_events', (SELECT COUNT(*) FROM public.events WHERE start_date >= CURRENT_DATE), 'count', 'events', 'daily', CURRENT_DATE),
    ('total_revenue', (SELECT COALESCE(SUM(amount_cents) / 100.0, 0) FROM public.wallet_transactions WHERE type = 'credit'), 'currency', 'revenue', 'daily', CURRENT_DATE)
  ON CONFLICT (metric_name, period, date)
  DO UPDATE SET
    metric_value = EXCLUDED.metric_value,
    updated_at = NOW();

  RAISE NOTICE 'Dashboard metrics refreshed at %', NOW();
END;
$$;

GRANT EXECUTE ON FUNCTION public.refresh_management_dashboard() TO authenticated;

-- Function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_action TEXT,
  p_ip_address INET DEFAULT NULL,
  p_severity TEXT DEFAULT 'info',
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.security_logs (user_id, event_type, action, ip_address, severity, metadata)
  VALUES (p_user_id, p_event_type, p_action, p_ip_address, p_severity, p_metadata)
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_security_event(UUID, TEXT, TEXT, INET, TEXT, JSONB) TO authenticated;

-- ================================================
-- SEED DATA
-- ================================================

-- Insert default system settings
INSERT INTO public.system_settings (setting_key, setting_value, setting_type, description, is_public)
VALUES
  ('site_name', '"Commonly"'::jsonb, 'general', 'Platform name', true),
  ('site_description', '"The Pre Sale Event Ticketing Platform"'::jsonb, 'general', 'Platform description', true),
  ('support_email', '"support@commonly.com"'::jsonb, 'general', 'Support email address', true),
  ('maintenance_mode', 'false'::jsonb, 'general', 'Maintenance mode toggle', false),
  ('allow_registration', 'true'::jsonb, 'general', 'Allow new user registration', false),
  ('email_notifications', 'true'::jsonb, 'notification', 'Enable email notifications', false),
  ('sms_notifications', 'false'::jsonb, 'notification', 'Enable SMS notifications', false),
  ('require_two_factor', 'false'::jsonb, 'security', 'Require 2FA for admin accounts', false),
  ('session_timeout', '30'::jsonb, 'security', 'Session timeout in minutes', false),
  ('max_login_attempts', '5'::jsonb, 'security', 'Maximum login attempts before lockout', false),
  ('api_enabled', 'true'::jsonb, 'api', 'Enable API access', false),
  ('api_rate_limit', '1000'::jsonb, 'api', 'API requests per hour', false)
ON CONFLICT (setting_key) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE public.reports IS 'System reports generated by admin dashboard';
COMMENT ON TABLE public.management_dashboard IS 'Cached dashboard metrics for admin overview';
COMMENT ON TABLE public.security_logs IS 'Security audit trail for system access';
COMMENT ON TABLE public.system_settings IS 'Platform-wide configuration settings';
COMMENT ON TABLE public.admin_actions IS 'Audit log of admin operations';

COMMENT ON FUNCTION public.refresh_management_dashboard() IS 'Refreshes dashboard metrics cache';
COMMENT ON FUNCTION public.log_security_event(UUID, TEXT, TEXT, INET, TEXT, JSONB) IS 'Logs security events to audit trail';