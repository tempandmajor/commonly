import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';

export interface Notification {
  id: string;
  type:
    | 'event_cancelled'
    | 'event_funded'
    | 'event_reminder'
    | 'payment_charged'
    | 'payment_failed'
    | 'reservation_confirmed'
    | 'general';
  title: string;
  message: string;
  data?: Record<string, unknown> | undefined;
  read: boolean;
  created_at: string;
  updated_at: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const channelRef = useRef<any>(null);
  const subscriptionActiveRef = useRef(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const typedNotifications = (data || []).map((item: unknown) => ({
        id: item.id,
        type: item.type as Notification['type'],
        title: item.title,
        message: item.message,
        data: item.data || {},
        read: item.read || false,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));

      setNotifications(typedNotifications);
      setUnreadCount(typedNotifications.filter(n => !n.read).length);
    } catch (error) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read: true, updated_at: new Date().toISOString() } : n
        )
      );

      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true, updated_at: new Date().toISOString() }))
      );

      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all notifications as read');
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user?.id);

      if (error) throw error;

      const wasUnread = notifications.find(n => n.id === notificationId)?.read === false;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));

      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user || subscriptionActiveRef.current) return;

    fetchNotifications();

    // Clean up any existing subscription first
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Create a unique channel name to prevent conflicts
    const channelName = `notifications-${user.id}-${Date.now()}`;

    // Set up real-time subscription with timeout handling
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        payload => {
          const newData = payload.new as unknown;
          const newNotification: Notification = {
            id: newData.id,
            type: newData.type,
            title: newData.title,
            message: newData.message,
            data: newData.data || {},
            read: newData.read || false,
            created_at: newData.created_at,
            updated_at: newData.updated_at,
          };

          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Show toast for new notification
          toast.info(newNotification.title, {
            description: newNotification.message,
          });
        }
      )
      .subscribe(status => {
        if (status === 'SUBSCRIBED') {
          subscriptionActiveRef.current = true;
        } else if (status === 'CHANNEL_ERROR') {
          subscriptionActiveRef.current = false;
        } else if (status === 'TIMED_OUT') {
          subscriptionActiveRef.current = false;
          // Don't show error to user for timeout, just log it
        } else if (status === 'CLOSED') {
          subscriptionActiveRef.current = false;
        }
      });

    channelRef.current = channel;

    // Set a timeout to prevent hanging subscriptions
    const subscriptionTimeout = setTimeout(() => {
      if (!subscriptionActiveRef.current && channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    }, 10000); // 10 second timeout

    return () => {
      clearTimeout(subscriptionTimeout);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      subscriptionActiveRef.current = false;
    };
  }, [user?.id]); // Only depend on user.id to prevent unnecessary re-subscriptions

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
};
