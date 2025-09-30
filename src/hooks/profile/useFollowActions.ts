import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_U as string!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_K as string!
);

export function useFollowActions(userId?: string) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if current user is following the target user
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!userId) return;

      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        if (!currentUser || currentUser.id === userId) return;

        const { data } = await supabase.rpc('is_following', {
          follower_uuid: currentUser.id,
          following_uuid: userId,
        });

        setIsFollowing(data === true);
      } catch (error) {
        console.error('Error checking follow status:', error);
      }
    };

    checkFollowStatus();
  }, [userId]);

  const handleFollowToggle = async () => {
    if (!userId || isLoading) return;

    try {
      setIsLoading(true);
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        toast.error('You must be logged in to follow users');
        return;
      }

      if (currentUser.id === userId) {
        toast.error('You cannot follow yourself');
        return;
      }

      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('user_followers')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', userId);

        if (error) throw error;

        setIsFollowing(false);
        toast.success('Unfollowed user');
      } else {
        // Follow
        const { error } = await supabase.from('user_followers').insert({
          follower_id: currentUser.id,
          following_id: userId,
        });

        if (error) throw error;

        setIsFollowing(true);
        toast.success('Following user');
      }
    } catch (error: any) {
      console.error('Error toggling follow status:', error);

      if (error.code === '23505') {
        // Unique constraint violation - already following
        setIsFollowing(true);
        toast.info('Already following this user');
      } else {
        toast.error('Failed to update follow status');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isFollowing,
    isLoading,
    setIsFollowing,
    handleFollowToggle,
  };
}
