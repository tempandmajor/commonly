/**
 * API Client Service
 *
 * This file exports the unified API client service API and related types.
 *
 * New code should use the exported API objects directly:
 * import { appClient } from '@/services/api';
 * import { getPerformanceMetrics } from '@/services/api/analytics';
 *
 * Legacy code can continue to use the compatibility exports:
 * import { ApiService } from '@/services/api';
 */

// Export main API client class
export { ApiClient } from './client/apiClient';

// Export pre-configured clients
export {
  appClient,
  baseClient,
  supabaseRestClient,
  externalClient,
  analyticsClient,
  createApiClient,
} from './client/clients';

// Export hooks
export {
  useApiGet,
  useApiPost,
  useApiPut,
  useApiPatch,
  useApiDelete,
  useApiRequest,
} from './hooks/useApi';

// Export types
export * from './core/types';

// Export utilities
export {
  addQueryParams,
  fetchPaginatedData,
  batchRequests,
  debounceRequest,
  handleApiError,
  createFormData,
} from './utils/apiUtils';

// Export consolidated API modules
export * as AnalyticsAPI from './analytics';
export * as LocationAPI from './location';
export * as ManagementAPI from './management';

// Export compatibility layers for legacy code
export {
  ApiService,
  ExternalApiService,
  default as LegacyApiService,
} from './compatibility/apiService';

// Export legacy API compatibility layers
export * as AnalyticsAPILegacy from './compatibility/analyticsAPI';
export * as LocationAPILegacy from './compatibility/locationAPI';
export * as ManagementAPILegacy from './compatibility/managementAPI';
