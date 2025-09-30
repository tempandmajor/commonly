/**
 * Authentication Service - Main Export File
 *
 * This file provides the main exports for the authentication service module.
 */

// Core API exports
export { authAPI } from './api/authAPI';

// Hook exports for React components
export { useAuth, AuthProvider } from './hooks/useAuth';

// Type exports
export type {
  User,
  UserProfile,
  AuthState,
  EmailCredentials,
  RegistrationData,
  PasswordResetData,
  TwoFactorSetupData,
  TwoFactorVerifyData,
  AuthError,
  AuthErrorType,
  AuthProvider as AuthProviderType,
} from './core/types';

// Export compatibility layers for legacy code
export {
  AuthService,
  SocialAuthService,
  default as LegacyAuthService,
} from './compatibility/authService';
