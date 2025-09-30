/**
 * Analytics Service
 *
 * This file exports the unified analytics service API, hooks, and related types.
 *
 * New code should use the exported API objects directly:
 * import { analyticsAPI, useAnalytics } from '@/services/analytics';
 *
 * Legacy code can continue to use the compatibility exports:
 * import { AnalyticsService } from '@/services/analytics';
 */

// Export the consolidated API
export { analyticsAPI } from './api/analyticsAPI';

// Export hooks
export { useAnalytics, useTrackComponentVisibility } from './hooks/useAnalytics';

// Export types
export * from './core/types';

// Export utilities
export { getDeviceInfo, getDeviceType } from './utils/deviceInfo';

// Export compatibility layers for legacy code
export {
  AnalyticsService,
  UserEventService,
  ContentTrackingService,
  default as LegacyAnalyticsService,
} from './compatibility/analyticsService';
