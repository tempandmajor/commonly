/**
 * @file Main entry point for the User Service
 * Provides backward compatibility with existing code
 */

// Export API modules
import { api, authAPI, profileAPI, storageAPI, settingsAPI, preferencesAPI } from './api';
export { api, authAPI, profileAPI, storageAPI, settingsAPI, preferencesAPI };

// Export hooks
export { userHooks };

// Export types
export * from './core/types';
export * from './core/constants';

// Import supabase client for backward compatibility
import { supabase } from '@/integrations/supabase/client';

/**
 * Check if a username is available in the database
 * @param username The username to check
 * @returns Promise<boolean> True if username is available, false if taken
 */
export const checkUsernameAvailability = async (username: string): Promise<boolean> => {
  if (!username || username.trim().length === 0) {
    return false;
  }

  // Normalize username for case-insensitive comparison
  const normalizedUsername = username.toLowerCase().trim();

  try {
    // Query for the exact username (case-insensitive)
    const { data, error, count } = await supabase
      .from('users')
      .select('*', { count: 'exact' })
      .eq('display_name', normalizedUsername);

    if (error) throw error;

    // If no documents, username is available
    return count === 0;
  } catch (error) {
    throw new Error('Could not check username availability');
  }
};

/**
 * Upload profile image for a user
 * @deprecated Use api.storage.uploadProfileImage instead
 * @param userId User ID
 * @param imageFile Image file to upload
 * @returns URL of the uploaded image
 */
export const uploadProfileImage = async (userId: string, imageFile: File): Promise<string> => {
  // Use the new implementation from the storage module
  const result = await api.storage.uploadProfileImage(userId, imageFile);

  if (!result) {
    throw new Error('Failed to upload profile image');
  }

  return result;
};

// Export current user functions from auth module
export const getCurrentUser = api.auth.getCurrentUser;
export const getUserById = api.auth.getUserById;
export const getUserByUsername = api.auth.getUserByUsername;
export const signOut = api.auth.signOut;

// Export profile functions
export const updateUserProfile = api.profile.updateUserProfile;
export const createUserProfile = api.profile.createUserProfile;
export const searchUsers = api.profile.searchUsers;

// Export settings functions
export const getUserSettings = api.settings.getUserSettings;
export const updateUserSettings = api.settings.updateUserSettings;

// Export preferences functions
export const getUserPreferences = api.preferences.getUserPreferences;
export const updateUserPreferences = api.preferences.updateUserPreferences;
