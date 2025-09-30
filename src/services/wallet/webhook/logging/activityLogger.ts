import { supabase } from '@/integrations/supabase/client';

interface ActivityLog {
  provider: string;
  event_type: string;
  payload: unknown;
  status: 'received' | 'processed' | 'failed';
  error_message?: string | undefined;
}

export const logActivity = async (activityData: ActivityLog) => {
  try {
    // Use notifications table since user_activities doesn't exist
    const { error } = await supabase.from('notifications').insert({
      type: activityData.event_type,
      title: `${activityData.provider} Event`,
      message: `Status: ${activityData.status}`,
      status: 'unread',
      user_id: null, // System notification
    });

    if (error) {
    }
  } catch (_error) {
    // Error handling silently ignored
  }
};

export const logWebhookActivity = async (
  provider: string,
  eventType: string,
  payload: unknown,
  status: 'received' | 'processed' | 'failed'
): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        type: eventType,
        title: `${provider} Webhook`,
        message: `Status: ${status}`,
        status: 'unread',
        user_id: null,
      })
      .select()
      .single();

    if (error) {
      return null;
    }

    return data?.id || null;
  } catch (error) {
    return null;
  }
};
