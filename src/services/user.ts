/**
 * Main User Service Export
 * Provides a clean, consolidated API for user operations
 */

import { userService } from './user/UserService';
import { User } from '@/types/auth';

// Export the main service instance
export { userService };

// Export types for external use
export type {
  User,
  UserProfile,
  UpdateUserData,
  CreateUserData,
  UserSearchFilters,
  UserSearchResult,
  AvatarUploadOptions,
  AvatarUploadResult,
} from './user/types';

// Backward compatibility functions with improved error handling
export const getCurrentUser = async () => {
  const result = await userService.getCurrentUser();
  if (!result.success) {
    throw new Error(result.error?.message || 'Failed to get current user');
  }
  return result.data;
};

export const getUserById = async (userId: string) => {
  const result = await userService.getUserById(userId);
  if (!result.success) {
    throw new Error(result.error?.message || 'Failed to get user');
  }
  return result.data;
};

export const getUserByUsername = async (username: string): Promise<User | null> => {
  const result = await userService.getUserByDisplayName(username);
  if (!result.success) {
    return null; // Return null for backward compatibility
  }

  // Convert to legacy User type for backward compatibility
  const userData = result.data;
  if (userData) {
    return {
      id: userData.id,
      email: userData.email,
      app_metadata: {},
      user_metadata: {
        display_name: userData.display_name,
        avatar_url: userData.avatar_url,
      },
      aud: 'authenticated',
      created_at: userData.created_at,
      updated_at: userData.updated_at,
      display_name: userData.display_name,
      avatar_url: userData.avatar_url,
    } as User;
  }

  return null;
};

export const updateUserProfile = async (
  userId: string,
  updates: import('./user/types').UpdateUserData
) => {
  const result = await userService.updateUserProfile(userId, updates);
  if (!result.success) {
    throw new Error(result.error?.message || 'Failed to update user profile');
  }
  return result.data;
};

export const uploadProfileImage = async (userId: string, file: File): Promise<string> => {
  const result = await userService.uploadAvatar(userId, file);
  if (!result.success) {
    throw new Error(result.error?.message || 'Failed to upload profile image');
  }
  return result.data?.url || '';
};

export const checkUsernameAvailability = async (username: string): Promise<boolean> => {
  const result = await userService.checkDisplayNameAvailability(username);
  if (!result.success) {
    throw new Error(result.error?.message || 'Failed to check username availability');
  }
  return result.data || false;
};

// Legacy exports for compatibility
export const getUserPreferences = getCurrentUser;
export const updateUserPreferences = updateUserProfile;
