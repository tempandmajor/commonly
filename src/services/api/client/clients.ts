/**
 * API Client Service - Specialized Clients
 *
 * This file provides pre-configured API clients for different API endpoints
 * used throughout the application.
 */

import { ApiClient } from './apiClient';
import { supabaseRestClient } from './supabaseClient';
import { ApiError, ApiErrorType } from '../core/types';

// Base client for all API requests
export const baseClient = new ApiClient({
  // Default behavior for all API requests
  defaultTimeout: 30000,
  withCredentials: true,
  handleErrors: true,
  parseJson: true,
  // Minimal request interceptor to ensure Headers instance and consistent content-type
  requestInterceptors: [
    (url, options) => {
      const headers =
        options.headers instanceof Headers ? options.headers : new Headers(options.headers);
      if (!headers.get('Accept')) headers.set('Accept', 'application/json');
      return { url, options: { ...options, headers } };
    },
  ],
  // Add retry logic for network errors
  retryConfig: {
    maxRetries: 3,
    retryDelay: 1000, // 1 second initial delay
    retryBackoff: 2, // Exponential backoff multiplier
    retryCondition: (error: ApiError) => {
      return (
        error.type === ApiErrorType.NETWORK_ERROR ||
        (typeof error.status === 'number' && error.status >= 500)
      );
    },
  },
});

// Main application API client
export const appClient = new ApiClient({
  // App-specific client for core API endpoints
  baseUrl: process.env.NEXT_PUBLIC_API_U as string || '/api',
  defaultTimeout: 30000,
  withCredentials: true,
  handleErrors: true,
  parseJson: true,
  // Cache GET requests by default
  useCache: true,
  cacheTtl: 60000, // 1 minute cache
  defaultHeaders: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  // Add performance monitoring via interceptors with environment guards
  requestInterceptors: [
    (url, options) => {
      if (typeof performance !== 'undefined' && typeof performance.mark === 'function') {
        try {
          performance.mark(`api-request-${url}-start`);
        } catch {}
      }
      return { url, options };
    },
  ],
  responseInterceptors: [
    response => {
      const url = response.url;
      if (
        url &&
        typeof performance !== 'undefined' &&
        typeof performance.mark === 'function' &&
        typeof performance.measure === 'function'
      ) {
        try {
          performance.mark(`api-request-${url}-end`);
          performance.measure(
            `API Request: ${url}`,
            `api-request-${url}-start`,
            `api-request-${url}-end`
          );
        } catch {}
      }
      return { response };
    },
  ],
  enablePerformanceMonitoring: true,
});

// Export the supabaseRestClient from the dedicated module
export { supabaseRestClient };

// External services client (no credentials)
export const externalClient = new ApiClient({
  defaultTimeout: 10000,
  withCredentials: false,
  handleErrors: true,
  parseJson: true,
  useCache: true,
  cacheTtl: 300000, // 5 minutes cache for external APIs
  requestInterceptors: [
    (url, options) => {
      const headers =
        options.headers instanceof Headers ? options.headers : new Headers(options.headers);
      if (!headers.get('Accept')) headers.set('Accept', 'application/json');
      return { url, options: { ...options, headers } };
    },
  ],
});

// Analytics client (optimized for non-blocking analytics calls)
export const analyticsClient = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_ANALYTICS_U as string || '/api/analytics',
  defaultTimeout: 5000, // Short timeout for analytics
  withCredentials: true,
  handleErrors: false, // Don't throw errors for analytics failures
  parseJson: true,
  // Don't block the UI for analytics errors
  requestInterceptors: [(url, options) => ({ url, options })],
});

/**
 * Create a custom API client with specific configuration
 */
export function createApiClient(config = {}) {
  return new ApiClient(config);
}
