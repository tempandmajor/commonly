import { useState, useEffect, useCallback, useRef } from 'react';
import { User } from '@/types/auth';
import { Post } from '@/lib/types/post';
import { getUserById, getUserByUsername } from '@/services/user';
import { supabase } from '@/integrations/supabase/client';

export interface UseProfileDataReturn {
  isLoading: boolean;
  userData: User | null;
  userPosts: Post[] | null;
  followersCount: number;
  followingCount: number;
  error: string | null;
  isOffline: boolean;
  retry: () => void;
}

export const useProfileData = (usernameOrId: string | undefined): UseProfileDataReturn => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userData, setUserData] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<Post[] | null>(null);
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [followingCount, setFollowingCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);

  // Refs to prevent race conditions
  const mounted = useRef(true);
  const lastFetchId = useRef<string | undefined>(undefined);
  const isLoadingRef = useRef(false);

  const retry = useCallback(() => {
    setError(null);
    setIsLoading(true);
    setRetryCount(count => count + 1);
  }, []);

  // Fetch user posts from database
  const fetchUserPosts = useCallback(async (userId: string) => {
    try {
      const { data: posts, error: postsError } = await supabase
        .from('user_posts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (postsError) {
        console.error('Error fetching user posts:', postsError);
        return [];
      }

      return posts || [];
    } catch (err) {
      console.error('Error fetching user posts:', err);
      return [];
    }
  }, []);

  // Fetch follower/following counts
  const fetchFollowCounts = useCallback(async (userId: string) => {
    try {
      // Get followers count
      const { count: followersCount, error: followersError } = await supabase
        .from('user_followers')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);

      if (followersError) {
        console.error('Error fetching followers count:', followersError);
      }

      // Get following count
      const { count: followingCount, error: followingError } = await supabase
        .from('user_followers')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);

      if (followingError) {
        console.error('Error fetching following count:', followingError);
      }

      return {
        followers: followersCount || 0,
        following: followingCount || 0,
      };
    } catch (err) {
      console.error('Error fetching follow counts:', err);
      return { followers: 0, following: 0 };
    }
  }, []);

  useEffect(() => {
    const handleOnlineStatus = () => setIsOffline(!navigator.onLine);

    setIsOffline(!navigator.onLine);

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  useEffect(() => {
    mounted.current = true;

    const fetchUserData = async () => {
      // Prevent multiple simultaneous calls for the same user
      if (isLoadingRef.current || lastFetchId.current === usernameOrId) {
        return;
      }

      if (!usernameOrId) {
        setError('No username or ID provided');
        setIsLoading(false);
        return;
      }

      if (isOffline) {
        setError('You are currently offline. Please check your connection and try again.');
        setIsLoading(false);
        return;
      }

      try {
        isLoadingRef.current = true;
        lastFetchId.current = usernameOrId;

        setIsLoading(true);
        setError(null);

        let user = await getUserByUsername(usernameOrId);

        if (!user) {
          user = await getUserById(usernameOrId);
        }

        if (!user) {
          setError('User not found');
          return;
        }

        if (mounted.current) {
          setUserData(user);

          // Fetch real follow counts from database
          const followCounts = await fetchFollowCounts(user.id);
          setFollowersCount(followCounts.followers);
          setFollowingCount(followCounts.following);

          // Fetch real user posts from database
          const posts = await fetchUserPosts(user.id);
          setUserPosts(posts);
        }
      } catch (err) {
        if (mounted.current) {
          setError('Failed to load profile data. Please try again.');
        }
      } finally {
        if (mounted.current) {
          setIsLoading(false);
        }
        isLoadingRef.current = false;
      }
    };

    // Add small delay to prevent rapid successive calls
    const timer = setTimeout(() => {
      if (mounted.current) {
        fetchUserData();
      }
    }, 100);

    return () => {
      mounted.current = false;
      clearTimeout(timer);
    };
  }, [usernameOrId, retryCount, isOffline, fetchFollowCounts, fetchUserPosts]); // Stable dependencies only

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mounted.current = false;
      isLoadingRef.current = false;
      lastFetchId.current = undefined;
    };
  }, []);

  return {
    isLoading,
    userData,
    userPosts,
    followersCount,
    followingCount,
    error,
    isOffline,
    retry,
  };
};

export default useProfileData;
