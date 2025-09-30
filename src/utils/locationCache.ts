import { openDB, DBSchema } from 'idb';
import {
  clearAllCache,
  isQuotaError,
  clearImagesCache,
  clearOldQueries,
  getCacheHealthStatus,
} from '@/utils/cache';

// Define the database structure
interface LocationDB extends DBSchema {
  locations: {
    key: string;
    value: LocationInfo;
  };
  addresses: {
    key: string;
    value: AddressLocationInfo;
  };
}

// Define the location info structure
export interface LocationInfo {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number | undefined;
  formatted_address?: string | undefined;
  lastAccessed?: number | undefined;
  city?: string | undefined| null;
  state?: string | undefined| null;
  country?: string | undefined| null;
}

// Extended location info that includes address-specific details
export interface AddressLocationInfo extends LocationInfo {
  address: string;
}

// Re-export the LocationInfo type for backward compatibility
export type { LocationInfo as CachedLocationInfo };

// Location database name and version
const DB_NAME = 'location-cache';
const DB_VERSION = 1;

// Expiry time for cached locations (24 hours)
const LOCATION_CACHE_EXPIRY = 24 * 60 * 60 * 1000;

/**
 * Open the location database
 */
async function openLocationDB() {
  return openDB<LocationDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('locations')) {
        db.createObjectStore('locations');
      }
      if (!db.objectStoreNames.contains('addresses')) {
        db.createObjectStore('addresses');
      }
    },
  });
}

/**
 * Save a location to the cache
 */
export async function cacheLocation(key: string, locationInfo: LocationInfo): Promise<void> {
  try {
    const db = await openLocationDB();
    await db.put(
      'locations',
      {
          ...locationInfo,
        lastAccessed: Date.now(),
      },
      key
    );
  } catch (err) {
    if (isQuotaError(err)) {
      await clearLocationCache();
    }
  }
}

/**
 * Alias for cacheLocation to maintain API compatibility
 */
export const cacheLocationData = cacheLocation;

/**
 * Get a location from the cache
 * @returns The location info or null if not found or expired
 */
export async function getCachedLocation(key: string): Promise<LocationInfo | null> {
  try {
    const db = await openLocationDB();
    const location = await db.get('locations', key);

    if (!location) {
      return null;
    }

    // Check if the location is expired
    const now = Date.now();
    if (now - location.timestamp > LOCATION_CACHE_EXPIRY) {
      await db.delete('locations', key);
      return null;
    }

    // Update the last accessed timestamp
    await db.put(
      'locations',
      {
          ...location,
        lastAccessed: now,
      },
      key
    );

    return location;
  } catch (err) {
    return null;
  }
}

/**
 * Alias for getCachedLocation to maintain API compatibility
 */
export const getLocationFromCache = getCachedLocation;

/**
 * Save a location by address to the cache
 */
export async function cacheLocationByAddress(
  address: string,
  locationInfo: AddressLocationInfo
): Promise<void> {
  try {
    const db = await openLocationDB();
    await db.put(
      'addresses',
      {
          ...locationInfo,
        address,
        lastAccessed: Date.now(),
      },
      address.toLowerCase().trim()
    );
  } catch (err) {
    if (isQuotaError(err)) {
      await clearLocationCache();
    }
  }
}

/**
 * Get a location from the cache by address
 */
export async function getLocationFromAddressCache(
  address: string
): Promise<AddressLocationInfo | null> {
  try {
    const db = await openLocationDB();
    const location = await db.get('addresses', address.toLowerCase().trim());

    if (!location) {
      return null;
    }

    // Check if the location is expired
    const now = Date.now();
    if (now - location.timestamp > LOCATION_CACHE_EXPIRY) {
      await db.delete('addresses', address.toLowerCase().trim());
      return null;
    }

    // Update the last accessed timestamp
    await db.put(
      'addresses',
      {
          ...location,
        lastAccessed: now,
      },
      address.toLowerCase().trim()
    );

    return location;
  } catch (err) {
    return null;
  }
}

/**
 * Clear all cached locations
 */
export async function clearLocationCache(): Promise<void> {
  try {
    const db = await openLocationDB();
    await db.clear('locations');
    await db.clear('addresses');
  } catch (err) {}
}

/**
 * Clear expired locations from the cache
 */
export async function clearExpiredLocations(): Promise<void> {
  try {
    const db = await openLocationDB();
    const now = Date.now();
    const expiryTime = now - LOCATION_CACHE_EXPIRY;

    const tx = db.transaction('locations', 'readwrite');
    const store = tx.objectStore('locations');

    const keys = await store.getAllKeys();

    for (const key of keys) {
      const location = await store.get(key);
      if (location && location.timestamp < expiryTime) {
        await store.delete(key);
      }
    }

    await tx.done;

    // Also clear expired addresses
    const txAddr = db.transaction('addresses', 'readwrite');
    const addrStore = txAddr.objectStore('addresses');

    const addrKeys = await addrStore.getAllKeys();

    for (const key of addrKeys) {
      const location = await addrStore.get(key);
      if (location && location.timestamp < expiryTime) {
        await addrStore.delete(key);
      }
    }

    await txAddr.done;
  } catch (err) {}
}

/**
 * Generate a cache key for a location
 */
export function generateLocationCacheKey(latitude: number, longitude: number): string {
  // Round coordinates to 4 decimal places (about 11 meters precision)
  const lat = Math.round(latitude * 10000) / 10000;
  const lng = Math.round(longitude * 10000) / 10000;
  return `${lat},${lng}`;
}

/**
 * Get the location cache status
 */
export async function getLocationCacheStatus(): Promise<{
  count: number;
  oldestTimestamp: number | null;
  newestTimestamp: number | null;
  size: number;
}> {
  try {
    const db = await openLocationDB();
    const locations = await db.getAll('locations');

    if (locations.length === 0) {
      return {
        count: 0,
        oldestTimestamp: null,
        newestTimestamp: null,
        size: 0,
      };
    }

    let oldestTimestamp = Infinity;
    let newestTimestamp = 0;
    let totalSize = 0;

    locations.forEach(location => {
      oldestTimestamp = Math.min(oldestTimestamp, location.timestamp);
      newestTimestamp = Math.max(newestTimestamp, location.timestamp);

      // Estimate size in bytes (rough approximation)
      totalSize += JSON.stringify(location).length * 2;
    });

    return {
      count: locations.length,
      oldestTimestamp: oldestTimestamp === Infinity ? null : oldestTimestamp,
      newestTimestamp: newestTimestamp === 0 ? null : newestTimestamp,
      size: totalSize,
    };
  } catch (err) {
    return {
      count: 0,
      oldestTimestamp: null,
      newestTimestamp: null,
      size: 0,
    };
  }
}

// Re-export cache utilities for backward compatibility
export { clearAllCache, isQuotaError, clearImagesCache, clearOldQueries };
