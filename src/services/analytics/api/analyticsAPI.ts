/**
 * Analytics Service - API Module
 *
 * This file implements the core analytics API functions.
 */

import {
  AnalyticsEvent,
  PageViewEvent,
  EventCategory,
  EventCommonProperties,
  AnalyticsConfig,
  AnalyticsProvider,
  AnalyticsError,
  AnalyticsErrorType,
} from '../core/types';
import { getDeviceInfo } from '../utils/deviceInfo';

// Default configuration
const DEFAULT_CONFIG: AnalyticsConfig = {
  enabled: process.env.NODE_ENV as string !== 'test',
  anonymousTracking: false,
  trackErrors: true,
  trackPerformance: true,
  samplingRate: 1.0, // 100% of events
  providers: {
    googleAnalytics: false,
    mixpanel: false,
    segment: false,
    amplitude: false,
    custom: false,
  },
};

// Analytics providers registry
const providers: Map<string, AnalyticsProvider> = new Map();

// Analytics configuration
let config: AnalyticsConfig = { ...DEFAULT_CONFIG };

// Session ID
let sessionId: string = generateSessionId();

// User ID
let userId: string | null = null;

// Current page info
let currentPage: string | null = null;

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return (Date.now().toString(36) + Math.random().toString(36)).substring(2);
}

/**
 * Initialize the analytics service
 */
export const initialize = async (customConfig?: Partial<AnalyticsConfig>): Promise<void> => {
  try {
    // Merge configurations
    config = { ...DEFAULT_CONFIG, ...customConfig };

    // Skip initialization if analytics is disabled
    if (!config.enabled) {
      return;
    }

    // Initialize providers
    const initPromises: Promise<void>[] = [];

    // Initialize registered providers
    for (const [providerName, provider] of providers.entries()) {
      initPromises.push(provider.initialize());
    }

    await Promise.all(initPromises);
    // Set up error tracking if enabled
    if (config.trackErrors) {
      setupErrorTracking();
    }

    // Set up performance tracking if enabled
    if (config.trackPerformance) {
      setupPerformanceTracking();
    }
  } catch (error) {
    const analyticsError = new AnalyticsError(
      `Failed to initialize analytics: ${error as Error}.message}`,
      AnalyticsErrorType.INITIALIZATION_FAILED,
      error as Error
    );
    throw analyticsError;
  }
};

/**
 * Set up global error tracking
 */
function setupErrorTracking(): void {
  if (typeof window !== 'undefined') {
    window.addEventListener('error', event => {
      trackError({
        errorMessage: event.message,
        errorSource: event.filename,
        stackTrace: event.error?.stack,
      });
    });

    window.addEventListener('unhandledrejection', event => {
      trackError({
        errorMessage: event.reason?.message || 'Unhandled Promise rejection',
        errorSource: 'promise',
        stackTrace: event.reason?.stack,
      });
    });
  }
}

/**
 * Set up performance tracking
 */
function setupPerformanceTracking(): void {
  if (typeof window !== 'undefined' && 'performance' in window) {
    // Track page load performance once page is fully loaded
    window.addEventListener('load', () => {
      setTimeout(() => {
        const performanceEntries = performance.getEntriesByType('navigation');
        if (performanceEntries.length > 0) {
          const navigationEntry = performanceEntries[0] as PerformanceNavigationTiming;
          trackPerformance({
            metric: 'page_load',
            value: navigationEntry.loadEventEnd - navigationEntry.startTime,
          });
        }
      }, 0);
    });
  }
}

/**
 * Register an analytics provider
 */
export const registerProvider = (name: string, provider: AnalyticsProvider): void => {
  providers.set(name, provider);
};

/**
 * Unregister an analytics provider
 */
export const unregisterProvider = (name: string): void => {
  providers.delete(name);
};

/**
 * Get common properties to attach to all events
 */
export const getCommonProperties = (): EventCommonProperties => {
  const deviceInfo = getDeviceInfo();

  return {
    userId: userId || undefined,
    sessionId,
    timestamp: Date.now(),
    path: currentPage || undefined,
    deviceType: deviceInfo.deviceType,
    browser: deviceInfo.browser,
  };
};

