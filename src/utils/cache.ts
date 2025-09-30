/**
 * Unified Cache Management System
 * Provides centralized cache operations and management across the application
 */

import { toast } from 'sonner';

// Cache types registry for type-safe cache operations
export enum CacheType {
  IMAGES = 'images',
  LOCATION = 'location',
  USER = 'user',
  QUERIES = 'queries',
  USER_DATA = 'userData',
  AUTH = 'auth',
  APP_STATE = 'appState',
  FORM_DRAFTS = 'formDrafts',
  SOCIAL_LINKS = 'socialLinks',
  ALL = 'all',
}

// Cache storage types
export enum CacheStorage {
  LOCAL_STORAGE = 'localStorage',
  SESSION_STORAGE = 'sessionStorage',
  MEMORY = 'memory',
  INDEXED_DB = 'indexedDB',
  SERVICE_WORKER = 'serviceWorker',
  ALL = 'all',
}

// Cache options interface
export interface CacheOptions {
  expiry?: number | undefined; // Time in ms before cache entry expires
  namespace?: string | undefined; // Optional namespace to prevent key collisions
  version?: number | undefined; // Optional version for cache migrations
  storageType?: CacheStorage | undefined; // Override default storage type for this operation
}

// Cache entry metadata
interface CacheEntryMeta {
  timestamp: number; // When the entry was created/updated
  expiry?: number | undefined; // When the entry expires (if applicable)
  version: number; // Schema version of the data
}

// Cache entry with value and metadata
interface CacheEntry<T> {
  value: T;
  meta: CacheEntryMeta;
}

/**
 * Cache health information interface
 */
export interface CacheHealthInfo {
  quotaExceeded: boolean;
  usagePercent: number;
  availableSpace: number; // in MB
  storageType: CacheStorage;
}

// Helper to detect storage quota errors
export function isQuotaError(error: any): boolean {
  try {
    const msg: string = String(error && (error.message || error.name || error)).toLowerCase();
    return (
      msg.includes('quota') ||
      msg.includes('exceed') ||
      msg.includes('storage') ||
      (typeof error === 'object' && (error.code === 'failed-precondition' || error.name === 'QuotaExceededError'))
    );
  } catch {
    return false;
  }
}

/**
 * Cache provider interface - defines operations for a specific cache implementation
 */
export interface CacheProvider<T = any> {
  get: (key: string, options?: CacheOptions) => T | null;
  set: (key: string, value: T, options?: CacheOptions) => void;
  remove: (key: string, options?: CacheOptions) => void;
  clear: () => Promise<boolean>;
  has: (key: string, options?: CacheOptions) => boolean;
  getKeys: (prefix?: string) => string[];
}

/**
 * Cache registration interface - metadata for registered caches
 */
interface CacheRegistration {
  type: CacheType | string;
  storage: CacheStorage;
  operations: CacheProvider<any>;
  description?: string | undefined;
  priority?: number | undefined; // Higher number = higher priority to keep when storage is limited
}

/**
 * Memory cache implementation using Map
 */
class MemoryCache<T> implements CacheProvider<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private namespace: string;

  constructor(namespace: string = 'default') {
    this.namespace = namespace;
  }

  private getNamespacedKey(key: string, options?: CacheOptions): string {
    const namespace = options?.namespace || this.namespace;
    return `${namespace}:${key}`;
  }

  get(key: string, options?: CacheOptions): T | null {
    const nsKey = this.getNamespacedKey(key, options);
    const entry = this.cache.get(nsKey);

    if (!entry) return null;

    // Check expiry
    if (entry.meta.expiry && Date.now() > entry.meta.expiry) {
      this.cache.delete(nsKey);
      return null;
    }

    return entry.value;
  }

  set(key: string, value: T, options?: CacheOptions): void {
    const nsKey = this.getNamespacedKey(key, options);
    const entry: CacheEntry<T> = {
      value,
      meta: {
        timestamp: Date.now(),
        version: options?.version ?? 1,
          ...(options?.expiry ? { expiry: Date.now() + options.expiry } : {}),
      },
    };

    this.cache.set(nsKey, entry);
  }

  remove(key: string, options?: CacheOptions): void {

    const nsKey = this.getNamespacedKey(key, options);

    this.cache.delete(nsKey);
  }

  async clear(): Promise<boolean> {

    this.cache.clear();

    return true;
  }

  has(key: string, options?: CacheOptions): boolean {
    const nsKey = this.getNamespacedKey(key, options);
    const entry = this.cache.get(nsKey);

    if (!entry) return false;

    // Check expiry
    if (entry.meta.expiry && Date.now() > entry.meta.expiry) {
      this.cache.delete(nsKey);
      return false;
    }

    return true;
  }

  getKeys(prefix?: string): string[] {
    if (!prefix) {
      return Array.from(this.cache.keys());
    }

    return Array.from(this.cache.keys()).filter(key => key.startsWith(prefix));
  }

}

