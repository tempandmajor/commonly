/**
 * Cache utilities for community service
 */

/**
 * Generate a cache key for community search parameters
 */
export const generateCacheKey = (params: Record<string, any>): string => {
  return JSON.stringify(params);
};

/**
 * In-memory cache for community data
 * Used to reduce database calls for frequently accessed data
 */
class CommunityCache {
  private cache: Map<string, { data: any; timestamp: number }>;
  private readonly TTL: number; // Time to live in milliseconds

  constructor(ttlMinutes: number = 5) {
    this.cache = new Map();
    this.TTL = ttlMinutes * 60 * 1000;
  }

  /**
   * Get an item from the cache
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // Check if the item has expired
    if (Date.now() - item.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  /**
   * Set an item in the cache
   */
  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Remove an item from the cache
   */
  remove(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all items from the cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear all expired items from the cache
   */
  clearExpired(): void {
    const now = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.TTL) {
        this.cache.delete(key);
      }
    }
  }
}

// Export a singleton instance
export const communityCache = new CommunityCache();
