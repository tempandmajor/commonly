/**
 * Location API - Compatibility Layer
 *
 * This file provides backward compatibility with the original locationAPI.ts
 * while using the new consolidated API implementation.
 *
 * @deprecated Use the consolidated API from '@/services/api/location' instead
 */

import * as LocationAPI from '../location';

/**
 * @deprecated Use LocationAPI.fetchEventsNearLocation instead
 */
export const fetchEventsNearLocation = LocationAPI.fetchEventsNearLocation;

/**
 * @deprecated Use LocationAPI.fetchPopularLocations instead
 */
export const fetchPopularLocations = LocationAPI.fetchPopularLocations;

/**
 * @deprecated Use LocationAPI.saveUserLocation instead
 */
export const saveUserLocation = LocationAPI.saveUserLocation;

// Export all functions as default for legacy imports
export default {
  fetchEventsNearLocation,
  fetchPopularLocations,
  saveUserLocation,
};
