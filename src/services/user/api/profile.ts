/**
 * @file User profile operations for the user service
 */

import { supabase, clearUserCache } from '../core/client';
import { UserUpdateData } from '../core/types';
import { handleUserError } from '../core/errors';

/**
 * Update user profile data in users table
 * @param userId User ID to update
 * @param updates Profile data to update
 * @returns Success status
 */
export async function updateUserProfile(userId: string, updates: UserUpdateData): Promise<boolean> {
  try {
    // First get current user email for required field
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.email) {
      return false;
    }

    // Update in users table
    const { error } = await supabase.from('users').upsert({
      id: userId,
      email: user.email, // Required field
          ...updates,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      return false;
    }

    // Clear cache to ensure fresh data
    clearUserCache(userId);

    return true;
  } catch (error) {
    handleUserError(error, 'Error updating user profile');
    return false;
  }
}

/**
 * Create a new user profile
 * @param userId User ID
 * @param profileData Profile data
 * @returns Success status
 */
export async function createUserProfile(
  userId: string,
  profileData: UserUpdateData
): Promise<boolean> {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.email) {
      return false;
    }

    // Create profile in users table
    const { error } = await supabase.from('users').insert({
      id: userId,
      email: user.email,
          ...profileData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      return false;
    }

    return true;
  } catch (error) {
    handleUserError(error, 'Error creating user profile');
    return false;
  }
}

/**
 * Delete user profile
 * @param userId User ID to delete
 * @returns Success status
 */
export async function deleteUserProfile(userId: string): Promise<boolean> {
  try {
    // Delete from users table
    const { error } = await supabase.from('users').delete().eq('id', userId);

    if (error) {
      return false;
    }

    // Clear cache
    clearUserCache(userId);

    return true;
  } catch (error) {
    handleUserError(error, 'Error deleting user profile');
    return false;
  }
}

/**
 * Update user avatar URL
 * @param userId User ID
 * @param avatarUrl New avatar URL
 * @returns Success status
 */
export async function updateUserAvatar(userId: string, avatarUrl: string): Promise<boolean> {
  try {
    // Update in users table
    const { error } = await supabase
      .from('users')
      .update({
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      return false;
    }

    // Clear cache
    clearUserCache(userId);

    // Also update metadata in auth
    await supabase.auth.updateUser({
      data: { avatar_url: avatarUrl },
    });

    return true;
  } catch (error) {
    handleUserError(error, 'Error updating user avatar');
    return false;
  }
}

/**
 * Search users by name or email
 * @param query Search query
 * @param limit Maximum number of results to return
 * @returns Array of matching users
 */
export async function searchUsers(query: string, limit = 10): Promise<any[]> {
  try {
    if (!query || query.length < 2) {
      return [];
    }

    // Search for users by name or email
    const { data, error } = await supabase
      .from('users')
      .select('id, email, display_name, avatar_url')
      .or(`display_name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(limit);

    if (error) {
      return [];
    }

    return data || [];
  } catch (error) {
    handleUserError(error, 'Error searching users');
    return [];
  }
}
