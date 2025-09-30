/**
 * Analytics Service - React Hooks
 *
 * This module provides React hooks for tracking analytics in components.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/services/auth';
import { analyticsAPI } from '../api/analyticsAPI';
import { EventCategory } from '../core/types';

/**
 * Props for useAnalytics hook
 */
export interface UseAnalyticsProps {
  pageTitle?: string | undefined;
  trackPageView?: boolean | undefined;
  trackUserIdentity?: boolean | undefined;
}

/**
 * Hook for tracking page views and events in React components
 */
export const useAnalytics = (props?: UseAnalyticsProps) => {
  const { pageTitle, trackPageView = true, trackUserIdentity = true } = props || {};

  const location = useLocation();
  const { user } = useAuth();
  const prevPathRef = useRef<string>('');

  // Handle page view tracking
  useEffect(() => {
    if (!trackPageView) return;

    // Don't track if the path hasn't actually changed
    // This prevents duplicate events on route changes that don't actually navigate
    const currentPath = location.pathname + location.search;
    if (currentPath === prevPathRef.current) return;

    prevPathRef.current = currentPath;

    // Track page view
    analyticsAPI.trackPageView(currentPath, pageTitle);

    // Return cleanup function
    return () => {
      // Store time spent on page when navigating away
      const timeSpent = Date.now() - performance.now();

      analyticsAPI.trackEvent({
        name: 'page_exit',
        category: EventCategory.NAVIGATION,
        properties: {
          path: currentPath,
          timeSpentMs: timeSpent,
          title: pageTitle,
        },
      });
    };
  }, [router.asPath, pageTitle, trackPageView]);

  // Handle user identification
  useEffect(() => {
    if (!trackUserIdentity) return;

    if (user) {
      analyticsAPI.identifyUser(user.id, {
        email: user.email,
        created_at: user.created_at,
        // Add other relevant user traits here
          ...(user.profile && {
          full_name: user.profile.full_name,
        }),
      });
    } else {
      analyticsAPI.resetUser();
    }
  }, [user, trackUserIdentity]);

  /**
   * Track an event with proper typing
   */
  const trackEvent = useCallback(
    (
      eventName: string,
      properties?: Record<string, unknown>,
      category: EventCategory = EventCategory.CUSTOM
    ) => {
      analyticsAPI.trackEvent({
        name: eventName,
        category,
        properties,
      });
    },
    []
  );

  /**
   * Track a user interaction
   */
  const trackInteraction = useCallback(
    (action: string, element: string, properties?: Record<string, unknown>) => {
      analyticsAPI.trackEvent({
        name: 'user_interaction',
        category: EventCategory.ENGAGEMENT,
        properties: {
          action,
          element,
          path: router.asPath,
          ...properties,
        },
      });
    },
    [router.asPath]
  );

  /**
   * Track a form submission
   */
  const trackFormSubmission = useCallback(
    (formName: string, success: boolean, properties?: Record<string, unknown>) => {
      analyticsAPI.trackEvent({
        name: 'form_submission',
        category: EventCategory.ENGAGEMENT,
        properties: {
          formName,
          success,
          path: router.asPath,
          ...properties,
        },
      });
    },
    [router.asPath]
  );

  /**
   * Track a conversion event
   */
  const trackConversion = useCallback(
    (conversionType: string, value?: number, properties?: Record<string, unknown>) => {
      analyticsAPI.trackEvent({
        name: 'conversion',
        category: EventCategory.CONVERSION,
        properties: {
          conversionType,
          value,
          path: router.asPath,
          ...properties,
        },
      });
    },
    [router.asPath]
  );

  /**
   * Track an error
   */
  const trackError = useCallback(
    (errorMessage: string, errorCode?: string, properties?: Record<string, unknown>) => {
      analyticsAPI.trackError({
        errorMessage,
        errorCode,
        errorSource: router.asPath,
          ...properties,
      });
    },
    [router.asPath]
  );

  return {
    trackEvent,
    trackInteraction,
    trackFormSubmission,
    trackConversion,
    trackError,
  };
};

/**
 * Hook for tracking automatic component visibility
 */
export const useTrackComponentVisibility = (
  componentId: string,
  options?: {
    threshold?: number;
    rootMargin?: string;
    once?: boolean;
    trackTime?: boolean;
  }
) => {
  const { threshold = 0.5, rootMargin = '0px', once = true, trackTime = false } = options || {};

  const componentRef = useRef<HTMLElement | null>(null);
  const visibilityStartTime = useRef<number | null>(null);
  const wasVisible = useRef<boolean>(false);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;

    const element = componentRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Component became visible
            analyticsAPI.trackEvent({
              name: 'component_view',
              category: EventCategory.ENGAGEMENT,
              properties: {
                componentId,
                visibility: entry.intersectionRatio,
              },
            });

            if (trackTime) {
              visibilityStartTime.current = Date.now();
            }

            wasVisible.current = true;

            if (once) {
              observer.disconnect();
            }
          } else if (wasVisible.current && trackTime) {
            // Component is no longer visible, track time it was visible
            if (visibilityStartTime.current !== null) {
              const timeVisible = Date.now() - visibilityStartTime.current;

              analyticsAPI.trackEvent({
                name: 'component_visibility_duration',
                category: EventCategory.ENGAGEMENT,
                properties: {
                  componentId,
                  timeVisible,
                },
              });

              visibilityStartTime.current = null;
            }
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [componentId, threshold, rootMargin, once, trackTime]);

  return { ref: componentRef };
};
