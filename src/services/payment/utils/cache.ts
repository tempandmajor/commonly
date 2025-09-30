/**
 * Payment Service Cache Utilities
 *
 * This file contains utilities for caching payment data.
 */

import { PaymentMethod, Customer } from '../types';

/**
 * Default TTL for cache items (5 minutes)
 */
const DEFAULT_TTL = 5 * 60 * 1000;

/**
 * Interface for cache items with TTL
 */
interface CacheItem<T> {
  value: T;
  expiry: number;
}

/**
 * Generic cache class with TTL support
 */
class Cache<T> {
  private cache: Map<string, CacheItem<T>>;
  private defaultTtl: number;

  constructor(ttl = DEFAULT_TTL) {
    this.cache = new Map();
    this.defaultTtl = ttl;
  }

  /**
   * Set a value in the cache with optional TTL
   *
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time to live in milliseconds (optional)
   */
  set(key: string, value: T, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.defaultTtl);
    this.cache.set(key, { value, expiry });
  }

  /**
   * Get a value from the cache
   *
   * @param key - Cache key
   * @returns Cached value or undefined if not found or expired
   */
  get(key: string): T | undefined {
    const item = this.cache.get(key);

    // Return undefined if item doesn't exist or is expired
    if (!item || Date.now() > item.expiry) {
      if (item) {
        this.cache.delete(key); // Clean up expired item
      }
      return undefined;
    }

    return item.value;
  }

  /**
   * Check if a key exists in the cache and is not expired
   *
   * @param key - Cache key
   * @returns True if key exists and is not expired
   */
  has(key: string): boolean {
    const item = this.cache.get(key);

    if (!item || Date.now() > item.expiry) {
      if (item) {
        this.cache.delete(key); // Clean up expired item
      }
      return false;
    }

    return true;
  }

  /**
   * Delete a key from the cache
   *
   * @param key - Cache key
   * @returns True if key was deleted
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all items from the cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get all valid keys in the cache
   *
   * @returns Array of valid keys
   */
  keys(): string[] {
    const now = Date.now();
    const validKeys: string[] = [];

    this.cache.forEach((item, key) => {
      if (now <= item.expiry) {
        validKeys.push(key);
      } else {
        this.cache.delete(key); // Clean up expired item
      }
    });

    return validKeys;
  }

  /**
   * Get the number of valid items in the cache
   *
   * @returns Number of valid items
   */
  size(): number {
    return this.keys().length;
  }
}

/**
 * Cache for payment methods by user ID
 */
export const paymentMethodCache = new Cache<PaymentMethod[]>();

/**
 * Cache for customers by user ID
 */
export const customerCache = new Cache<Customer>();

/**
 * Clear all payment caches
 */
export const clearCaches = (): void => {
  paymentMethodCache.clear();
  customerCache.clear();
};

/**
 * Generate a cache key for payment data
 *
 * @param prefix - Key prefix
 * @param parts - Key parts
 * @returns Cache key
 */
export const generateCacheKey = (
  prefix: string,
          ...parts: (string | number | undefined)[]
): string => {
  const validParts = parts.filter(part => part !== undefined && part !== null);
  return `${prefix}:${validParts.join(':')}`;
};
