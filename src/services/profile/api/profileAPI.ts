/**
 * User Profile Service - API
 *
 * This file provides functions for managing user profiles.
 */

import { toast } from 'sonner';
import {
  UserProfile,
  ProfileCreateData,
  ProfileUpdateData,
  ProfileStatus,
  ProfileSearchParams,
  ProfileSearchResult,
  ProfileError,
  ProfileErrorType,
  AccountType,
} from '../core/types';
import { supabaseClient } from './supabaseClient';

const DEFAULT_ERROR_MESSAGE = 'An error occurred while managing profile';

/**
 * Standard error handler for profile API functions
 */

function handleProfileError(error: unknown, message: string): never {
  if (error instanceof ProfileError) {
    throw error;
  }

  toast.error(DEFAULT_ERROR_MESSAGE);
  throw new ProfileError(
    message,
    ProfileErrorType.UNKNOWN_ERROR,
    error instanceof Error ? error : undefined
  );
}

/**
 * Get user profile by user ID
 */
export async function getProfileById(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabaseClient
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      throw new ProfileError(
        `Failed to get profile: ${error.message}`,
        ProfileErrorType.DATABASE_ERROR,
        error
      );
    }

    return mapProfileFromDb(data);
  } catch (error) {
    return handleProfileError(error, 'Failed to get profile');
  }
}

/**
 * Get profile by username
 */
export async function getProfileByUsername(username: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabaseClient
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      throw new ProfileError(
        `Failed to get profile by username: ${error.message}`,
        ProfileErrorType.DATABASE_ERROR,
        error
      );
    }

    return mapProfileFromDb(data);
  } catch (error) {
    return handleProfileError(error, 'Failed to get profile by username');
  }
}

/**
 * Create a user profile
 */
export async function createProfile(profileData: ProfileCreateData): Promise<UserProfile> {
  try {
    // Check if username already exists
    if (profileData.username) {
      const { data: existingProfile } = await supabaseClient
        .from('users')
        .select('id')
        .eq('username', profileData.username)
        .single();

      if (existingProfile) {
        throw new ProfileError(
          `Username '${profileData.username}' is already taken`,
          ProfileErrorType.USERNAME_TAKEN
        );
      }
    }

    // Map the profile data to the database format
    const dbProfile = {
      user_id: profileData.userId,
      username: profileData.username,
      full_name: profileData.full_name,
      display_name: profileData.display_name || profileData.full_name,
      avatar_url: profileData.avatar_url,
      bio: profileData.bio,
      status:
        profileData.account_type === AccountType.ADMIN
          ? ProfileStatus.ACTIVE
          : ProfileStatus.PENDING_VERIFICATION,
      account_type: profileData.account_type || AccountType.PERSONAL,
      contact_info: profileData.contact_info || {},
      social_links: profileData.social_links || {},
      notification_preferences: profileData.notification_preferences || {
        email: true,
        push: true,
        sms: false,
        marketing: false,
        updates: true,
        eventReminders: true,
        messages: true,
        friendRequests: true,
      },
      privacy_settings: profileData.privacy_settings || {},
      metadata: profileData.metadata || {},
    };

    // Insert profile
    const { data, error } = await supabaseClient
      .from('users')
      .insert(dbProfile)
      .select('*')
      .single();

    if (error) {
      throw new ProfileError(
        `Failed to create profile: ${error.message}`,
        ProfileErrorType.DATABASE_ERROR,
        error
      );
    }

    toast.success('Profile created successfully');
    return mapProfileFromDb(data);
  } catch (error) {
    if (error instanceof ProfileError) {
      toast.error(error.message);
      throw error;
    }

    return handleProfileError(error, 'Failed to create profile');
  }
}

/**
 * Update a user profile
 */
