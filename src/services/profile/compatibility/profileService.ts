/**
 * User Profile Service - Compatibility Layer
 *
 * This file provides backward compatibility with legacy profile service functions.
 * New code should use the consolidated API directly.
 */

import { profileAPI } from '../api/profileAPI';
import { profileUtils } from '../utils/profileUtils';
import { UserProfile, ProfileUpdateData, ProfileSearchParams } from '../core/types';

/**
 * @deprecated Use profileAPI.getProfileById from '@/services/profile' instead
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  return profileAPI.getProfileById(userId);
}

/**
 * @deprecated Use profileAPI.getProfileByUsername from '@/services/profile' instead
 */
export async function getUserProfileByUsername(username: string): Promise<UserProfile | null> {
  return profileAPI.getProfileByUsername(username);
}

/**
 * @deprecated Use profileAPI.createProfile from '@/services/profile' instead
 */
export async function createUserProfile(userId: string, data: unknown): Promise<UserProfile> {
  return profileAPI.createProfile({
    userId,
          ...data,
  });
}

/**
 * @deprecated Use profileAPI.updateProfile from '@/services/profile' instead
 */
export async function updateUserProfile(profileId: string, data: unknown): Promise<UserProfile> {
  return profileAPI.updateProfile(profileId, data as ProfileUpdateData);
}

/**
 * @deprecated Use profileAPI.updateProfileAvatar from '@/services/profile' instead
 */
export async function updateProfileAvatar(profileId: string, file: File): Promise<UserProfile> {
  return profileAPI.updateProfileAvatar(profileId, file);
}

/**
 * @deprecated Use profileAPI.deleteProfile from '@/services/profile' instead
 */
export async function deleteUserProfile(profileId: string): Promise<void> {
  return profileAPI.deleteProfile(profileId);
}

/**
 * @deprecated Use profileAPI.searchProfiles from '@/services/profile' instead
 */
export async function searchUserProfiles(query: string, page: number = 1): Promise<any> {
  const params: ProfileSearchParams = {
    query,
    page,
    limit: 20,
  };

  const result = await profileAPI.searchProfiles(params);

  // Transform to legacy format
  return {
    profiles: result.data,
    total: result.meta.total,
    page: result.meta.page,
    limit: result.meta.limit,
  };
}

/**
 * @deprecated Use profileAPI.isUsernameAvailable from '@/services/profile' instead
 */
export async function checkUsernameAvailability(username: string): Promise<boolean> {
  return profileAPI.isUsernameAvailable(username);
}

/**
 * @deprecated Use profileUtils.isAdmin from '@/services/profile' instead
 */
export function checkIfAdmin(profile: UserProfile | null): boolean {
  return profileUtils.isAdmin(profile);
}

/**
 * @deprecated Use profileUtils.isCreator from '@/services/profile' instead
 */
export function checkIfCreator(profile: UserProfile | null): boolean {
  return profileUtils.isCreator(profile);
}

/**
 * @deprecated Use profileUtils.formatDisplayName from '@/services/profile' instead
 */
export function formatUserDisplayName(profile: UserProfile | null): string {
  return profileUtils.formatDisplayName(profile);
}

/**
 * @deprecated Use profileUtils.getProfileAvatarUrl from '@/services/profile' instead
 */
export function getUserAvatar(profile: UserProfile | null): string {
  return profileUtils.getProfileAvatarUrl(profile);
}

// Legacy format profile service
export const ProfileService = {
  getUserProfile,
  getUserProfileByUsername,
  createUserProfile,
  updateUserProfile,
  updateProfileAvatar,
  deleteUserProfile,
  searchUserProfiles,
  checkUsernameAvailability,
  checkIfAdmin,
  checkIfCreator,
  formatUserDisplayName,
  getUserAvatar,
};

// Export as default for legacy import compatibility
export default ProfileService;
