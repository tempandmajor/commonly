/**
 * User Profile Service - Utility Functions
 *
 * This file provides utility functions for working with user profiles.
 */

import { UserProfile, AccountType, ProfileStatus, PrivacySetting } from '../core/types';

/**
 * Format a user's display name for showing in the UI
 */
export function formatDisplayName(profile: UserProfile | null): string {
  if (!profile) return 'Unknown User';

  return profile.display_name || profile.full_name || profile.username || 'Anonymous User';
}

/**
 * Get profile avatar URL with fallback to default avatar
 */
export function getProfileAvatarUrl(profile: UserProfile | null): string {
  if (!profile || !profile.avatar_url) {
    return '/images/default-avatar.png';
  }

  return profile.avatar_url;
}

/**
 * Generate profile avatar initials from name
 */
export function getProfileInitials(profile: UserProfile | null): string {
  if (!profile) return '?';

  const name = profile.full_name || profile.display_name || profile.username || '';

  if (!name) return '?';

  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].substring(0, 1).toUpperCase();
  }

  return (parts[0].substring(0, 1) + parts[parts.length - 1].substring(0, 1)).toUpperCase();
}

/**
 * Check if a user is an admin
 */
export function isAdmin(profile: UserProfile | null): boolean {
  if (!profile) return false;

  return profile.account_type === AccountType.ADMIN;
}

/**
 * Check if a user is a creator
 */
export function isCreator(profile: UserProfile | null): boolean {
  if (!profile) return false;

  return profile.account_type === AccountType.CREATOR;
}

/**
 * Check if a user is an organizer
 */
export function isOrganizer(profile: UserProfile | null): boolean {
  if (!profile) return false;

  return profile.account_type === AccountType.ORGANIZER;
}

/**
 * Check if a user is a business account
 */
export function isBusiness(profile: UserProfile | null): boolean {
  if (!profile) return false;

  return profile.account_type === AccountType.BUSINESS;
}

/**
 * Check if a profile is active
 */
export function isProfileActive(profile: UserProfile | null): boolean {
  if (!profile) return false;

  return profile.status === ProfileStatus.ACTIVE;
}

/**
 * Check if a profile is deleted
 */
export function isProfileDeleted(profile: UserProfile | null): boolean {
  if (!profile) return false;

  return profile.status === ProfileStatus.DELETED;
}

/**
 * Check if a profile is suspended
 */
export function isProfileSuspended(profile: UserProfile | null): boolean {
  if (!profile) return false;

  return profile.status === ProfileStatus.SUSPENDED;
}

/**
 * Check if a profile is pending verification
 */
export function isProfilePendingVerification(profile: UserProfile | null): boolean {
  if (!profile) return false;

  return profile.status === ProfileStatus.PENDING_VERIFICATION;
}

/**
 * Check if a profile field is visible to the current user
 */
export function isProfileFieldVisible(
  profile: UserProfile | null,
  field: string,
  currentUserId?: string
): boolean {
  if (!profile) return false;

  // Admins can see everything
  if (isAdmin(profile)) return true;

  // Own profile is always visible to the user
  if (currentUserId && profile.userId === currentUserId) return true;

  // Check privacy settings for the specific field
  const fieldPrivacy = profile.privacy_settings?.[field];

  if (!fieldPrivacy) {
    // Default to public if not specified
    return true;
  }

  switch (fieldPrivacy) {
    case PrivacySetting.PUBLIC:
      return true;
    case PrivacySetting.PRIVATE:
      return false;
    case PrivacySetting.FRIENDS_ONLY:
      // TODO: Implement friends check when friendship service is available
      return false;
    default:
      return true;
  }
}

/**
 * Get profile account type display label
 */
export function getAccountTypeLabel(accountType?: AccountType): string {
  switch (accountType) {
    case AccountType.PERSONAL:
      return 'Personal';
    case AccountType.BUSINESS:
      return 'Business';
    case AccountType.CREATOR:
      return 'Creator';
    case AccountType.ORGANIZER:
      return 'Organizer';
    case AccountType.ADMIN:
      return 'Administrator';
    default:
      return 'Unknown';
  }
}

/**
 * Get profile status display label
 */
export function getProfileStatusLabel(status?: ProfileStatus): string {
  switch (status) {
    case ProfileStatus.ACTIVE:
      return 'Active';
    case ProfileStatus.INACTIVE:
      return 'Inactive';
    case ProfileStatus.SUSPENDED:
      return 'Suspended';
    case ProfileStatus.PENDING_VERIFICATION:
      return 'Pending Verification';
    case ProfileStatus.DELETED:
      return 'Deleted';
    default:
      return 'Unknown';
  }
}

/**
 * Format a profile's full contact information for display
 */
export function formatContactInfo(profile: UserProfile | null): string {
  if (!profile || !profile.contact_info) return '';

  const { contact_info } = profile;
  const parts = [];

  if (contact_info.email) {
    parts.push(contact_info.email);
  }

  if (contact_info.phone) {
    parts.push(contact_info.phone);
  }

  if (contact_info.address) {
    const address = contact_info.address;
    const addressParts = [];

    if (address.line1) {
      addressParts.push(address.line1);
    }

    if (address.line2) {
      addressParts.push(address.line2);
    }

    if (address.city) {
      const cityRegion = [address.city];
      if (address.state) {
        cityRegion.push(address.state);
      }
      addressParts.push(cityRegion.join(', '));
    }

    if (address.postalCode) {
      addressParts.push(address.postalCode);
    }

    if (address.country) {
      addressParts.push(address.country);
    }

    if (addressParts.length > 0) {
      parts.push(addressParts.join(', '));
    }
  }

  return parts.join(' • ');
}

/**
 * Parse a username to ensure it's valid
 */
export function validateUsername(username: string): { isValid: boolean; message?: string } {
  // Username should be at least 3 characters long
  if (username.length < 3) {
    return { isValid: false, message: 'Username must be at least 3 characters long' };
  }

  // Username should be at most 30 characters long
  if (username.length > 30) {
    return { isValid: false, message: 'Username must be at most 30 characters long' };
  }

  // Username should only contain alphanumeric characters, underscores, and periods
  if (!/^[a-zA-Z0-9._]+$/.test(username)) {
    return {
      isValid: false,
      message: 'Username can only contain letters, numbers, periods, and underscores',
    };
  }

  // Username should start with a letter
  if (!/^[a-zA-Z]/.test(username)) {
    return { isValid: false, message: 'Username must start with a letter' };
  }

  // Username should not end with a period
  if (username.endsWith('.')) {
    return { isValid: false, message: 'Username cannot end with a period' };
  }

  // Username should not contain consecutive periods
  if (username.includes('..')) {
    return { isValid: false, message: 'Username cannot contain consecutive periods' };
  }

  // Username should not contain consecutive underscores
  if (username.includes('__')) {
    return { isValid: false, message: 'Username cannot contain consecutive underscores' };
  }

  return { isValid: true };
}

/**
 * Group of profile utility functions
 */
export const profileUtils = {
  formatDisplayName,
  getProfileAvatarUrl,
  getProfileInitials,
  isAdmin,
  isCreator,
  isOrganizer,
  isBusiness,
  isProfileActive,
  isProfileDeleted,
  isProfileSuspended,
  isProfilePendingVerification,
  isProfileFieldVisible,
  getAccountTypeLabel,
  getProfileStatusLabel,
  formatContactInfo,
  validateUsername,
};
