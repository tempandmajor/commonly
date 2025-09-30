/**
 * @file Core type definitions for the consolidated user service
 */

// Basic user types from Supabase auth
import { User as SupabaseUser } from '@supabase/supabase-js';

// ======== User Types ========

/**
 * Extended user type that combines auth and profile information
 */
export interface User extends Omit<SupabaseUser, 'user_metadata'> {
  // Standard Supabase auth fields are inherited

  // Extended fields
  name?: string;
  username?: string;
  display_name?: string;
  bio?: string;
  profilePicture?: string;
  avatar?: string;
  avatar_url?: string;
  role?: UserRole;
  hasStore?: boolean;
  stripeCustomerId?: string;

  // Structured metadata
  user_metadata: UserMetadata;
}

/**
 * User metadata structured type
 */
export interface UserMetadata {
  name?: string | undefined;
  username?: string | undefined;
  bio?: string | undefined;
  avatar_url?: string | undefined;
  role?: UserRole | undefined;
  hasStore?: boolean | undefined;
  stripeCustomerId?: string | undefined;
  [key: string]: unknown;
}

/**
 * User roles in the system
 */
export type UserRole = 'user' | 'admin' | 'event_organizer' | 'venue_owner' | 'caterer';

/**
 * User profile data stored in users table
 */
export interface UserProfile {
  id: string;
  email: string;
  display_name?: string | undefined;
  avatar_url?: string | undefined;
  preferences?: UserPreferences | undefined;
  payment_settings?: PaymentSettings | undefined;
  subscription?: SubscriptionDetails | undefined;
  stripe_customer_id?: string | undefined;
  created_at: string;
  updated_at: string;
}

/**
 * Data structure for updating user profile
 */
export interface UserUpdateData {
  display_name?: string | undefined;
  avatar_url?: string | undefined;
  preferences?: UserPreferences | undefined;
  payment_settings?: PaymentSettings | undefined;
  subscription?: SubscriptionDetails | undefined;
}

// ======== Settings Types ========

/**
 * User settings interface
 */
export interface UserSettings {
  id?: string | undefined;
  userId: string;
  platformCredit: number;
  paymentPreferences: PaymentSettings;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  createdAt?: string | undefined;
  updatedAt?: string | undefined;
}

/**
 * Payment settings interface
 */
export interface PaymentSettings {
  defaultMethod: 'stripe' | 'platform_credit';
  autoRecharge: boolean;
  rechargeAmount: number;
  [key: string]: unknown;
}

/**
 * Notification preferences
 */
export interface NotificationSettings {
  email: boolean;
  push: boolean;
  eventReminders: boolean;
  promotions: boolean;
  [key: string]: boolean;
}

/**
 * Privacy settings
 */
export interface PrivacySettings {
  isPrivate: boolean;
  showEmail: boolean;
  showPhone: boolean;
  [key: string]: boolean;
}

/**
 * Wallet preferences (used in Wallet page)
 */
export interface WalletPreferences {
  showBalance: boolean;
  notifications: {
    transactions: boolean;
    lowBalance: boolean;
    weeklySummary: boolean;
    [key: string]: boolean;
  };
}

/**
 * User preferences (all user configurable options)
 */
export interface UserPreferences {
  theme?: 'light' | undefined| 'dark' | 'system';
  language?: string | undefined;
  timezone?: string | undefined;
  notifications?: NotificationSettings | undefined;
  privacy?: PrivacySettings | undefined;
  wallet?: WalletPreferences | undefined;
  [key: string]: unknown;
}

/**
 * Subscription details
 */
export interface SubscriptionDetails {
  plan?: string | undefined;
  status?: 'active' | undefined| 'trialing' | 'canceled' | 'incomplete';
  currentPeriodEnd?: string | undefined;
  cancelAtPeriodEnd?: boolean | undefined;
  [key: string]: unknown;
}

// ======== Error Types ========

/**
 * User service error types
 */
export enum UserErrorType {
  AUTH_ERROR = 'auth_error',
  NOT_FOUND = 'not_found',
  PERMISSION_DENIED = 'permission_denied',
  VALIDATION_ERROR = 'validation_error',
  STORAGE_ERROR = 'storage_error',
  UNKNOWN_ERROR = 'unknown_error',
}

/**
 * Standardized user error
 */
export interface UserError {
  type: UserErrorType;
  message: string;
  originalError?: unknown | undefined;
}
