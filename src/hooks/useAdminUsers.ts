import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  profilePicture?: string | undefined;
  createdAt: Date;
  stripeConnectId?: string | undefined;
  isSuspended: boolean;
}

/**
 * Maps a database user to the AdminUser interface
 * Transforms profiles and metadata from different tables into a consistent format
 */
const mapDbUserToAdminUser = (user: any, profile?: any): AdminUser => {
  return {
    id: user.id,
    name: profile?.full_name || user.email?.split('@')[0] || 'Unknown',
    email: user.email || '',
    role: user.user_metadata?.role || 'user',
    profilePicture: profile?.avatar_url || undefined,
    createdAt: new Date(user.created_at),
    stripeConnectId: profile?.stripe_connect_id || undefined,
    isSuspended: user.banned_until ? new Date(user.banned_until) > new Date() : false,
  };
};

export const useAdminUsers = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * Fetches all users from the database with their profiles
   * Joins user auth data with profile data
   */
  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch all users using Supabase admin functions
      const { data: usersData, error: usersError } = await supabase.functions.invoke('admin-get-users', {
        body: {},
      });

      if (usersError) throw usersError;

      // Fetch user profiles
      const { data: profilesData, error: profilesError } = await supabase.from('users').select('*');

      if (profilesError) throw profilesError;

      // Create a map of profiles by user_id
      const profilesMap = (profilesData || []).reduce(
        (acc: Record<string, any>, profile: any) => {
          if (profile.user_id) {
            acc[profile.user_id] = profile;
          }
          return acc;
        },
        {}
      );

      // Map users with their profiles
      const mappedUsers = (usersData?.users || []).map((user: any) =>
        mapDbUserToAdminUser(user, profilesMap[user.id])
      );

      setUsers(mappedUsers);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Suspends a user by setting their banned_until date to 100 years in the future
   * @param userId - ID of the user to suspend
   */
  const suspendUser = async (userId: string) => {
    try {
      // Set banned_until to 100 years from now (effectively permanent)
      const banDate = new Date();
      banDate.setFullYear(banDate.getFullYear() + 100);

      const { data, error } = await supabase.functions.invoke('admin-ban-user', {
        body: {
          userId,
          bannedUntil: banDate.toISOString(),
        },
      });

      if (error) throw error;

      // Update local state
      setUsers(users.map(user => (user.id === userId ? { ...user, isSuspended: true } : user)));

      toast.success('User suspended successfully');
    } catch (error) {
      toast.error('Failed to suspend user');
    }
  };

  /**
   * Reactivates a suspended user by removing their ban
   * @param userId - ID of the user to reactivate
   */
  const reactivateUser = async (userId: string) => {
    try {
      // Set banned_until to null to remove the ban
      const { data, error } = await supabase.functions.invoke('admin-ban-user', {
        body: {
          userId,
          bannedUntil: null,
        },
      });

      if (error) throw error;

      // Update local state
      setUsers(users.map(user => (user.id === userId ? { ...user, isSuspended: false } : user)));

      toast.success('User reactivated successfully');
    } catch (error) {
      toast.error('Failed to reactivate user');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    fetchUsers,
    suspendUser,
    reactivateUser,
  };

};

