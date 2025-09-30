/**
 * Supabase Type Utilities
 *
 * Helper types and utilities to handle Supabase query type inference issues
 */

import type { PostgrestError } from '@supabase/supabase-js';

/**
 * Type guard to check if a value is a valid data result (not an error type)
 */
export function isValidData<T>(data: T | { error: true } | null | undefined): data is T {
  if (data === null || data === undefined) return false;
  if (typeof data === 'object' && 'error' in data && data.error === true) return false;
  return true;
}

/**
 * Type-safe result wrapper for Supabase queries
 */
export type SupabaseResult<T> = {
  data: T | null;
  error: PostgrestError | null;
};

/**
 * Extract valid data from Supabase query result
 */
export function extractData<T>(result: { data: T | any; error: PostgrestError | null }): T | null {
  if (result.error) return null;
  if (!result.data) return null;
  if (typeof result.data === 'object' && 'error' in result.data && result.data.error === true) {
    return null;
  }
  return result.data as T;
}

/**
 * Type assertion for Supabase query results when type inference fails
 */
export function assertQueryData<T>(data: unknown): T | null {
  if (data === null || data === undefined) return null;
  if (typeof data === 'object' && 'error' in data && (data as any).error === true) {
    return null;
  }
  return data as T;
}

/**
 * Type assertion for array query results
 */
export function assertQueryArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) {
    return data.filter(item => {
      if (typeof item === 'object' && item !== null && 'error' in item && (item as any).error === true) {
        return false;
      }
      return true;
    }) as T[];
  }
  return [];
}

/**
 * Safe access to Supabase query data with fallback
 */
export function safeQueryData<T>(
  data: T | any | null | undefined,
  fallback: T
): T {
  if (!data) return fallback;
  if (typeof data === 'object' && 'error' in data && (data as any).error === true) {
    return fallback;
  }
  return data as T;
}

/**
 * Safe access to array query data with fallback
 */
export function safeQueryArray<T>(
  data: T[] | any | null | undefined
): T[] {
  if (!data) return [];
  if (!Array.isArray(data)) return [];
  return data.filter(item => {
    if (typeof item === 'object' && item !== null && 'error' in item && (item as any).error === true) {
      return false;
    }
    return true;
  }) as T[];
}