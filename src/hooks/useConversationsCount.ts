import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useConversationsCount = (userId: string | undefined) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const fetchUnreadConversations = async () => {
      try {
        // Get conversations where the user is a member
        const { data: conversations, error } = await supabase
          .from('conversations')
          .select('*')
          .contains('members', [userId]);

        if (error) {
          console.error('Error fetching conversations:', error);
          return;
        }

        // For now, we'll count all conversations as having potential unread messages
        // In a more sophisticated implementation, you'd check message read status
        setUnreadCount(conversations?.length || 0);
      } catch (error) {
        console.error('Error fetching unread conversations:', error);
        setUnreadCount(0);
      }
    };

    fetchUnreadConversations();

    // Set up real-time subscription for conversation updates
    const subscription = supabase
      .channel('conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          // Refetch conversations when there are changes
          fetchUnreadConversations();
        }
      )
      .subscribe();

    // Return cleanup function
    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  return unreadCount;
};
