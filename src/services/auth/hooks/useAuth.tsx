/**
 * Authentication Service - useAuth Hook
 *
 * This hook provides authentication state and methods for React components.
 */

import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authAPI } from '../api/authAPI';
import type {
  User,
  AuthState,
  EmailCredentials,
  RegistrationData,
  PasswordResetData,
  UserProfile,
} from '../core/types';
import { createClient } from '@supabase/supabase-js';

// Context interface
interface AuthContextType extends AuthState {
  // Session management
  login: (credentials: EmailCredentials) => Promise<User | null>;
  loginWithProvider: (provider: string, redirectTo?: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (data: RegistrationData) => Promise<User | null>;
  refreshUser: () => Promise<void>;

  // User profile management
  updateUserProfile: (data: Partial<UserProfile>) => Promise<UserProfile | null>;
  updateUserEmail: (email: string) => Promise<void>;
  updateUserPassword: (password: string) => Promise<void>;
  resetUserPassword: (data: PasswordResetData) => Promise<void>;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  error: null,
  login: async () => null,
  loginWithProvider: async () => {},
  logout: async () => {},
  signup: async () => null,
  refreshUser: async () => {},
  updateUserProfile: async () => null,
  updateUserEmail: async () => {},
  updateUserPassword: async () => {},
  resetUserPassword: async () => {},
});

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  });

  const navigate = useNavigate();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_U as string!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_K as string!
  );

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { user, session } = await authAPI.getSession();
        setState({ user, session, loading: false, error: null });
      } catch (error) {
        setState({ user: null, session: null, loading: false, error: error as Error });
      }
    };

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        // Get user with profile data
        const user = await authAPI.getCurrentUser();
        setState({ user, session, loading: false, error: null });
      } else {
        setState({ user: null, session: null, loading: false, error: null });
      }
    });

    initializeAuth();

    // Cleanup subscription on unmount
    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase]);

  // Login with email and password
  const login = async (credentials: EmailCredentials) => {
    setState({ ...state, loading: true, error: null });
    try {
      const user = await authAPI.signInWithEmail(credentials);
      return user;
    } catch (error) {
      setState({ ...state, loading: false, error: error as Error });
      return null;
    }
  };

  // Login with a third-party provider
  const loginWithProvider = async (provider: string, redirectTo?: string) => {
    setState({ ...state, loading: true, error: null });
    try {
      await authAPI.signInWithProvider(provider, redirectTo);
    } catch (error) {
      setState({ ...state, loading: false, error: error as Error });
    }
  };

  // Sign out
  const logout = async () => {
    setState({ ...state, loading: true, error: null });
    try {
      await authAPI.signOut();
      setState({ user: null, session: null, loading: false, error: null });
      navigate('/login');
    } catch (error) {
      setState({ ...state, loading: false, error: error as Error });
    }
  };

  // Sign up a new user
  const signup = async (data: RegistrationData) => {
    setState({ ...state, loading: true, error: null });
    try {
      const user = await authAPI.signUp(data);
      toast.success('Account created successfully! Please check your email for confirmation.');
      return user;
    } catch (error) {
      setState({ ...state, loading: false, error: error as Error });
      return null;
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    try {
      const user = await authAPI.getCurrentUser();
      if (user) {
        setState({ ...state, user, loading: false });
      }
    } catch (_error) {
      // Error handling silently ignored
    }
  };

  // Update user profile
  const updateUserProfile = async (data: Partial<UserProfile>) => {
    try {
      if (!state.user?.id) {
        throw new Error('User not authenticated');
      }

      const updatedProfile = await authAPI.updateProfile(state.user.id, data);

      if (updatedProfile) {
        await refreshUser();
        toast.success('Profile updated successfully');
      }

      return updatedProfile;
    } catch (error) {
      toast.error('Failed to update profile');
      return null;
    }
  };

  // Update user email
  const updateUserEmail = async (email: string) => {
    try {
      await authAPI.updateEmail(email);
    } catch (error) {
      throw error;
    }
  };

  // Update user password
  const updateUserPassword = async (password: string) => {
    try {
      await authAPI.updatePassword(password);
    } catch (error) {
      throw error;
    }
  };

  // Reset user password
  const resetUserPassword = async (data: PasswordResetData) => {
    try {
      await authAPI.resetPassword(data);
    } catch (error) {
      throw error;
    }
  };

  const value = {
          ...state,
    login,
    loginWithProvider,
    logout,
    signup,
    refreshUser,
    updateUserProfile,
    updateUserEmail,
    updateUserPassword,
    resetUserPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
