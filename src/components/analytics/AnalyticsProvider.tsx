import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { initializeAnalytics, trackPageView } from '@/services/analyticsService';

interface AnalyticsProviderProps {
  trackingId: string;
  children: React.ReactNode;
  insideRouter?: boolean | undefined;
}

/**
 * A component that initializes Google Analytics and tracks page views
 * when the route changes
 */
const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({
  trackingId,
  children,
  insideRouter = false,
}) => {
  // Initialize Google Analytics
  useEffect(() => {
    initializeAnalytics(trackingId);
  }, [trackingId]);

  // Only use location tracking if inside Router
  if (insideRouter) {
    const location = useLocation();

    // Track page views when the route changes
    useEffect(() => {
      trackPageView(location.pathname);
    }, [location]);
  }

  return <>{children}</>;
};

export default AnalyticsProvider;
