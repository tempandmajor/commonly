import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User } from '@/types/auth';
import { PromotionalCampaignService } from '@/services/campaigns/promotionalCampaigns';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: any } | undefined | undefined | undefined>;
  signUp: (email: string, password: string, metadata?: unknown) => Promise<{ error?: any }>;
  signOut: () => Promise<void>;
  updateUserData: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mounted = useRef(true);
  const processingAuth = useRef(false);
  const authInitialized = useRef(false);

  const fetchUserProfile = async (supabaseUser: SupabaseUser) => {
    if (!mounted.current || processingAuth.current) return null;

    try {
      console.debug('AuthProvider: Fetching user profile for:', supabaseUser.id);

      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user profile:', error);
        return null;
      }

      // If no profile exists, create one
      if (!profile) {
        console.debug('AuthProvider: No profile found, creating new one');
        const profileData = {
          id: supabaseUser.id,
          email: supabaseUser.email!,
          display_name:
            supabaseUser.user_metadata?.display_name ||
            supabaseUser.user_metadata?.name ||
            supabaseUser.email?.split('@')[0] ||
            'User',
          username: supabaseUser.user_metadata?.username || null,
          is_admin: false,
          avatar_url: supabaseUser.user_metadata?.avatar_url || null,
        };

        const { data: newProfile, error: createError } = await supabase
          .from('users')
          .insert(profileData)
          .select()
          .single();

        if (createError) {
          console.error('Error creating user profile:', createError);
          // Return a basic profile even if creation fails
          return {
            id: supabaseUser.id,
            email: supabaseUser.email!,
            display_name:
              supabaseUser.user_metadata?.display_name ||
              supabaseUser.user_metadata?.name ||
              'User',
            username: supabaseUser.user_metadata?.username,
            is_admin: false,
            avatar_url: supabaseUser.user_metadata?.avatar_url,
          };
        }

        console.debug('AuthProvider: Created new profile:', newProfile);
        return newProfile;
      }

      console.debug('AuthProvider: Found existing profile:', {
        id: profile.id,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url ? 'has_avatar' : 'no_avatar',
      });
      return profile;
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return null;
    }
  };

  const transformUser = (supabaseUser: SupabaseUser, profile: any): User => {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email!,
      ...(profile && { name: profile.display_name || supabaseUser.user_metadata?.name || 'User' }),
      ...(profile && { username: profile.username || supabaseUser.user_metadata?.username || '' }),
      ...(profile && { display_name: profile.display_name || supabaseUser.user_metadata?.display_name || '' }),
      ...(profile && { avatar_url: profile.avatar_url ?? supabaseUser.user_metadata?.avatar_url ?? null }),
      ...(profile && { created_at: profile.created_at || supabaseUser.created_at }),
      ...(profile && { updated_at: profile.updated_at || new Date().toISOString() }),

      ...(profile && { isAdmin: profile.is_admin || false }),
      user_metadata: supabaseUser.user_metadata || {},
      ...(profile && { bio: profile.bio || '' }),
      ...(profile && { profilePicture: profile.avatar_url ?? supabaseUser.user_metadata?.avatar_url ?? '' }),
      ...(profile && { avatar: profile.avatar_url ?? supabaseUser.user_metadata?.avatar_url ?? '' }),
      role: (supabaseUser.user_metadata?.role as 'user' | 'admin' | 'event_organizer' | 'venue_owner' | 'caterer') || 'user',
      hasStore: supabaseUser.user_metadata?.hasStore || false,
      ...(profile && { stripeCustomerId: profile.stripe_customer_id || supabaseUser.user_metadata?.stripeCustomerId || '' }),

    };

  };

  useEffect(() => {
    mounted.current = true;

    // Get initial session
    const getInitialSession = async () => {
      if (processingAuth.current || !mounted.current) return;

      try {
        processingAuth.current = true;
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user && mounted.current) {
          const profile = await fetchUserProfile(session.user);
          if (mounted.current) {
            const transformedUser = transformUser(session.user, profile);
            setUser(transformedUser);
          }
        } else {
        }
      } catch (_error) {
        // Error handling silently ignored
      } finally {
        if (mounted.current) {
          setIsLoading(false);
          processingAuth.current = false;
          authInitialized.current = true;
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted.current || processingAuth.current) {
        return;
      }

      try {
        processingAuth.current = true;

        if (session?.user) {
          const profile = await fetchUserProfile(session.user);
          if (mounted.current) {
            const transformedUser = transformUser(session.user, profile);
            setUser(transformedUser);

            // Process promotional campaigns for new signups
            // Check if this is a recently created user (within last 5 minutes)
            const userCreatedAt = new Date(session.user.created_at);
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

            if (userCreatedAt > fiveMinutesAgo) {
              // Process signup campaigns asynchronously (don't block auth flow)
              setTimeout(async () => {
                try {
                  await PromotionalCampaignService.processUserSignupCampaigns(session.user.id);
                } catch (error) {
                  console.error('Error processing signup campaigns:', error);
                }
              }, 1000); // Delay to ensure user setup is complete
            }
          }
        } else {
          if (mounted.current) {
            setUser(null);
          }
        }
      } catch (_error) {
        // Error handling silently ignored
      } finally {
        if (mounted.current) {
          setIsLoading(false);
          processingAuth.current = false;
        }
      }
    });

    return () => {
      mounted.current = false;
      processingAuth.current = false;
      authInitialized.current = false;
      subscription.unsubscribe();
    };

  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        // Handle specific error cases
        if (error.message.includes('Email not confirmed')) {
          toast.error('Please check your email and confirm your account before signing in.');
        } else if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password. Please check your credentials and try again.');
        } else {
          toast.error(error.message || 'Failed to sign in');
        }
        return { error };
      }

      toast.success('Successfully signed in!');
      return { error: null };
    } catch (error: unknown) {
      toast.error('An unexpected error occurred');
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, metadata?: unknown) => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
          data: metadata || {},
        },
      });

      if (error) {
        // Handle specific error cases
        if (error.message.includes('already registered')) {
          toast.error('An account with this email already exists. Please sign in instead.');
        } else if (error.message.includes('Password should be at least')) {
          toast.error('Password must be at least 6 characters long');
        } else if (error.message.includes('Invalid email')) {
          toast.error('Please enter a valid email address');
        } else {
          toast.error(error.message || 'Failed to create account');
        }
        return { error };
      }

      if (data.user && !data.session) {
        toast.success('Please check your email to confirm your account before signing in');
      } else {
        toast.success('Account created successfully!');
      }

      return { error: null };
    } catch (error: unknown) {
      toast.error('An unexpected error occurred');
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error(error.message);
      } else {
        setUser(null);
        toast.success('Successfully signed out');
      }
    } catch (error: unknown) {
      toast.error('Error signing out');
    }
  };

  const updateUserData = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    ...(user && { isAdmin: user.isAdmin || false }),
    isLoading,
    signIn,
    signUp,
    signOut,
    updateUserData,

  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
