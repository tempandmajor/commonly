import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { handleSupabaseError } from '@/utils/supabaseErrorHandling';

export const useNotificationsCount = (userId: string | undefined) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    // Function to fetch current count
    const fetchCount = async () => {
      try {
        const { count, error } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('status', 'unread');

        if (error) throw error;

        setUnreadCount(count || 0);
      } catch (error) {
        handleSupabaseError(error, 'fetching notifications count', false);
        setUnreadCount(0);
      }
    };

    // Initial fetch
    fetchCount();

    // Set up realtime subscription
    try {
      const subscription = supabase
        .channel('notifications-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          () => {
            // When any change happens, re-fetch the count
            // This is more reliable than trying to calculate the delta
            fetchCount();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      handleSupabaseError(error, 'setting up notifications listener', true);
      return () => {}; // Return empty function as fallback
    }
  }, [userId]);

  return unreadCount;
};
