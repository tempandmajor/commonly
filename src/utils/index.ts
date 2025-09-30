export * from './dates';
export * from './errorHandling';
export * from './logger';
export * from './cache';
export * from './apiUtils';
export * from './serviceCheck';

// Export currency utilities
export { formatCurrency, parseCurrency, formatPercentage } from './currency';

// Export location cache utilities
export {
  cacheLocation,
  getCachedLocation,
  clearLocationCache,
  getLocationFromAddressCache,
  cacheLocationByAddress,
  clearExpiredLocations,
  // Aliases for backward compatibility
  cacheLocation as cacheLocationData,
  getCachedLocation as getLocationFromCache,
  clearExpiredLocations as clearExpiredLocationCache,
} from './locationCache';

// Remove these exports as they don't exist
// export * from './monitoring';
// export * from './errorHandling/performanceMonitoring';
export * from './errorReporting';
export * from './errorUtils';
// Export error handling from new centralized module
export {
  handlePageError,
  fetchWithErrorHandling,
  setPageMetadata,
  trackPageView,
  createRetryHandler,
} from './errorHandling';

export * from './format';
