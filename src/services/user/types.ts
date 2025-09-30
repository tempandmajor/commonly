/**
 * Unified User Service Types
 * Centralized type definitions for user-related operations
 */

export interface User {
  id: string;
  email: string;
  display_name?: string | undefined;
  avatar_url?: string | undefined;
  bio?: string | undefined;
  location?: string | undefined;
  website?: string | undefined;
  created_at: string;
  updated_at: string;
  last_sign_in_at?: string | undefined;
  email_confirmed_at?: string | undefined;
}

export interface UserProfile {
  id: string;
  user_id: string;
  display_name?: string | undefined;
  bio?: string | undefined;
  avatar_url?: string | undefined;
  cover_photo_url?: string | undefined;
  location?: string | undefined;
  website?: string | undefined;
  social_links?: SocialLinks | undefined;
  preferences?: UserPreferences | undefined;
  settings?: UserSettings | undefined;
  created_at: string;
  updated_at: string;
}

export interface SocialLinks {
  twitter?: string | undefined;
  instagram?: string | undefined;
  linkedin?: string | undefined;
  facebook?: string | undefined;
  youtube?: string | undefined;
  tiktok?: string | undefined;
}

export interface UserPreferences {
  theme?: 'light' | undefined| 'dark' | 'system';
  language?: string | undefined;
  timezone?: string | undefined;
  email_notifications?: boolean | undefined;
  push_notifications?: boolean | undefined;
  marketing_emails?: boolean | undefined;
  newsletter?: boolean | undefined;
}

export interface UserSettings {
  privacy_level?: 'public' | undefined| 'friends' | 'private';
  show_email?: boolean | undefined;
  show_location?: boolean | undefined;
  allow_messages?: boolean | undefined;
  two_factor_enabled?: boolean | undefined;
}

export interface CreateUserData {
  email: string;
  display_name?: string | undefined;
  password?: string | undefined;
}

export interface UpdateUserData {
  display_name?: string | undefined;
  bio?: string | undefined;
  location?: string | undefined;
  website?: string | undefined;
  avatar_url?: string | undefined;
  cover_photo_url?: string | undefined;
  social_links?: Partial<SocialLinks> | undefined;
  preferences?: Partial<UserPreferences> | undefined;
  settings?: Partial<UserSettings> | undefined;
}

export interface UserSearchFilters {
  query?: string | undefined;
  location?: string | undefined;
  limit?: number | undefined;
  offset?: number | undefined;
}

export interface UserSearchResult {
  users: User[];
  total: number;
  hasMore: boolean;
}

export interface UserServiceError {
  code: string;
  message: string;
  details?: unknown | undefined;
}

export interface UserServiceResponse<T> {
  data?: T;
  error?: UserServiceError;
  success: boolean;
}

// Avatar upload types
export interface AvatarUploadOptions {
  maxSize?: number | undefined; // in bytes
  allowedTypes?: string[] | undefined;
  quality?: number | undefined; // 0-1 for compression
}

export interface AvatarUploadResult {
  url: string;
  publicId?: string | undefined;
  size: number;
  type: string;
}
