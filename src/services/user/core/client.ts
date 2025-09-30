/**
 * @file Client integrations for the user service
 */

import { supabase as supabaseClient } from '@/integrations/supabase/client';
import { UserProfile } from './types';
import { CACHE_TTL } from './constants';

// Re-export supabase client for convenience
export const supabase = supabaseClient;

// In-memory cache for frequently accessed data
const cache = {
  profiles: new Map<string, { data: UserProfile; timestamp: number }>(),
  settings: new Map<string, { data: unknown; timestamp: number }>(),
};

/**
 * Get a user profile from the cache or database
 * @param userId User ID
 * @returns User profile data or null
 */
export async function getUserProfileFromDB(userId: string): Promise<UserProfile | null> {
  // Check cache first
  const cachedProfile = cache.profiles.get(userId);
  const now = Date.now();

  if (cachedProfile && now - cachedProfile.timestamp < CACHE_TTL.USER_PROFILE * 1000) {
    return cachedProfile.data;
  }

  // Fetch from database
  try {
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      throw error;
    }

    if (data) {
      // Cache the result
      cache.profiles.set(userId, {
        data: data as UserProfile,
        timestamp: now,
      });

      return data as UserProfile;
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Clear cache for a specific user
 * @param userId User ID
 */
export function clearUserCache(userId: string): void {
  cache.profiles.delete(userId);
  cache.settings.delete(userId);
}

/**
 * Clear all user-related cache
 */
export function clearAllUserCache(): void {
  cache.profiles.clear();
  cache.settings.clear();
}

/**
 * Get table references
 */
export const tables = {
  users: () => 'users',
  profiles: () => 'profiles',
  settings: () => 'user_settings',
};

/**
 * Get storage bucket references
 */
export const storageBuckets = {
  avatars: () => 'avatars',
  uploads: () => 'user-uploads',
};
