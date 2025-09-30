import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, unknown> | undefined;
}

export const useAnalytics = (page: string, title?: string) => {
  // Track page view on mount
  useEffect(() => {
    if (page) {
      trackPageView(page, title);
    }
  }, [page, title]);

  const trackPageView = useCallback(async (pageName: string, pageTitle?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      await supabase.from('analytics_events').insert({
        event_type: 'page_view',
        event_data: {
          page: pageName,
          title: pageTitle,
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
          referrer: document.referrer,
        },
        ...(user && { user_id: user.id }),
      });
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }, []);

  const trackEvent = useCallback(async (event: string, properties?: Record<string, unknown>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      await supabase.from('analytics_events').insert({
        event_type: event,
        event_data: {
          ...properties,
          timestamp: new Date().toISOString(),
        },
        ...(user && { user_id: user.id }),
      });
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }, []);

  const track = useCallback(async (event: string, properties?: Record<string, unknown>) => {
    await trackEvent(event, properties);
  }, [trackEvent]);

  return { trackEvent, track, trackPageView };
};
