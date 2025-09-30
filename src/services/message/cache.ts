/**
 * Message service cache
 * Provides a simple cache for message service operations
 */

class MessageCache {
  private cache = new Map<string, { data: unknown; timestamp: number }>();
  private readonly DEFAULT_TTL = 60 * 1000; // 60 seconds

  /**
   * Get an item from cache
   * @param key - Cache key
   * @param ttl - Optional custom TTL in milliseconds
   * @returns Cached item or null if not found/expired
   */
  get<T>(key: string, ttl = this.DEFAULT_TTL): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data as T;
    }
    return null;
  }

  /**
   * Set an item in cache
   * @param key - Cache key
   * @param data - Data to cache
   * @param ttl - Optional custom TTL in seconds (defaults to 60)
   */
  set(key: string, data: unknown, ttlSeconds = 60): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });

    // Set expiration to automatically clean up
    if (ttlSeconds > 0) {
      setTimeout(() => {
        this.invalidate(key);
      }, ttlSeconds * 1000);
    }
  }

  /**
   * Invalidate a specific cache entry
   * @param key - Cache key to invalidate
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all cache entries that match a prefix
   * @param prefix - Prefix to match against keys
   */
  invalidateByPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear();
  }
}

// Export a singleton instance
export const cache = new MessageCache();
