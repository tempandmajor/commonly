/**
 * Authentication Service - Core Types
 *
 * This file defines all TypeScript interfaces and types used by the auth service.
 */

/**
 * User interface that extends Supabase User with additional profile data
 */
export interface User {
  id: string;
  email?: string | undefined;
  display_name?: string | undefined;
  avatar_url?: string | undefined;
  created_at?: string | undefined;
  updated_at?: string | undefined;
  stripe_customer_id?: string | undefined;
  stripe_account_id?: string | undefined;
  preferences?: Record<string, any> | undefined;
  // Add any other user profile fields here
}

/**
 * User profile data for updates
 */
export interface UserProfile {
  id?: string | undefined;
  email?: string | undefined;
  displayName?: string | undefined;
  display_name?: string | undefined;
  avatarUrl?: string | undefined;
  avatar_url?: string | undefined;
  createdAt?: string | undefined;
  created_at?: string | undefined;
  updatedAt?: string | undefined;
  updated_at?: string | undefined;
  preferences?: Record<string, any> | undefined;
}

/**
 * Authentication state interface
 */
export interface AuthState {
  user: User | null;
  session: any;
  loading: boolean;
  error: Error | null;
}

/**
 * Email and password login credentials
 */
export interface EmailCredentials {
  email: string;
  password: string;
}

/**
 * User registration data
 */
export interface RegistrationData {
  email: string;
  password: string;
  displayName: string;
  full_name?: string | undefined;
  metadata?: Record<string, any> | undefined;
}

/**
 * Password reset data
 */
export interface PasswordResetData {
  email: string;
  code?: string | undefined;
  newPassword?: string | undefined;
}

/**
 * Two-factor authentication setup data
 */
export interface TwoFactorSetupData {
  email: string;
  type?: 'totp' | undefined| 'email';
}

/**
 * Two-factor authentication verification data
 */
export interface TwoFactorVerifyData {
  email: string;
  secret: string;
  code: string;
}

/**
 * Authentication error types
 */
export enum AuthErrorType {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  USER_EXISTS = 'USER_EXISTS',
  RATE_LIMITED = 'RATE_LIMITED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Authentication error interface
 */
export interface AuthError {
  type: AuthErrorType;
  message: string;
  code?: string | undefined;
}

/**
 * Social authentication providers
 */
export type AuthProvider = 'google' | 'facebook' | 'apple' | 'github' | 'twitter' | 'discord';
