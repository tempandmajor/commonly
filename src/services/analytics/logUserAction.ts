import { supabase } from '@/integrations/supabase/client';

export interface UserAction {
  userId: string;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
  timestamp: string;
  actionType: string;
  metadata?: Record<string, unknown> | undefined;
}

export const logUserAction = async (action: UserAction) => {
  try {
    // Use ContentTest as fallback since user_activities table doesn't exist
    const { error } = await supabase.from('ContentTest').insert({
      title: `User Action: ${action.actionType}`,
      body: JSON.stringify(action),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
    return true;
  } catch (error) {
    return false;
  }
};
