/**
 * Cache utilities for the Event Service
 *
 * This file provides caching mechanisms to improve performance
 * by reducing database calls for frequently accessed data.
 */

import { Event, EventSearchResult } from '../types';

/**
 * Simple in-memory cache implementation
 */
class Cache<T> {
  private cache: Map<string, { data: T; timestamp: number }>;
  private ttl: number; // Time to live in milliseconds

  /**
   * Create a new cache
   * @param ttlMinutes - Cache time to live in minutes
   */
  constructor(ttlMinutes: number = 5) {
    this.cache = new Map();
    this.ttl = ttlMinutes * 60 * 1000;
  }

  /**
   * Get an item from the cache
   * @param key - Cache key
   * @returns Cached item or undefined if not found or expired
   */
  get(key: string): T | undefined {
    const item = this.cache.get(key);

    if (!item) {
      return undefined;
    }

    // Check if the item has expired
    if (Date.now() - item.timestamp > this.ttl) {
      this.delete(key);
      return undefined;
    }

    return item.data;
  }

  /**
   * Set an item in the cache
   * @param key - Cache key
   * @param data - Data to cache
   */
  set(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Delete an item from the cache
   * @param key - Cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all items from the cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get all keys in the cache
   * @returns Array of cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get the number of items in the cache
   * @returns Cache size
   */
  size(): number {
    return this.cache.size;
  }
}

// Create cache instances for different types of data
export const eventCache = new Cache<Event>(5); // 5 minutes TTL
export const searchCache = new Cache<EventSearchResult>(2); // 2 minutes TTL
export const upcomingEventsCache = new Cache<Event[]>(10); // 10 minutes TTL
export const featuredEventsCache = new Cache<Event[]>(10); // 10 minutes TTL

/**
 * Generate a cache key for search results
 * @param params - Parameters that define the search
 * @returns Cache key
 */
export function generateSearchCacheKey(params: Record<string, any>): string {
  return `search:${JSON.stringify(params)}`;
}

/**
 * Clear all event-related caches
 */
export function clearAllCaches(): void {
  eventCache.clear();
  searchCache.clear();
  upcomingEventsCache.clear();
  featuredEventsCache.clear();
}

/**
 * Clear cache for a specific event and related searches
 * @param eventId - ID of the event to clear from cache
 */
export function clearEventCache(eventId: string): void {
  // Clear the specific event
  eventCache.delete(eventId);

  // Clear search caches as they might contain the event
  searchCache.clear();
  upcomingEventsCache.clear();
  featuredEventsCache.clear();
}
