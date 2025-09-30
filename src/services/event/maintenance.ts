import { supabase } from '@/integrations/supabase/client';
import { handleError } from '@/utils/errorUtils';

/**
 * Cleans up expired events by archiving events that have ended more than 30 days ago
 * This helps maintain database performance while preserving event history
 * @returns Promise that resolves when cleanup is complete
 */
export const cleanupExpiredEvents = async (): Promise<void> => {
  try {
    // Get current date and calculate cutoff date (30 days ago)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const cutoffDate = thirtyDaysAgo.toISOString();

    // Find events that ended more than 30 days ago and are not already archived
    const { data: expiredEvents, error: fetchError } = await supabase
      .from('events')
      .select('id')
      .lt('end_time', cutoffDate)
      .eq('archived', false);

    if (fetchError) throw fetchError;

    if (!expiredEvents || expiredEvents.length === 0) {
      return;
    }

    // Extract IDs of expired events
    const expiredEventIds = expiredEvents.map(event => event.id);

    // Update events to mark them as archived
    const { error: updateError } = await supabase
      .from('events')
      .update({
        archived: true,
        updated_at: now.toISOString(),
      })
      .in('id', expiredEventIds);

    if (updateError) throw updateError;

    // Log the archiving activity
    await supabase.from('Events').insert({
      event_type: 'events_archived',
      event_data: JSON.stringify({
        count: expiredEventIds.length,
        cutoff_date: cutoffDate,
        timestamp: now.toISOString(),
      }),
    });
  } catch (error) {
    handleError(error, {}, 'Failed to cleanup expired events');
  }
};

/**
 * Updates event statuses based on their start and end times
 * - Events with start_time in the past but end_time in the future are marked 'in_progress'
 * - Events with end_time in the past are marked 'completed'
 * - Events with start_time in the future retain their current status
 * @returns Promise that resolves when all statuses are updated
 */
export const updateEventStatuses = async (): Promise<void> => {
  try {
    const now = new Date().toISOString();

    // Update events that have started but not ended to 'in_progress'
    const { error: inProgressError } = await supabase
      .from('events')
      .update({
        status: 'in_progress',
        updated_at: now,
      })
      .lt('start_time', now)
      .gt('end_time', now)
      .neq('status', 'in_progress');

    if (inProgressError) throw inProgressError;

    // Update events that have ended to 'completed'
    const { error: completedError } = await supabase
      .from('events')
      .update({
        status: 'completed',
        updated_at: now,
      })
      .lt('end_time', now)
      .neq('status', 'completed');

    if (completedError) throw completedError;

    // Get counts for analytics and logging
    const { count: inProgressCount, error: countInProgressError } = await supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'in_progress');

    if (countInProgressError) throw countInProgressError;

    const { count: completedCount, error: countCompletedError } = await supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'completed');

    if (countCompletedError) throw countCompletedError;

    // Log the status update activity
    await supabase.from('Events').insert({
      event_type: 'event_statuses_updated',
      event_data: JSON.stringify({
        in_progress_count: inProgressCount,
        completed_count: completedCount,
        timestamp: now,
      }),
    });
  } catch (error) {
    handleError(error, {}, 'Failed to update event statuses');
  }
};
