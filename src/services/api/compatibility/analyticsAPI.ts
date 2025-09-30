/**
 * Analytics API - Compatibility Layer
 *
 * This file provides backward compatibility with the original analyticsAPI.ts
 * while using the new consolidated API implementation.
 *
 * @deprecated Use the consolidated API from '@/services/api/analytics' instead
 */

import * as AnalyticsAPI from '../analytics';

/**
 * @deprecated Use AnalyticsAPI.getPerformanceMetrics instead
 */
export const getPerformanceMetrics = AnalyticsAPI.getPerformanceMetrics;

/**
 * @deprecated Use AnalyticsAPI.getServiceMetrics instead
 */
export const getServiceMetrics = AnalyticsAPI.getServiceMetrics;

// Export all functions as default for legacy imports
export default {
  getPerformanceMetrics,
  getServiceMetrics,
};
