import { supabase } from '@/integrations/supabase/client';
import { handleError } from '@/utils/errorUtils';

/**
 * Interface for webhook data that needs to be logged
 */
interface WebhookData {
  id: string;
  source: 'stripe' | 'other';
  event_type: string;
  status: 'received' | 'processed' | 'failed';
  payload: unknown;
  metadata?: Record<string, unknown> | undefined;
}

/**
 * Logs webhook processing to the database for auditing and debugging purposes
 * @param webhook - The webhook data to log
 * @returns Object indicating success or failure
 */
export const logWebhookProcessing = async (webhook: WebhookData) => {
  try {
    // Prepare the webhook data for logging
    const webhookLog = {
      webhook_id: webhook.id,
      source: webhook.source,
      event_type: webhook.event_type,
      status: webhook.status,
      payload:
        typeof webhook.payload === 'string' ? webhook.payload : JSON.stringify(webhook.payload),
      metadata: webhook.metadata ? JSON.stringify(webhook.metadata) : null,
      processed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    // Log to the webhook_logs table
    const { error } = await supabase.from('webhook_logs').insert(webhookLog);

    if (error) throw error;

    // Also log to Events table for analytics
    await supabase.from('Events').insert({
      event_type: 'webhook_processed',
      event_object_id: webhook.id,
      event_data: JSON.stringify({
        source: webhook.source,
        event_type: webhook.event_type,
        status: webhook.status,
        timestamp: new Date().toISOString(),
      }),
    });

    return { success: true, id: webhook.id };
  } catch (error) {
    handleError(error, { webhook }, 'Error logging webhook processing');
    return { success: false, error };
  }
};