export async function updateProfile(
  profileId: string,
  profileData: ProfileUpdateData
): Promise<UserProfile> {
  try {
    // Check if username already exists if it's being updated
    if (profileData.username) {
      const { data: existingProfile } = await supabaseClient
        .from('users')
        .select('id')
        .eq('username', profileData.username)
        .neq('id', profileId)
        .single();

      if (existingProfile) {
        throw new ProfileError(
          `Username '${profileData.username}' is already taken`,
          ProfileErrorType.USERNAME_TAKEN
        );
      }
    }

    // Update profile
    const { data, error } = await supabaseClient
      .from('users')
      .update({
          ...profileData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profileId)
      .select('*')
      .single();

    if (error) {
      throw new ProfileError(
        `Failed to update profile: ${error.message}`,
        ProfileErrorType.DATABASE_ERROR,
        error
      );
    }

    toast.success('Profile updated successfully');
    return mapProfileFromDb(data);
  } catch (error) {
    if (error instanceof ProfileError) {
      toast.error(error.message);
      throw error;
    }

    return handleProfileError(error, 'Failed to update profile');
  }
}

/**
 * Update user profile avatar
 */
export async function updateProfileAvatar(profileId: string, file: File): Promise<UserProfile> {
  try {
    // Upload avatar to storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${profileId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Upload file to storage bucket
    const { error: uploadError } = await supabaseClient.storage
      .from('profile-avatars')
      .upload(filePath, file);

    if (uploadError) {
      throw new ProfileError(
        `Failed to upload avatar: ${uploadError.message}`,
        ProfileErrorType.DATABASE_ERROR,
        uploadError
      );
    }

    // Get public URL
    const { data: publicUrlData } = supabaseClient.storage
      .from('profile-avatars')
      .getPublicUrl(filePath);

    const avatarUrl = publicUrlData.publicUrl;

    // Update profile with new avatar URL
    return updateProfile(profileId, { avatar_url: avatarUrl });
  } catch (error) {
    return handleProfileError(error, 'Failed to update profile avatar');
  }
}

/**
 * Delete a user profile
 */
export async function deleteProfile(profileId: string): Promise<void> {
  try {
    // First, mark as deleted
    const { error: updateError } = await supabaseClient
      .from('users')
      .update({
        status: ProfileStatus.DELETED,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profileId);

    if (updateError) {
      throw new ProfileError(
        `Failed to delete profile: ${updateError.message}`,
        ProfileErrorType.DATABASE_ERROR,
        updateError
      );
    }

    toast.success('Profile deleted successfully');
  } catch (error) {
    if (error instanceof ProfileError) {
      toast.error(error.message);
      throw error;
    }

    handleProfileError(error, 'Failed to delete profile');
  }
}

/**
 * Search for profiles
 */
export async function searchProfiles(
  params: ProfileSearchParams = {}
): Promise<ProfileSearchResult> {
  try {
    let query = supabaseClient.from('users').select('*', { count: 'exact' });

    // Apply filters
    if (params.query) {
      query = query.or(
        `username.ilike.%${params.query}%,full_name.ilike.%${params.query}%,display_name.ilike.%${params.query}%`
      );
    }

    if (params.status) {
      if (Array.isArray(params.status)) {
        query = query.in('status', params.status);
      } else {
        query = query.eq('status', params.status);
      }
    } else {
      // By default, only return active profiles
      query = query.eq('status', ProfileStatus.ACTIVE);
    }

    if (params.accountType) {
      if (Array.isArray(params.accountType)) {
        query = query.in('account_type', params.accountType);
      } else {
        query = query.eq('account_type', params.accountType);
      }
    }

    // Apply pagination
    const page = params.page || 1;
    const limit = params.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to);

    // Apply sorting
    if (params.sortBy) {
      const direction = params.sortDirection || 'desc';
      query = query.order(params.sortBy, { ascending: direction === 'asc' });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      throw new ProfileError(
        `Failed to search profiles: ${error.message}`,
        ProfileErrorType.DATABASE_ERROR,
        error
      );
    }

    return {
      data: (data || []).map(mapProfileFromDb),
      meta: {
        total: count || 0,
        page,
        limit,
      },
    };
  } catch (error) {
    return handleProfileError(error, 'Failed to search profiles');
  }
}

/**
 * Check if a username is available
 */
export async function isUsernameAvailable(
  username: string,
  excludeProfileId?: string
): Promise<boolean> {
  try {
    let query = supabaseClient.from('users').select('id').eq('username', username);

    if (excludeProfileId) {
      query = query.neq('id', excludeProfileId);
    }

    const { data, error } = await query;

    if (error) {
      throw new ProfileError(
        `Failed to check username availability: ${error.message}`,
        ProfileErrorType.DATABASE_ERROR,
        error
      );
    }

    return data.length === 0;
  } catch (error) {
    return handleProfileError(error, 'Failed to check username availability');
  }
}

/**
 * Get suggested usernames based on a name
 */
export async function getSuggestedUsernames(
  baseName: string,
  count: number = 5
): Promise<string[]> {
  try {
    // Generate candidate usernames
    const candidates = [];

    // Clean up the base name (replace spaces, special chars)
    const baseUsername = baseName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .trim();

    if (!baseUsername) {
      return [];
    }

    // Add the base name itself
    candidates.push(baseUsername);

    // Add variations
    for (let i = 0; candidates.length < count + 10; i++) {
      if (i === 0) continue; // Skip 0 as we already added the base name

      // Add numeric suffixes
      candidates.push(`${baseUsername}${i}`);

      // Add random suffixes
      const randomSuffix = Math.floor(Math.random() * 1000);
      candidates.push(`${baseUsername}_${randomSuffix}`);
    }

    // Check which ones are available
    const availabilityPromises = candidates.map(username =>
      isUsernameAvailable(username).then(available => ({ username, available }))
    );

    const results = await Promise.all(availabilityPromises);
    const availableUsernames = results
      .filter(result => result.available)
      .map(result => result.username);

    // Return the requested number of available usernames
    return availableUsernames.slice(0, count);
  } catch (error) {
    return handleProfileError(error, 'Failed to get suggested usernames');
  }
}

/**
 * Map a database profile to the UserProfile interface
 */
function mapProfileFromDb(dbProfile: Record<string, any>): UserProfile {
  return {
    id: dbProfile.id,
    userId: dbProfile.user_id,
    username: dbProfile.username,
    full_name: dbProfile.full_name,
    display_name: dbProfile.display_name,
    avatar_url: dbProfile.avatar_url,
    bio: dbProfile.bio,
    status: dbProfile.status,
    account_type: dbProfile.account_type,
    contact_info: dbProfile.contact_info,
    social_links: dbProfile.social_links,
    notification_preferences: dbProfile.notification_preferences,
    privacy_settings: dbProfile.privacy_settings,
    metadata: dbProfile.metadata,
    created_at: dbProfile.created_at,
    updated_at: dbProfile.updated_at,
  };
}

/**
 * Group of profile-related API functions
 */
export const profileAPI = {
  getProfileById,
  getProfileByUsername,
  createProfile,
  updateProfile,
  updateProfileAvatar,
  deleteProfile,
  searchProfiles,
  isUsernameAvailable,
  getSuggestedUsernames,
};
