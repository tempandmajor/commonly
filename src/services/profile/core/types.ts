/**
 * User Profile Service - Core Types
 *
 * This file defines the core types and interfaces for the user profile service.
 */

/**
 * User profile status
 */
export enum ProfileStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
  DELETED = 'deleted',
}

/**
 * User profile account type
 */
export enum AccountType {
  PERSONAL = 'personal',
  BUSINESS = 'business',
  CREATOR = 'creator',
  ORGANIZER = 'organizer',
  ADMIN = 'admin',
}

/**
 * User profile privacy settings
 */
export enum PrivacySetting {
  PUBLIC = 'public',
  FRIENDS_ONLY = 'friends_only',
  PRIVATE = 'private',
}

/**
 * User notification preferences
 */
export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  marketing: boolean;
  updates: boolean;
  eventReminders: boolean;
  messages: boolean;
  friendRequests: boolean;
}

/**
 * User contact information
 */
export interface ContactInfo {
  email?: string | undefined;
  phone?: string | undefined;
  address?: {
    line1?: string | undefined;
    line2?: string | undefined;
    city?: string | undefined;
    state?: string | undefined;
    postalCode?: string | undefined;
    country?: string | undefined;
  };
  emergencyContact?: {
    name?: string;
    relationship?: string;
    phone?: string;
  };
}

/**
 * User social media links
 */
export interface SocialLinks {
  twitter?: string | undefined;
  facebook?: string | undefined;
  instagram?: string | undefined;
  linkedin?: string | undefined;
  youtube?: string | undefined;
  website?: string | undefined;
  tiktok?: string | undefined;
}

/**
 * User profile interface
 */
export interface UserProfile {
  id: string;
  userId: string;
  username?: string | undefined;
  full_name?: string | undefined;
  display_name?: string | undefined;
  avatar_url?: string | undefined;
  bio?: string | undefined;
  status: ProfileStatus;
  account_type: AccountType;
  contact_info?: ContactInfo | undefined;
  social_links?: SocialLinks | undefined;
  notification_preferences?: NotificationPreferences | undefined;
  privacy_settings?: Record<string, PrivacySetting> | undefined;
  metadata?: Record<string, unknown> | undefined;
  created_at: string;
  updated_at: string;
}

/**
 * User profile creation data
 */
export interface ProfileCreateData {
  userId: string;
  username?: string | undefined;
  full_name?: string | undefined;
  display_name?: string | undefined;
  avatar_url?: string | undefined;
  bio?: string | undefined;
  account_type?: AccountType | undefined;
  contact_info?: Partial<ContactInfo> | undefined;
  social_links?: Partial<SocialLinks> | undefined;
  notification_preferences?: Partial<NotificationPreferences> | undefined;
  privacy_settings?: Record<string, PrivacySetting> | undefined;
  metadata?: Record<string, unknown> | undefined;
}

/**
 * User profile update data
 */
export interface ProfileUpdateData {
  username?: string | undefined;
  full_name?: string | undefined;
  display_name?: string | undefined;
  avatar_url?: string | undefined;
  bio?: string | undefined;
  status?: ProfileStatus | undefined;
  account_type?: AccountType | undefined;
  contact_info?: Partial<ContactInfo> | undefined;
  social_links?: Partial<SocialLinks> | undefined;
  notification_preferences?: Partial<NotificationPreferences> | undefined;
  privacy_settings?: Record<string, PrivacySetting> | undefined;
  metadata?: Record<string, unknown> | undefined;
}

/**
 * Profile search parameters
 */
export interface ProfileSearchParams {
  query?: string | undefined;
  status?: ProfileStatus | undefined| ProfileStatus[];
  accountType?: AccountType | undefined| AccountType[];
  page?: number | undefined;
  limit?: number | undefined;
  sortBy?: string | undefined;
  sortDirection?: 'asc' | undefined| 'desc';
}

/**
 * Profile search results
 */
export interface ProfileSearchResult {
  data: UserProfile[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

/**
 * Profile visibility options
 */
export interface ProfileVisibilitySettings {
  profile: PrivacySetting;
  contact_info: PrivacySetting;
  social_links: PrivacySetting;
}

/**
 * Error types for profile service
 */
export enum ProfileErrorType {
  NOT_FOUND = 'profile_not_found',
  ALREADY_EXISTS = 'profile_already_exists',
  INVALID_DATA = 'invalid_profile_data',
  PERMISSION_DENIED = 'profile_permission_denied',
  USERNAME_TAKEN = 'username_taken',
  DATABASE_ERROR = 'database_error',
  UNKNOWN_ERROR = 'unknown_error',
}

/**
 * Profile service error
 */
export class ProfileError extends Error {
  public readonly type: ProfileErrorType;
  public readonly originalError?: Error;
  public readonly data?: unknown;

  constructor(
    message: string,
    type: ProfileErrorType = ProfileErrorType.UNKNOWN_ERROR,
    originalError?: Error,
    data?: any
  ) {
    super(message);
    this.name = 'ProfileError';
    this.type = type;
    this.originalError = originalError;
    this.data = data;
  }
}
