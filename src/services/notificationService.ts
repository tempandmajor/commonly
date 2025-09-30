// Production Notification Service - Real Implementation
import { supabase } from '@/integrations/supabase/client';
import { Notification } from '@/types/notification';

export const fetchUserNotifications = async (
  userId: string,
  options: {
    limit?: number;
    type?: string;
    onlyUnread?: boolean;
  } = {}
): Promise<Notification[]> => {
  try {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.type) {
      query = query.eq('type', options.type);
    }

    if (options.onlyUnread) {
      query = query.eq('status', 'unread');
    }

    const { data, error } = await query;

    if (error) throw error;

    return (
      data?.map(notification => ({
        id: notification.id,
        userId: notification.user_id,
        user: {
          name: notification.title || 'Notification', // Use notification title or default
          avatar: '',
          initials: notification.title ? notification.title.charAt(0).toUpperCase() : 'N',
        },
        action: notification.message,
        time: new Date(notification.created_at || new Date().toISOString()),
        read: notification.read || false,
        type: (notification.type as any) || 'event',
      })) || []
    );
  } catch (error) {
    return [];
  }
};

export const createNotification = async (
  userId: string,
  data: {
    title: string;
    message: string;
    type: string;
    relatedId?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<string> => {
  try {
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title: data.title,
        message: data.message,
        type: data.type,
        action_url: data.relatedId ? `/${data.type}/${data.relatedId}` : null,
        status: 'unread',
      })
      .select()
      .single();

    if (error) throw error;
    return notification.id;
  } catch (error) {
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    await supabase
      .from('notifications')
      .update({ status: 'read', updated_at: new Date().toISOString() })
      .eq('id', notificationId);
  } catch (_error) {
    // Error handling silently ignored
  }
};

export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  try {
    await supabase
      .from('notifications')
      .update({ status: 'read', updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('status', 'unread');
  } catch (_error) {
    // Error handling silently ignored
  }
};

export const subscribeToNotifications = (
  userId: string,
  callback: (notifications: Notification[]) => void
): (() => void) => {
  const subscription = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      payload => {
        // Refetch notifications when changes occur
        fetchUserNotifications(userId).then(callback);
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
};
