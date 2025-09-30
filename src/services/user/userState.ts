import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types/auth';

export interface UserState {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

export interface UserUpdateData {
  display_name?: string | undefined;
  avatar_url?: string | undefined;
  preferences?: Record<string, unknown> | undefined;
  payment_settings?: Record<string, unknown> | undefined;
  subscription?: Record<string, unknown> | undefined;
}

// Get current user state
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    // Get additional user data from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.warn('Error fetching user data:', userError);
    }

    // Combine auth user with profile data
    const combinedUser: User = {
      ...user,
      email: user.email || '',
      name: userData?.display_name || user.user_metadata?.name || user.email?.split('@')[0] || '',
      username: user.user_metadata?.username || userData?.display_name || user.email?.split('@')[0] || '',
      bio: user.user_metadata?.bio || '',
      profilePicture: userData?.avatar_url || user.user_metadata?.avatar_url || '',
      avatar: userData?.avatar_url || user.user_metadata?.avatar_url || '',
      display_name: userData?.display_name || user.user_metadata?.name || '',
      avatar_url: userData?.avatar_url || user.user_metadata?.avatar_url || '',
      role: (user.user_metadata?.role as 'user' | 'admin' | 'event_organizer' | 'venue_owner' | 'caterer') || 'user',
      hasStore: user.user_metadata?.hasStore || false,
      stripeCustomerId: userData?.stripe_customer_id || user.user_metadata?.stripeCustomerId || '',
      updated_at: user.updated_at || new Date().toISOString(),
      user_metadata: user.user_metadata || {},
    };

    return combinedUser;

  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }

};

// Update user data in users table

export const updateUserData = async (userId: string, updates: UserUpdateData): Promise<boolean> => {
  try {
    // First get current user email for required field
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.email) {
      console.error('Error getting authenticated user:', authError);
      return false;
    }

    // Update in users table
    const { error } = await supabase.from('users').upsert({
      id: userId,
      email: user.email, // Required field
          ...updates,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error updating user data:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error updating user data:', error);
    return false;
  }

};

// Get user by ID

export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user by ID:', error);
      return null;
    }

    const user: User = {
      id: data.id,
      email: data.email,
      name: data.display_name || '',
      username: data.display_name || '',
      display_name: data.display_name || '',
      avatar_url: data.avatar_url || '',
      created_at: data.created_at,
      updated_at: data.updated_at,
      user_metadata: {},
      bio: '',
      profilePicture: data.avatar_url || '',
      avatar: data.avatar_url || '',
      role: 'user',
      hasStore: false,
      stripeCustomerId: data.stripe_customer_id || '',
    };

    return user;
  } catch (error) {
    console.error('Unexpected error fetching user by ID:', error);
    return null;
  }

};

// Create user profile

export const createUserProfile = async (user: User): Promise<boolean> => {
  try {
    const { error } = await supabase.from('users').insert({
      id: user.id,
      email: user.email,
      display_name: user.name || user.email?.split('@')[0],
      avatar_url: user.avatar_url,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error creating user profile:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error creating user profile:', error);
    return false;
  }

};

// Delete user profile

export const deleteUserProfile = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('Error deleting user profile:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error deleting user profile:', error);
    return false;
  }

};

// Update user avatar

export const updateUserAvatar = async (userId: string, avatarUrl: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user avatar:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error updating user avatar:', error);
    return false;
  }

};

// Get user preferences

export const getUserPreferences = async (userId: string): Promise<Record<string, unknown> | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('preferences')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user preferences:', error);
      return null;
    }

    // Handle the Json type from Supabase properly
    const preferences = data.preferences;
    if (typeof preferences === 'object' && preferences !== null && !Array.isArray(preferences)) {
      return preferences as Record<string, unknown>;
    }

    return {};
  } catch (error) {
    console.error('Unexpected error fetching user preferences:', error);
    return null;
  }

};

// Update user preferences

export const updateUserPreferences = async (
  userId: string,
  preferences: Record<string, unknown>
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        preferences,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user preferences:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error updating user preferences:', error);
    return false;
  }

};