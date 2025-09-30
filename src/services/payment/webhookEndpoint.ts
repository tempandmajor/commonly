import { handleWebhook as handleWalletWebhook } from '../wallet/webhookHandler';
import { logWebhookProcessing } from '../wallet/webhookLogger';

export interface WebhookEvent {
  id: string;
  object: string;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
}

/**
 * Handle incoming Stripe webhook requests
 */
export async function handleWebhook(
  payload: string,
  _stripeSignature: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Parse the webhook payload
    const event = JSON.parse(payload) as WebhookEvent;

    // Process wallet-related events
    const result = await handleWalletWebhook(event);
    const success = result.success;

    // Log the webhook event with single argument
    await logWebhookProcessing({
      id: event.id,
      type: event.type,
      data: event.data,
      success,
      error: success ? undefined : 'Failed to process webhook',
    });

    if (success) {
      return { success: true, message: 'Webhook processed successfully' };
    } else {
      return { success: false, message: 'Failed to process webhook' };
    }
  } catch (error) {
    // Log the error with single argument
    await logWebhookProcessing({
      id: 'unknown',
      type: 'error',
      data: { error: error instanceof Error ? error.message : 'Unknown error' },
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Record webhook event in the database for logging purposes
 */
export const logWebhookEvent = async (event: WebhookEvent): Promise<void> => {
  try {
    // Store webhook events in a proper webhook_logs table if available
    // For now, we'll just log to console in development
    if (process.env.NODE_ENV as string === 'development') {
    }
  } catch (error) {
    // Silently fail - webhook logging should not break the webhook processing
  }
};