/**
 * Track a generic event
 */
export const trackEvent = async (event: Partial<AnalyticsEvent>): Promise<void> => {
  try {
    if (!config.enabled) return;

    // Apply sampling if configured
    if (config.samplingRate && config.samplingRate < 1.0) {
      if (Math.random() > config.samplingRate) return;
    }

    // Build complete event with common properties
    const completeEvent: AnalyticsEvent = {
      name: event.name || 'custom_event',
      category: event.category || EventCategory.CUSTOM,
      properties: event.properties || {},
      commonProperties: {
          ...getCommonProperties(),
          ...event.commonProperties,
      },
    };

    // Track with all providers
    const trackPromises: Promise<void>[] = [];
    for (const provider of providers.values()) {
      trackPromises.push(provider.trackEvent(completeEvent));
    }

    // Log event in development
    if (process.env.NODE_ENV as string === 'development') {
    }

    await Promise.all(trackPromises);
  } catch (_error) {
    // Error handling silently ignored
  }
};

/**
 * Track page view
 */
export const trackPageView = async (path: string, title?: string): Promise<void> => {
  try {
    if (!config.enabled) return;

    currentPage = path;

    const pageViewEvent: PageViewEvent = {
      name: 'page_view',
      category: EventCategory.NAVIGATION,
      properties: {
        path,
        title,
        referrer: typeof document !== 'undefined' ? document.referrer : '',
      },
      commonProperties: getCommonProperties(),
    };

    // Track with all providers
    const trackPromises: Promise<void>[] = [];
    for (const provider of providers.values()) {
      trackPromises.push(provider.trackPageView(pageViewEvent));
    }

    // Log page view in development
    if (process.env.NODE_ENV as string === 'development') {
    }

    await Promise.all(trackPromises);
  } catch (_error) {
    // Error handling silently ignored
  }
};

/**
 * Identify user
 */
export const identifyUser = async (id: string, traits?: Record<string, unknown>): Promise<void> => {
  try {
    if (!config.enabled) return;

    userId = id;

    // Update user with all providers
    const identifyPromises: Promise<void>[] = [];
    for (const provider of providers.values()) {
      identifyPromises.push(provider.setUser(id, traits));
    }

    await Promise.all(identifyPromises);

    if (process.env.NODE_ENV as string === 'development') {
    }
  } catch (_error) {
    // Error handling silently ignored
  }
};

/**
 * Reset user
 */
export const resetUser = async (): Promise<void> => {
  try {
    if (!config.enabled) return;

    userId = null;

    // Reset user with all providers
    const resetPromises: Promise<void>[] = [];
    for (const provider of providers.values()) {
      resetPromises.push(provider.reset());
    }

    await Promise.all(resetPromises);

    // Generate new session ID
    sessionId = generateSessionId();

    if (process.env.NODE_ENV as string === 'development') {
    }
  } catch (_error) {
    // Error handling silently ignored
  }
};

/**
 * Track error
 */
export const trackError = async (errorData: {
  errorCode?: string;
  errorMessage: string;
  errorSource?: string;
  stackTrace?: string;
}): Promise<void> => {
  if (!config.enabled || !config.trackErrors) return;

  await trackEvent({
    name: 'error',
    category: EventCategory.ERROR,
    properties: errorData,
  });
};

/**
 * Track performance metric
 */
export const trackPerformance = async (performanceData: {
  metric: string;
  value: number;
  unit?: string;
}): Promise<void> => {
  if (!config.enabled || !config.trackPerformance) return;

  await trackEvent({
    name: 'performance',
    category: EventCategory.PERFORMANCE,
    properties: performanceData,
  });
};

/**
 * Get current configuration
 */
export const getConfig = (): AnalyticsConfig => {
  return { ...config };
};

/**
 * Enable or disable analytics
 */
export const setEnabled = (enabled: boolean): void => {
  config.enabled = enabled;
};

// Export all functions as analyticsAPI object
export const analyticsAPI = {
  initialize,
  registerProvider,
  unregisterProvider,
  trackEvent,
  trackPageView,
  identifyUser,
  resetUser,
  trackError,
  trackPerformance,
  getConfig,
  setEnabled,
};
