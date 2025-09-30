/**
 * Analytics Service - Backward Compatibility Layer
 *
 * This file provides backward compatibility with legacy analytics code.
 * New code should use the consolidated API directly.
 *
 * @deprecated Use the analytics API and hooks directly from '@/services/analytics'
 */

import { analyticsAPI } from '../api/analyticsAPI';
import { EventCategory } from '../core/types';

/**
 * Legacy analytics event interface
 * @deprecated Use AnalyticsEvent from '@/services/analytics' instead
 */
export interface LegacyAnalyticsEvent {
  event: string;
  properties?: Record<string, unknown> | undefined;
}

/**
 * Legacy analytics service class
 * @deprecated Use analyticsAPI from '@/services/analytics' instead
 */
export class AnalyticsService {
  /**
   * Track a page view in the legacy format
   * @deprecated Use analyticsAPI.trackPageView() instead
   */
  static trackPageView(page: string, title?: string): void {
    analyticsAPI.trackPageView(page, title);
  }

  /**
   * Track an event in the legacy format
   * @deprecated Use analyticsAPI.trackEvent() instead
   */
  static trackEvent(eventName: string, properties?: Record<string, unknown>): void {
    analyticsAPI.trackEvent({
      name: eventName,
      category: EventCategory.CUSTOM,
      properties,
    });
  }

  /**
   * Legacy method to track a user
   * @deprecated Use analyticsAPI.identifyUser() instead
   */
  static identifyUser(userId: string, traits?: Record<string, unknown>): void {
    analyticsAPI.identifyUser(userId, traits);
  }

  /**
   * Legacy method to track a conversion
   * @deprecated Use analyticsAPI.trackEvent() with conversion category instead
   */
  static trackConversion(name: string, value?: number, metadata?: Record<string, unknown>): void {
    analyticsAPI.trackEvent({
      name,
      category: EventCategory.CONVERSION,
      properties: {
        value,
          ...metadata,
      },
    });
  }
}

/**
 * Legacy event tracking service - specifically for user events
 * @deprecated Use analyticsAPI from '@/services/analytics' instead
 */
export class UserEventService {
  /**
   * Track user registration
   * @deprecated Use analyticsAPI.trackEvent() instead
   */
  static trackRegistration(method: string, metadata?: Record<string, unknown>): void {
    analyticsAPI.trackEvent({
      name: 'user_sign_up',
      category: EventCategory.USER,
      properties: {
        signUpMethod: method,
          ...metadata,
      },
    });
  }

  /**
   * Track user login
   * @deprecated Use analyticsAPI.trackEvent() instead
   */
  static trackLogin(method: string, metadata?: Record<string, unknown>): void {
    analyticsAPI.trackEvent({
      name: 'user_sign_in',
      category: EventCategory.USER,
      properties: {
        signInMethod: method,
          ...metadata,
      },
    });
  }
}

/**
 * Legacy service for content-related events
 * @deprecated Use analyticsAPI from '@/services/analytics' instead
 */
export class ContentTrackingService {
  /**
   * Track content view
   * @deprecated Use analyticsAPI.trackEvent() instead
   */
  static trackContentView(
    contentId: string,
    contentType: string,
    metadata?: Record<string, unknown>
  ): void {
    analyticsAPI.trackEvent({
      name: 'content_view',
      category: EventCategory.CONTENT,
      properties: {
        contentId,
        contentType,
          ...metadata,
      },
    });
  }
}

// Default export for legacy imports
export default AnalyticsService;
