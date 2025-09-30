/**
 * Analytics Service - Core Types
 *
 * This file defines the core types and interfaces for the analytics service.
 */

/**
 * Analytics event categories
 */
export enum EventCategory {
  USER = 'user',
  CONTENT = 'content',
  NAVIGATION = 'navigation',
  ENGAGEMENT = 'engagement',
  CONVERSION = 'conversion',
  ERROR = 'error',
  PERFORMANCE = 'performance',
  CUSTOM = 'custom',
}

/**
 * Common analytics event properties
 */
export interface EventCommonProperties {
  userId?: string | undefined;
  sessionId?: string | undefined;
  timestamp?: number | undefined;
  path?: string | undefined;
  referrer?: string | undefined;
  deviceType?: string | undefined;
  browser?: string | undefined;
}

/**
 * Analytics event interface
 */
export interface AnalyticsEvent {
  name: string;
  category: EventCategory;
  properties?: Record<string, unknown> | undefined;
  commonProperties?: EventCommonProperties | undefined;
}

/**
 * Page view event interface
 */
export interface PageViewEvent extends AnalyticsEvent {
  name: 'page_view';
  properties: {
    path: string;
    title?: string;
    referrer?: string;
    duration?: number;
  };
}

/**
 * User event interfaces
 */
export interface UserSignUpEvent extends AnalyticsEvent {
  name: 'user_sign_up';
  category: EventCategory.USER;
  properties: {
    signUpMethod: 'email' | 'google' | 'apple' | 'facebook' | 'phone' | string;
  };
}

export interface UserSignInEvent extends AnalyticsEvent {
  name: 'user_sign_in';
  category: EventCategory.USER;
  properties: {
    signInMethod: 'email' | 'google' | 'apple' | 'facebook' | 'phone' | string;
  };
}

export interface UserProfileUpdateEvent extends AnalyticsEvent {
  name: 'user_profile_update';
  category: EventCategory.USER;
  properties: {
    fieldsUpdated: string[];
  };
}

/**
 * Content event interfaces
 */
export interface ContentViewEvent extends AnalyticsEvent {
  name: 'content_view';
  category: EventCategory.CONTENT;
  properties: {
    contentId: string;
    contentType: 'event' | 'article' | 'podcast' | 'profile' | string;
    title?: string;
    creator?: string;
    duration?: number;
  };
}

/**
 * Event engagement interfaces
 */
export interface EventEngagementEvent extends AnalyticsEvent {
  name: 'event_engagement';
  category: EventCategory.ENGAGEMENT;
  properties: {
    eventId: string;
    action: 'register' | 'share' | 'bookmark' | 'follow' | string;
    value?: number;
  };
}

/**
 * Conversion event interfaces
 */
export interface ConversionEvent extends AnalyticsEvent {
  name: 'conversion';
  category: EventCategory.CONVERSION;
  properties: {
    conversionType: 'purchase' | 'registration' | 'subscription' | string;
    value?: number;
    currency?: string;
    itemId?: string;
    itemName?: string;
  };
}

/**
 * Error event interface
 */
export interface ErrorEvent extends AnalyticsEvent {
  name: 'error';
  category: EventCategory.ERROR;
  properties: {
    errorCode?: string;
    errorMessage: string;
    errorSource?: string;
    stackTrace?: string;
  };
}

/**
 * Performance event interface
 */
export interface PerformanceEvent extends AnalyticsEvent {
  name: 'performance';
  category: EventCategory.PERFORMANCE;
  properties: {
    metric: 'page_load' | 'api_response' | 'render_time' | string;
    value: number;
    unit?: 'ms' | 's' | 'min' | string;
  };
}

/**
 * Analytics configuration interface
 */
export interface AnalyticsConfig {
  enabled: boolean;
  anonymousTracking?: boolean | undefined;
  trackErrors?: boolean | undefined;
  trackPerformance?: boolean | undefined;
  samplingRate?: number | undefined;
  providers?: {
    googleAnalytics?: boolean | undefined;
    mixpanel?: boolean | undefined;
    segment?: boolean | undefined;
    amplitude?: boolean | undefined;
    custom?: boolean | undefined;
  };
}

/**
 * Analytics provider interface
 */
export interface AnalyticsProvider {
  initialize(config?: Record<string, unknown>): Promise<void> | undefined;
  trackEvent(event: AnalyticsEvent): Promise<void>;
  trackPageView(event: PageViewEvent): Promise<void>;
  setUser(userId: string, traits?: Record<string, unknown>): Promise<void> | undefined;
  reset(): Promise<void>;
}

/**
 * Error types for analytics operations
 */
export enum AnalyticsErrorType {
  INITIALIZATION_FAILED = 'initialization_failed',
  TRACKING_FAILED = 'tracking_failed',
  PROVIDER_MISSING = 'provider_missing',
  INVALID_EVENT = 'invalid_event',
  CONFIGURATION_ERROR = 'configuration_error',
}

/**
 * Analytics error class
 */
export class AnalyticsError extends Error {
  public readonly type: AnalyticsErrorType;
  public readonly originalError?: Error;

  constructor(message: string, type: AnalyticsErrorType, originalError?: Error) {
    super(message);
    this.name = 'AnalyticsError';
    this.type = type;
    this.originalError = originalError;
  }
}
