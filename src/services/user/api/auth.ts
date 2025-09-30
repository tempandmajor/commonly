/**
 * Authentication Operations for User Service
 * Rebuilt with proper TypeScript types and patterns
 */

import { supabase, getUserProfileFromDB, clearUserCache } from '../core/client';
import { User } from '../core/types';
import { handleUserError } from '../core/errors';

/**
 * User profile data from database
 */
interface UserProfileData {
  id: string;
  display_name?: string | undefined;
  avatar_url?: string | undefined;
  email?: string | undefined;
  stripe_customer_id?: string | undefined;
  created_at?: string | undefined;
  updated_at?: string | undefined;
}

/**
 * Auth user metadata interface
 */
interface UserMetadata {
  name?: string | undefined;
  username?: string | undefined;
  bio?: string | undefined;
  avatar_url?: string | undefined;
  role?: string | undefined;
  hasStore?: boolean | undefined;
  stripeCustomerId?: string | undefined;
  [key: string]: any;
}

/**
 * Supabase auth user interface
 */
interface AuthUser {
  id: string;
  email?: string | undefined;
  user_metadata?: UserMetadata | undefined;
  updated_at?: string | undefined;
  created_at?: string | undefined;
  aud?: string | undefined;
  role?: string | undefined;
}

/**
 * Get the currently authenticated user with extended profile data
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      throw handleUserError(error, 'Error getting current user');
    }

    if (!user) {
      return null;
    }

    return await buildUserFromAuthUser(user);
  } catch (error) {
    console.error('[Auth] Failed to get current user:', error);
    return null;
  }
}

/**
 * Get user by ID with extended profile data
 */
export async function getUserById(userId: string): Promise<User | null> {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.admin.getUserById(userId);

    if (error || !user) {
      return null;
    }

    return await buildUserFromAuthUser(user);
  } catch (error) {
    console.error('[Auth] Failed to get user by ID:', error);
    return null;
  }
}

/**
 * Get user by username (uses display_name for backward compatibility)
 */
export async function getUserByUsername(username: string): Promise<User | null> {
  try {
    // Search by display_name in users table
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('display_name', username)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data) {
      return null;
    }

    // Get corresponding auth user
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.admin.getUserById(data.id);

    if (authError || !authUser) {
      return null;
    }

    return await buildUserFromAuthUser(authUser, data);
  } catch (error) {
    console.error('[Auth] Failed to get user by username:', error);
    return null;
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<boolean> {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('[Auth] Failed to sign out:', error);
    return false;
  }
}

/**
 * Update user metadata
 */
export async function updateUserMetadata(metadata: Record<string, unknown>): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.updateUser({
      data: metadata,
    });

    if (error) {
      throw error;
    }

    // Clear cache to ensure fresh data
    if (data.user) {
      clearUserCache(data.user.id);
    }

    return true;
  } catch (error) {
    console.error('[Auth] Failed to update user metadata:', error);
    return false;
  }
}

/**
 * Update user email
 */
export async function updateUserEmail(email: string): Promise<boolean> {
  try {
    const { error } = await supabase.auth.updateUser({
      email,
    });

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('[Auth] Failed to update user email:', error);
    return false;
  }
}

/**
 * Update user password
 */
export async function updateUserPassword(password: string): Promise<boolean> {
  try {
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('[Auth] Failed to update user password:', error);
    return false;
  }
}

/**
 * Refresh the current user session
 */
export async function refreshSession(): Promise<boolean> {
  try {
    const { error } = await supabase.auth.refreshSession();

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('[Auth] Failed to refresh session:', error);
    return false;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    return !error && !!user;
  } catch (error) {
    return false;
  }
}

/**
 * Get current session
 */
export async function getCurrentSession() {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      throw error;
    }

    return session;
  } catch (error) {
    console.error('[Auth] Failed to get current session:', error);
    return null;
  }
}

/**
 * Build User object from auth user and optional profile data
 */
async function buildUserFromAuthUser(
  authUser: AuthUser,
  profileData?: UserProfileData
): Promise<User> {
  // Get profile data if not provided
  const userData = profileData || await getUserProfileFromDB(authUser.id);

  // Extract safe values with proper fallbacks
  const email = authUser.email || '';
  const metadata = authUser.user_metadata || {};

  // Build display name with priority: userData.display_name > metadata.name > email prefix
  const displayName = userData?.display_name ||
                     metadata.name ||
                     email.split('@')[0] ||
                     'User';

  // Build username with similar priority
  const username = metadata.username ||
                  userData?.display_name ||
                  email.split('@')[0] ||
                  'user';

  // Build avatar URL with priority: userData.avatar_url > metadata.avatar_url
  const avatarUrl = userData?.avatar_url || metadata.avatar_url;

  // Safely extract role
  const role = typeof metadata.role === 'string' ? metadata.role : 'user';

  // Build the user object
  const user: User = {
    id: authUser.id,
    email,
    name: displayName,
    username,
    display_name: displayName,
    bio: typeof metadata.bio === 'string' ? metadata.bio : '',
    avatar: avatarUrl,
    profilePicture: avatarUrl,
    role,
    hasStore: Boolean(metadata.hasStore),
    stripeCustomerId: userData?.stripe_customer_id || (typeof metadata.stripeCustomerId === 'string' ? metadata.stripeCustomerId : undefined),
    updated_at: authUser.updated_at || new Date().toISOString(),
    created_at: authUser.created_at || new Date().toISOString(),
    user_metadata: metadata,
    aud: authUser.aud,
  };

  return user;
}

/**
 * Validate user data structure
 */
export function validateUserData(data: any): data is Partial<User> {
  return (
    data &&
    typeof data === 'object' &&
    (typeof data.id === 'string' || data.id === undefined) &&
    (typeof data.email === 'string' || data.email === undefined) &&
    (typeof data.name === 'string' || data.name === undefined)
  );
}

/**
 * Sanitize user metadata before saving
 */
export function sanitizeUserMetadata(metadata: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(metadata)) {
    // Only allow safe data types
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === null
    ) {
      sanitized[key] = value;
    } else if (Array.isArray(value)) {
      // Allow arrays of primitives
      sanitized[key] = value.filter(item =>
        typeof item === 'string' ||
        typeof item === 'number' ||
        typeof item === 'boolean'
      );
    } else if (typeof value === 'object' && value !== null) {
      // Recursively sanitize nested objects (shallow)
      sanitized[key] = sanitizeUserMetadata(value);
    }
  }

  return sanitized;
}

/**
 * Get user permissions based on role
 */
export function getUserPermissions(user: User): {
  canCreateEvents: boolean;
  canManageStore: boolean;
  canAccessAdmin: boolean;
  canModerateContent: boolean;
} {
  const role = user.role || 'user';

  return {
    canCreateEvents: ['admin', 'moderator', 'creator', 'user'].includes(role),
    canManageStore: ['admin', 'moderator', 'creator'].includes(role) || user.hasStore,
    canAccessAdmin: ['admin'].includes(role),
    canModerateContent: ['admin', 'moderator'].includes(role),
  };
}

/**
 * Check if user has specific permission
 */
export function hasPermission(user: User, permission: keyof ReturnType<typeof getUserPermissions>): boolean {
  const permissions = getUserPermissions(user);
  return permissions[permission];

}