/**
 * LocalStorage cache implementation
 */

class LocalStorageCache<T> implements CacheProvider<T> {
  private namespace: string;

  constructor(namespace: string = 'default') {
    this.namespace = namespace;
  }

  private getNamespacedKey(key: string, options?: CacheOptions): string {
    const namespace = options?.namespace || this.namespace;
    return `${namespace}:${key}`;
  }

  get(key: string, options?: CacheOptions): T | null {
    try {
      const nsKey = this.getNamespacedKey(key, options);
      const item = localStorage.getItem(nsKey);

      if (!item) return null;

      const entry: CacheEntry<T> = JSON.parse(item) as any;

      // Check expiry
      if (entry.meta.expiry && Date.now() > entry.meta.expiry) {
        localStorage.removeItem(nsKey);
        return null;
      }

      // Check version (if specified and doesn't match, treat as cache miss)
      if (options?.version && entry.meta.version !== options.version) {
        return null;
      }

      return entry.value;
    } catch (error) {
      return null;
    }
  }

  set(key: string, value: T, options?: CacheOptions): void {
    try {
      const nsKey = this.getNamespacedKey(key, options);
      const entry: CacheEntry<T> = {
        value,
        meta: {
          timestamp: Date.now(),
          version: options?.version ?? 1,
          ...(options?.expiry ? { expiry: Date.now() + options.expiry } : {}),
        },
      };

      localStorage.setItem(nsKey, JSON.stringify(entry));
    } catch (error) {
      // Handle quota exceeded errors
      if (isQuotaError(error)) {
        console.warn('Cache quota exceeded, clearing old data');
        this.handleQuotaExceeded().catch(err =>
          console.error('Failed to handle quota exceeded:', err)
        );
      } else {
        console.error('Cache error:', error);
      }
    }

  }

  remove(key: string, options?: CacheOptions): void {

    try {

      const nsKey = this.getNamespacedKey(key, options);

      localStorage.removeItem(nsKey);

    } catch (error) {}
  }

  async clear(): Promise<boolean> {

    try {

      const keys = this.getKeys();

      keys.forEach(key => {
        localStorage.removeItem(key);

      });

      return true;

    } catch (error) {
      return false;
    }
  }

  has(key: string, options?: CacheOptions): boolean {
    try {
      const nsKey = this.getNamespacedKey(key, options);
      const item = localStorage.getItem(nsKey);

      if (!item) return false;

      const entry: CacheEntry<T> = JSON.parse(item) as any;

      // Check expiry
      if (entry.meta.expiry && Date.now() > entry.meta.expiry) {
        localStorage.removeItem(nsKey);
        return false;
      }

      // Check version (if specified and doesn't match, consider not available)
      if (options?.version && entry.meta.version !== options.version) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  getKeys(prefix?: string): string[] {
    const keys: string[] = [];
    const namespacePrefix = prefix || this.namespace + ':';

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(namespacePrefix)) {
        keys.push(key);
      }
    }

    return keys;
  }

  // Handle quota exceeded error by clearing older entries

  private async handleQuotaExceeded(): Promise<void> {

    try {
      // Get all keys for this namespace

      const keys = this.getKeys();

      if (keys.length === 0) return;

      // Get all entries with their timestamp

      const entries = keys
        .map(key => {
          try {
            const item = localStorage.getItem(key);
            if (!item) return null;

            const entry = JSON.parse(item) as any;
            return {
              key,
              timestamp: entry.meta.timestamp,
            };
          } catch (e) {
            return null;
          }
        })
        .filter(Boolean)

        .sort((a, b) => a!.timestamp - b!.timestamp);

      // Remove oldest 25% of entries

      const removeCount = Math.max(1, Math.floor(entries.length * 0.25));

      for (let i = 0; i < removeCount; i++) {
        if (entries[i]) {
          localStorage.removeItem(entries[i]!.key);
        }
      }

    } catch (error) {}

  }

}

/**
 * SessionStorage cache implementation
 */
class SessionStorageCache<T> implements CacheProvider<T> {
  private namespace: string;

  constructor(namespace: string = 'default') {
    this.namespace = namespace;
  }

  private getNamespacedKey(key: string, options?: CacheOptions): string {
    const namespace = options?.namespace || this.namespace;
    return `${namespace}:${key}`;
  }

