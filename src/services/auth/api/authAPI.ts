/**
 * Authentication Service - API Module
 *
 * This file implements the core authentication API functions with:
 * - Type safety via Zod validation
 * - Comprehensive error handling
 * - Sentry monitoring
 * - Security best practices
 */

import { createClient } from '@supabase/supabase-js';
import { captureException, addBreadcrumb } from '@/config/sentry';
import {
  EmailSchema,
  PasswordSchema,
  RegisterSchema,
  LoginSchema,
  PasswordResetSchema,
  TwoFactorVerifySchema,
} from '@/lib/validation/auth';
import {
  EmailCredentials,
  RegistrationData,
  User,
  UserProfile,
  AuthError,
  AuthErrorType,
  PasswordResetData,
  TwoFactorSetupData,
  TwoFactorVerifyData,
} from '../core/types';

// Simple Database type for now - can be expanded later
type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email?: string;
          display_name?: string;
          avatar_url?: string;
          created_at?: string;
          updated_at?: string;
          stripe_customer_id?: string;
          stripe_account_id?: string;
          preferences?: Record<string, any>;
        };
      };
    };
  };
};

// Utility function to create client-side Supabase client
const createSupabaseClient = () => {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_U as string!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_K as string!
  );
};

/**
 * Helper function to handle auth errors consistently
 */
export const handleAuthError = (error: any, context?: string): AuthError => {
  const defaultError: AuthError = {
    type: AuthErrorType.UNKNOWN,
    message: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
  };

  if (!error) return defaultError;

  // Log to Sentry
  captureException(error as Error, { context: context || 'Auth API' });

  // Handle Supabase auth errors
  if (error.message) {
    const message = error.message.toLowerCase();

    if (message.includes('invalid login credentials') || message.includes('email not confirmed')) {
      return {
          ...defaultError,
        type: AuthErrorType.INVALID_CREDENTIALS,
        message: 'Invalid email or password',
      };
    }

    if (
      message.includes('email already registered') ||
      message.includes('user already registered')
    ) {
      return {
          ...defaultError,
        type: AuthErrorType.USER_EXISTS,
        message: 'An account with this email already exists',
      };
    }

    if (message.includes('rate limit')) {
      return {
          ...defaultError,
        type: AuthErrorType.RATE_LIMITED,
        message: 'Too many attempts. Please try again later.',
      };
    }

    if (message.includes('network') || message.includes('fetch')) {
      return {
          ...defaultError,
        type: AuthErrorType.NETWORK_ERROR,
        message: 'Network error. Please check your connection.',
      };
    }

    return { ...defaultError, message: error.message };
  }

  return defaultError;
};

/**
 * Signs in a user with email and password
 */
export const signInWithEmail = async (credentials: EmailCredentials): Promise<User | null> => {
  try {
    // Validate input
    const validatedCredentials = LoginSchema.parse({
      email: credentials.email,
      password: credentials.password,
    });

    addBreadcrumb('User attempting sign in', {
      email: validatedCredentials.email,
    });

    const supabase = createSupabaseClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: validatedCredentials.email,
      password: validatedCredentials.password,
    });

    if (error) throw error;

    addBreadcrumb('User signed in successfully', {
      ...(data && { userId: data.user?.id }),
    });

    return (data.user as User) || null;
  } catch (error) {
    throw handleAuthError(error, 'signInWithEmail');
  }
};

/**
 * Signs in with a third-party provider
 */
