/**
 * @file User settings operations
 */

import { supabase } from '../core/client';
import {
  UserSettings,
  NotificationSettings,
  PrivacySettings,
  PaymentSettings,
} from '../core/types';
import { DEFAULT_PREFERENCES, DEFAULT_PAYMENT_SETTINGS } from '../core/constants';
import { handleUserError } from '../core/errors';

/**
 * Get user settings
 * @param userId User ID
 * @returns User settings or null if not found
 */
export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  try {
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();

    if (error || !data) {
      if (error && error.code !== 'PGRST116') {
      }
      return null;
    }

    // Safely parse payment_settings and preferences
    let paymentSettings: PaymentSettings = {
      defaultMethod: 'stripe',
      autoRecharge: false,
      rechargeAmount: 0,
    };

    if (data.payment_settings && typeof data.payment_settings === 'object') {
      const settings = data.payment_settings as unknown;
      paymentSettings = {
        defaultMethod: settings.defaultMethod || DEFAULT_PAYMENT_SETTINGS.defaultMethod,
        autoRecharge: settings.autoRecharge || DEFAULT_PAYMENT_SETTINGS.autoRecharge,
        rechargeAmount: settings.rechargeAmount || DEFAULT_PAYMENT_SETTINGS.rechargeAmount,
      };
    }

    let notifications: NotificationSettings = { ...DEFAULT_PREFERENCES.notifications };
    let privacy: PrivacySettings = { ...DEFAULT_PREFERENCES.privacy };

    if (data.preferences && typeof data.preferences === 'object') {
      const prefs = data.preferences as unknown;
      if (prefs.notifications) {
        notifications = { ...notifications, ...prefs.notifications };
      }
      if (prefs.privacy) {
        privacy = { ...privacy, ...prefs.privacy };
      }
    }

    return {
      id: data.id,
      userId: data.id,
      platformCredit: data.platform_credit || 0,
      paymentPreferences: paymentSettings,
      notifications,
      privacy,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    handleUserError(error, 'Error fetching user settings');
    return null;
  }
}

/**
 * Update user settings
 * @param userId User ID
 * @param settings Settings to update
 * @returns Success status
 */
export async function updateUserSettings(
  userId: string,
  settings: Partial<UserSettings>
): Promise<boolean> {
  try {
    // Prepare update data
    const updateData: any = {};

    // Update payment settings
    if (settings.paymentPreferences) {
      updateData.payment_settings = settings.paymentPreferences;
    }

    // Update platform credit
    if (typeof settings.platformCredit === 'number') {
      updateData.platform_credit = settings.platformCredit;
    }

    // Update preferences (notifications and privacy)
    if (settings.notifications || settings.privacy) {
      // Get existing preferences first
      const { data } = await supabase.from('users').select('preferences').eq('id', userId).single();

      const existingPreferences = data?.preferences || {};

      updateData.preferences = {
          ...existingPreferences,
          ...(settings.notifications && { notifications: settings.notifications }),
          ...(settings.privacy && { privacy: settings.privacy }),
      };
    }

    // Update timestamp
    updateData.updated_at = new Date().toISOString();

    // Update in database
    const { error } = await supabase.from('users').update(updateData).eq('id', userId);

    if (error) {
      return false;
    }

    return true;
  } catch (error) {
    handleUserError(error, 'Error updating user settings');
    return false;
  }
}

/**
 * Initialize default user settings
 * @param userId User ID
 * @returns New user settings or null on failure
 */
export async function initializeUserSettings(userId: string): Promise<UserSettings | null> {
  try {
    // First check if user already has settings
    const existingSettings = await getUserSettings(userId);

    if (existingSettings) {
      return existingSettings;
    }

    // Get user email for required field
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.email) {
      return null;
    }

    // Create default settings
    const defaultSettings: UserSettings = {
      userId,
      platformCredit: 0,
      paymentPreferences: DEFAULT_PAYMENT_SETTINGS,
      notifications: DEFAULT_PREFERENCES.notifications,
      privacy: DEFAULT_PREFERENCES.privacy,
    };

    // Update in database
    const { error } = await supabase.from('users').upsert({
      id: userId,
      email: user.email,
      platform_credit: defaultSettings.platformCredit,
      payment_settings: defaultSettings.paymentPreferences,
      preferences: {
        notifications: defaultSettings.notifications,
        privacy: defaultSettings.privacy,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      return null;
    }

    return defaultSettings;
  } catch (error) {
    handleUserError(error, 'Error initializing user settings');
    return null;
  }
}

/**
 * Add platform credit to user
 * @param userId User ID
 * @param amount Amount to add
 * @returns Success status
 */
export async function addPlatformCredit(userId: string, amount: number): Promise<boolean> {
  try {
    if (amount <= 0) {
      return false;
    }

    // Get current credit
    const { data } = await supabase
      .from('users')
      .select('platform_credit')
      .eq('id', userId)
      .single();

    const currentCredit = data?.platform_credit || 0;
    const newCredit = currentCredit + amount;

    // Update credit
    const { error } = await supabase
      .from('users')
      .update({
        platform_credit: newCredit,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      return false;
    }

    return true;
  } catch (error) {
    handleUserError(error, 'Error adding platform credit');
    return false;
  }
}

/**
 * Deduct platform credit from user
 * @param userId User ID
 * @param amount Amount to deduct
 * @returns Success status
 */
export async function deductPlatformCredit(userId: string, amount: number): Promise<boolean> {
  try {
    if (amount <= 0) {
      return false;
    }

    // Get current credit
    const { data } = await supabase
      .from('users')
      .select('platform_credit')
      .eq('id', userId)
      .single();

    const currentCredit = data?.platform_credit || 0;

    // Check if user has enough credit
    if (currentCredit < amount) {
      return false;
    }

    const newCredit = currentCredit - amount;

    // Update credit
    const { error } = await supabase
      .from('users')
      .update({
        platform_credit: newCredit,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      return false;
    }

    return true;
  } catch (error) {
    handleUserError(error, 'Error deducting platform credit');
    return false;
  }
}