  get(key: string, options?: CacheOptions): T | null {
    try {
      const nsKey = this.getNamespacedKey(key, options);
      const item = sessionStorage.getItem(nsKey);

      if (!item) return null;

      const entry: CacheEntry<T> = JSON.parse(item) as any;

      // Check expiry
      if (entry.meta.expiry && Date.now() > entry.meta.expiry) {
        sessionStorage.removeItem(nsKey);
        return null;
      }

      return entry.value;
    } catch (error) {
      return null;
    }
  }

  set(key: string, value: T, options?: CacheOptions): void {
    try {
      const nsKey = this.getNamespacedKey(key, options);
      const entry: CacheEntry<T> = {
        value,
        meta: {
          timestamp: Date.now(),
          version: options?.version ?? 1,
          ...(options?.expiry ? { expiry: Date.now() + options.expiry } : {}),
        },
      };

      sessionStorage.setItem(nsKey, JSON.stringify(entry));
    } catch (error) {}
  }

  remove(key: string, options?: CacheOptions): void {

    try {

      const nsKey = this.getNamespacedKey(key, options);

      sessionStorage.removeItem(nsKey);

    } catch (error) {}
  }

  async clear(): Promise<boolean> {

    try {

      const keys = this.getKeys();

      keys.forEach(key => {
        sessionStorage.removeItem(key);

      });

      return true;

    } catch (error) {
      return false;
    }
  }

  has(key: string, options?: CacheOptions): boolean {
    try {
      const nsKey = this.getNamespacedKey(key, options);
      const item = sessionStorage.getItem(nsKey);

      if (!item) return false;

      const entry: CacheEntry<T> = JSON.parse(item) as any;

      // Check expiry
      if (entry.meta.expiry && Date.now() > entry.meta.expiry) {
        sessionStorage.removeItem(nsKey);
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  getKeys(prefix?: string): string[] {
    const keys: string[] = [];
    const namespacePrefix = prefix || this.namespace + ':';

    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(namespacePrefix)) {
        keys.push(key);
      }
    }

    return keys;
  }

}

// Cache registry for tracking specialized caches
const cacheRegistry: Record<string, CacheRegistration> = {};

/**
 * Creates a cache with the specified type and storage mechanism
 * @template T The data type to be stored in the cache
 * @param cacheType The type of cache (used for registration and management)
 * @param storageType The storage mechanism to use
 * @param namespace Optional namespace to prevent key collisions
 * @returns A cache provider for the specified type
 */

export function createCache<T>(
  cacheType: CacheType | string,
  storageType: CacheStorage = CacheStorage.LOCAL_STORAGE,
  namespace?: string
): CacheProvider<T> {
  const cacheNamespace = namespace || cacheType.toString();
  let cache: CacheProvider<T>;

  switch (storageType) {
    case CacheStorage.LOCAL_STORAGE:
      cache = new LocalStorageCache<T>(cacheNamespace);
      break;
    case CacheStorage.SESSION_STORAGE:
      cache = new SessionStorageCache<T>(cacheNamespace);
      break;
    case CacheStorage.MEMORY:
    default:
      cache = new MemoryCache<T>(cacheNamespace);
      break;
  }

  // Register the cache
  registerCacheProvider(cacheType, cache, storageType);

  return cache;
}

/**
 * Register a cache provider with the cache management system
 *
 * @param cacheType A unique identifier for the cache
 * @param provider The cache provider implementation
 * @param storageType The storage mechanism used
 * @param description Optional description of the cache's purpose
 */
export function registerCacheProvider<T>(
  cacheType: CacheType | string,
  provider: CacheProvider<T>,
  storageType: CacheStorage,
  description?: string
): void {
  cacheRegistry[cacheType] = {
    type: cacheType,
    storage: storageType,
    operations: provider,
    description,
  };
}

/**
 * Get a registered cache provider
 *
 * @param cacheType The cache type to retrieve
 * @returns The cache provider or undefined if not found
 */
export function getCacheProvider<T>(cacheType: CacheType | string): CacheProvider<T> | undefined {
  return cacheRegistry[cacheType]?.operations as CacheProvider<T> | undefined;
}

/**
 * Clears images from the cache to free up storage
 *
 * @param silent Whether to show toast notifications
 * @returns Promise resolving to boolean indicating success
 */
export const clearImagesCache = async (silent: boolean = false): Promise<boolean> => {
  try {
    // Find all image elements and remove their src attribute
    const images = document.querySelectorAll('img') as NodeListOf<HTMLElement>;
    images.forEach(img => {
      img.removeAttribute('src');
    });

    // Clear the browser's cache for images
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter(name => name.includes('image') || name.includes('supabase-storage'))
          .map(name => caches.delete(name))
      );
    }

