/**
 * @file User preferences operations
 */

import { supabase } from '../core/client';
import { UserPreferences } from '../core/types';
import { DEFAULT_PREFERENCES } from '../core/constants';
import { handleUserError } from '../core/errors';

/**
 * Get user preferences
 * @param userId User ID
 * @returns User preferences or default preferences if not found
 */
export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('preferences')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') {
        // Not found
      }
      return { ...DEFAULT_PREFERENCES };
    }

    // If no preferences are stored, return defaults
    if (!data || !data.preferences) {
      return { ...DEFAULT_PREFERENCES };
    }

    // Merge with defaults to ensure all fields are present
    return {
          ...DEFAULT_PREFERENCES,
          ...data.preferences,
      notifications: {
          ...DEFAULT_PREFERENCES.notifications,
          ...(data.preferences.notifications || {}),
      },
      privacy: {
          ...DEFAULT_PREFERENCES.privacy,
          ...(data.preferences.privacy || {}),
      },
    };
  } catch (error) {
    handleUserError(error, 'Error getting user preferences');
    return { ...DEFAULT_PREFERENCES };
  }
}

/**
 * Update user preferences
 * @param userId User ID
 * @param preferences Preferences to update
 * @returns Success status
 */
export async function updateUserPreferences(
  userId: string,
  preferences: Partial<UserPreferences>
): Promise<boolean> {
  try {
    // Get current preferences to merge with updates
    const currentPrefs = await getUserPreferences(userId);

    // Merge updates with current preferences
    const updatedPrefs = {
          ...currentPrefs,
          ...preferences,
      // Handle nested objects
      notifications: preferences.notifications
        ? { ...currentPrefs.notifications, ...preferences.notifications }
        : currentPrefs.notifications,
      privacy: preferences.privacy
        ? { ...currentPrefs.privacy, ...preferences.privacy }
        : currentPrefs.privacy,
    };

    // Update in database
    const { error } = await supabase
      .from('users')
      .update({
        preferences: updatedPrefs,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      return false;
    }

    return true;
  } catch (error) {
    handleUserError(error, 'Error updating user preferences');
    return false;
  }
}

/**
 * Update theme preference
 * @param userId User ID
 * @param theme Theme preference
 * @returns Success status
 */
export async function updateThemePreference(
  userId: string,
  theme: 'light' | 'dark' | 'system'
): Promise<boolean> {
  return updateUserPreferences(userId, { theme });
}

/**
 * Update language preference
 * @param userId User ID
 * @param language Language code (e.g., 'en', 'es')
 * @returns Success status
 */
export async function updateLanguagePreference(userId: string, language: string): Promise<boolean> {
  return updateUserPreferences(userId, { language });
}

/**
 * Update notification preferences
 * @param userId User ID
 * @param notifications Notification settings to update
 * @returns Success status
 */
export async function updateNotificationPreferences(
  userId: string,
  notifications: Partial<Record<string, boolean>>
): Promise<boolean> {
  return updateUserPreferences(userId, {
    notifications: notifications as unknown,
  });
}

/**
 * Update privacy preferences
 * @param userId User ID
 * @param privacy Privacy settings to update
 * @returns Success status
 */
export async function updatePrivacyPreferences(
  userId: string,
  privacy: Partial<Record<string, boolean>>
): Promise<boolean> {
  return updateUserPreferences(userId, {
    privacy: privacy as unknown,
  });
}

/**
 * Reset user preferences to defaults
 * @param userId User ID
 * @returns Success status
 */
export async function resetUserPreferences(userId: string): Promise<boolean> {
  return updateUserPreferences(userId, DEFAULT_PREFERENCES);
}
