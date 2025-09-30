import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_U as string!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_K as string!
);

export const useFollowCounts = (userId?: string) => {
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFollowCounts = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Get follower count
        const { data: followerCountData, error: followerError } = await supabase.rpc(
          'get_follower_count',
          {
            user_uuid: userId,
          }
        );

        if (followerError) {
          console.error('Error fetching follower count:', followerError);
        } else {
          setFollowersCount(followerCountData || 0);
        }

        // Get following count
        const { data: followingCountData, error: followingError } = await supabase.rpc(
          'get_following_count',
          {
            user_uuid: userId,
          }
        );

        if (followingError) {
          console.error('Error fetching following count:', followingError);
        } else {
          setFollowingCount(followingCountData || 0);
        }
      } catch (error) {
        console.error('Error fetching follow counts:', error);
        setFollowersCount(0);
        setFollowingCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFollowCounts();
  }, [userId]);

  return { followersCount, followingCount, isLoading };
};