    if (!silent) {
      toast.success('Images cache cleared successfully');
    }

    return true;
  } catch (error) {
    if (!silent) {
      toast.error('Failed to clear images cache');
    }
    return false;
  }
};

/**
 * Clears old query results from cache
 *
 * @param silent Whether to show toast notifications
 * @returns Promise resolving to boolean indicating success
 */
export const clearOldQueries = async (silent: boolean = false): Promise<boolean> => {
  try {
    // Remove old query parameters from the URL
    const url = new URL(window.location.href);
    let paramsChanged = false;

    for (const key of url.searchParams.keys()) {
      if (key.startsWith('oldQueryParam') || key.includes('cache') || key.includes('temp')) {
        url.searchParams.delete(key);
        paramsChanged = true;
      }
    }

    if (paramsChanged) {
      window.history.replaceState({}, '', url.toString());
    }

    // Clear query cache from localStorage
    const queryCache = getCacheProvider(CacheType.QUERIES);
    if (queryCache) {
      await queryCache.clear();
    } else {
      // Fallback for older code
      (Object.keys(localStorage) as string[]).forEach(key => {
        if (key.includes('query') || key.includes('cache') || key.includes('temp')) {
          localStorage.removeItem(key);
        }
      });
    }

    if (!silent) {
      toast.success('Old queries cache cleared successfully');
    }
    return true;
  } catch (error) {
    if (!silent) {
      toast.error('Failed to clear queries cache');
    }
    return false;
  }
};

/**
 * Clears all cache data
 *
 * @param silent Whether to show toast notifications
 * @returns Promise resolving to boolean indicating success
 */
export const clearAllCache = async (silent: boolean = false): Promise<boolean> => {
  try {
    // Clear storages
    localStorage.clear();
    sessionStorage.clear();
    // Clear caches API if available
    if ('caches' in window) {
      const cacheKeys = await caches.keys();
      await Promise.all(cacheKeys.map(key => caches.delete(key)));
    }
    if (!silent) {
      toast.success('All cache cleared successfully');
    }
    return true;
  } catch (_e) {
    if (!silent) {
      toast.error('Failed to clear all cache');
    }
    return false;
  }
};

// Initialize default caches
const initializeDefaultCaches = () => {
  createCache(CacheType.USER, CacheStorage.LOCAL_STORAGE);
  createCache(CacheType.LOCATION, CacheStorage.LOCAL_STORAGE);
  createCache(CacheType.QUERIES, CacheStorage.LOCAL_STORAGE);
  createCache(CacheType.FORM_DRAFTS, CacheStorage.LOCAL_STORAGE);
  createCache(CacheType.SOCIAL_LINKS, CacheStorage.LOCAL_STORAGE);
};

// Initialize default caches when this module is imported
initializeDefaultCaches();

/**
 * Get cache health status
 * @returns Cache health information
 */
export function getCacheHealthStatus(): CacheHealthInfo {
  try {
    const estimate = navigator.storage?.estimate;
    if (estimate) {
      estimate().then(({ quota, usage }) => {
        const quotaExceeded = usage && quota ? usage / quota > 0.9 : false;
        const usagePercent = usage && quota ? (usage / quota) * 100 : 0;
        const availableSpace = quota ? (quota - (usage || 0)) / (1024 * 1024) : 0;

        return {
          quotaExceeded,
          usagePercent,
          availableSpace,
          storageType: CacheStorage.LOCAL_STORAGE,
        };
      });
    }

    // Fallback for browsers without storage API
    return {
      quotaExceeded: false,
      usagePercent: 0,
      availableSpace: 100, // Assume 100MB available
      storageType: CacheStorage.LOCAL_STORAGE,
    };
  } catch (error) {
    return {
      quotaExceeded: false,
      usagePercent: 0,
      availableSpace: 100,
      storageType: CacheStorage.LOCAL_STORAGE,
    };
  }
}

/**
 * Clear non-essential cache data
 * @returns Promise resolving to boolean indicating success
 */
export async function clearNonEssentialCache(): Promise<boolean> {
  try {
    // Clear images and old queries but preserve user data
    await clearImagesCache(true);
    await clearOldQueries(true);

    // Clear non-essential localStorage keys
    const keysToKeep = ['user:', 'auth:', 'settings:'];

    (Object.keys(localStorage) as string[]).forEach(key => {
      const shouldKeep = keysToKeep.some(keepKey => key.startsWith(keepKey));
      if (!shouldKeep) {
        localStorage.removeItem(key);
      }
    });

    return true;
  } catch (error) {
    console.error('Failed to clear non-essential cache:', error);
    return false;
  }
}