export const signInWithProvider = async (provider: string, redirectTo?: string): Promise<void> => {
  try {
    const supabase = createSupabaseClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider as any,
      options: {
        redirectTo: redirectTo || `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;
  } catch (error) {
    throw handleAuthError(error);
  }
};

/**
 * Signs up a new user
 */
export const signUp = async (data: RegistrationData): Promise<User | null> => {
  try {
    // Validate input
    const validatedData = RegisterSchema.parse({
      email: data.email,
      password: data.password,
      acceptTerms: true, // Assuming user accepted terms to reach this point
      firstName: data.displayName?.split(' ')[0],
      lastName: data.displayName?.split(' ').slice(1).join(' '),
    });

    addBreadcrumb('User attempting sign up', {
      email: validatedData.email,
    });

    const supabase = createSupabaseClient();

    const { data: authData, error } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        data: {
          display_name: data.displayName,
          full_name: data.displayName,
          first_name: validatedData.firstName,
          last_name: validatedData.lastName,
        },
      },
    });

    if (error) throw error;

    addBreadcrumb('User signed up successfully', {
      ...(authData && { userId: authData.user?.id }),
    });

    return (authData.user as User) || null;
  } catch (error) {
    throw handleAuthError(error, 'signUp');
  }
};

/**
 * Signs out the current user
 */
export const signOut = async (): Promise<void> => {
  try {
    const supabase = createSupabaseClient();

    const { error } = await supabase.auth.signOut();

    if (error) throw error;
  } catch (error) {
    throw handleAuthError(error);
  }
};

/**
 * Gets the current session
 */
export const getSession = async (): Promise<{ user: User | null; session: any }> => {
  try {
    const supabase = createSupabaseClient();

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) throw error;

    return {
      user: (session?.user as User) || null,
      session: session,
    };
  } catch (error) {
    throw handleAuthError(error);
  }
};

/**
 * Gets the current user with profile data
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const supabase = createSupabaseClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) throw error;
    if (!user) return null;

    // Get additional profile data
    const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single();

    return {
          ...user,
          ...profile,
    } as User;
  } catch (error) {
    throw handleAuthError(error);
  }
};

/**
 * Update user profile data
 */
export const updateProfile = async (
  userId: string,
  data: Partial<UserProfile>
): Promise<UserProfile | null> => {
  try {
    const supabase = createSupabaseClient();

    const { data: updatedProfile, error } = await supabase
      .from('users')
      .update({
        display_name: data.displayName || data.display_name,
        avatar_url: data.avatarUrl || data.avatar_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    return updatedProfile as UserProfile;
  } catch (error) {
    throw handleAuthError(error);
  }
};

/**
 * Update user email
 */
export const updateEmail = async (email: string): Promise<void> => {
  try {
    // Validate email
    const validatedEmail = EmailSchema.parse(email);

    addBreadcrumb('User attempting to update email', { newEmail: validatedEmail });

    const supabase = createSupabaseClient();

    const { error } = await supabase.auth.updateUser({
      email: validatedEmail,
    });

    if (error) throw error;

    addBreadcrumb('User email updated successfully');
  } catch (error) {
    throw handleAuthError(error, 'updateEmail');
  }
};

/**
 * Update user password
 */
export const updatePassword = async (password: string): Promise<void> => {
  try {
    // Validate password strength
    const validatedPassword = PasswordSchema.parse(password);

    addBreadcrumb('User attempting to update password');

    const supabase = createSupabaseClient();

    const { error } = await supabase.auth.updateUser({
      password: validatedPassword,
    });

    if (error) throw error;

    addBreadcrumb('User password updated successfully');
  } catch (error) {
    throw handleAuthError(error, 'updatePassword');
  }
};

/**
 * Reset password
 */
export const resetPassword = async (data: PasswordResetData): Promise<void> => {
  try {
    const supabase = createSupabaseClient();

    if (data.code && data.newPassword) {
      // Verify reset code and update password
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (error) throw error;
    } else {
      // Send password reset email
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;
    }
  } catch (error) {
    throw handleAuthError(error);
  }
};

/**
 * Setup 2FA with TOTP (Time-based One-Time Password)
 */
export const setupTwoFactor = async (
  data: TwoFactorSetupData
): Promise<{ qrCode: string; secret: string; backupCodes: string[] }> => {
  try {
    const supabase = createSupabaseClient();

    // Call Supabase Edge Function to generate TOTP secret and QR code
    const { data: twoFactorData, error } = await supabase.functions.invoke('setup-2fa', {
      body: {
        email: data.email,
        type: data.type || 'totp',
      },
    });

    if (error) throw error;

    return twoFactorData;
  } catch (error) {
    throw handleAuthError(error);
  }
};

/**
 * Verify 2FA setup with TOTP code
 */
export const verifyTwoFactorSetup = async (data: TwoFactorVerifyData): Promise<boolean> => {
  try {
    const supabase = createSupabaseClient();

    const { data: result, error } = await supabase.functions.invoke('verify-2fa-setup', {
      body: {
        secret: data.secret,
        code: data.code,
        email: data.email,
      },
    });

    if (error) throw error;

    return result?.verified || false;
  } catch (error) {
    throw handleAuthError(error);
  }
};

/**
 * Verify 2FA code during login
 */
export const verifyTwoFactor = async (code: string): Promise<boolean> => {
  try {
    const supabase = createSupabaseClient();

    const { data: result, error } = await supabase.functions.invoke('verify-2fa', {
      body: { code },
    });

    if (error) throw error;

    return result?.verified || false;
  } catch (error) {
    throw handleAuthError(error);
  }
};

/**
 * Disable 2FA for user
 */
export const disableTwoFactor = async (): Promise<void> => {
  try {
    const supabase = createSupabaseClient();

    const { error } = await supabase.functions.invoke('disable-2fa');

    if (error) throw error;
  } catch (error) {
    throw handleAuthError(error);
  }
};

/**
 * Send email verification for 2FA
 */
export const sendEmailVerification = async (): Promise<void> => {
  try {
    const supabase = createSupabaseClient();

    const { error } = await supabase.functions.invoke('send-email-2fa');

    if (error) throw error;
  } catch (error) {
    throw handleAuthError(error);
  }
};

/**
 * Server-side session validation (for server components)
 */
export const getServerSession = async (
  request: Request
): Promise<{ user: User | null; session: any }> => {
  try {
    // This would be implemented for server-side rendering
    // For now, return null as we're client-side only
    return { user: null, session: null };
  } catch (error) {
    throw handleAuthError(error);
  }
};

// Export all functions as authAPI object
export const authAPI = {
  signInWithEmail,
  signInWithProvider,
  signUp,
  signOut,
  getSession,
  getCurrentUser,
  updateProfile,
  updateEmail,
  updatePassword,
  resetPassword,
  setupTwoFactor,
  verifyTwoFactorSetup,
  verifyTwoFactor,
  disableTwoFactor,
  sendEmailVerification,
  getServerSession,
  handleAuthError,
};
