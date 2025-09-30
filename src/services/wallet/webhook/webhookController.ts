import { supabase } from '@/integrations/supabase/client';
import * as Sentry from '@sentry/react';
import { handleDeposit } from './handlers/depositHandler';
import { handleReferral } from './handlers/referralHandler';
import { handleWithdrawal } from './handlers/withdrawalHandler';
import { logWebhookActivity } from './logging/activityLogger';
import { detectFraudulentActivity } from './logging/fraudDetection';

/**
 * Handle incoming webhook events from payment providers
 * @param event The webhook event data
 * @returns Response indicating success or failure
 */
export const handleWebhook = async (event: unknown) => {
  try {
    // Log incoming webhook and get webhook ID
    const webhookId = await logWebhookActivity(
      event.source || 'unknown',
      event.type || 'unknown_event',
      event,
      'received'
    );

    if (!webhookId) {
      // Continue despite logging error
    }

    // Process the event
    const result = await processWebhookEvent(
      event.type,
      event.data,
      webhookId,
      event.source || 'unknown'
    );

    if (webhookId) {
      // Update webhook log with status
      const { error: updateError } = await supabase
        .from('webhook_logs' as const)
        .update({
          status: result.success ? 'processed' : 'failed',
          processed_at: new Date().toISOString(),
          error_message: result.success ? null : String(result.error) as string,
        })
        .eq('id', webhookId);

      if (updateError) {
        Sentry.captureException(updateError, {
          extra: { webhookId, eventType: event.type },
          tags: { source: 'webhook_log_update' },
        });
      }
    }

    return result;
  } catch (error) {
    Sentry.captureException(error, {
      extra: { event },
      tags: { source: 'webhook_handler' },
    });

    return { success: false, error };
  }
};

/**
 * Process webhook event based on type
 * @param eventType Type of webhook event
 * @param data Event data
 * @param webhookId ID of the logged webhook (if available)
 * @param provider Name of the provider (e.g., 'stripe')
 * @returns Processing result
 */
export const processWebhookEvent = async (
  eventType: string,
  data: unknown,
  webhookId?: string | null,
  provider: string = 'unknown'
) => {
  try {
    // Check for fraudulent activity
    const fraudCheck = await detectFraudulentActivity(
      webhookId || 'unknown',
      provider,
      eventType,
      data
    );

    if (fraudCheck.isFraudulent) {
      return { success: false, error: 'Fraudulent activity: ' + fraudCheck.reason };
    }

    // Route to appropriate handler based on event type
    switch (eventType) {
      case 'payment.succeeded':
      case 'charge.succeeded':
      case 'deposit.succeeded':
        return await handleDeposit(data);

      case 'transfer.succeeded':
      case 'payout.succeeded':
      case 'withdrawal.succeeded':
      case 'withdrawal.failed':
        return await handleWithdrawal({
          ...data,
          status: eventType.includes('failed') ? 'failed' : 'completed',
        });

      case 'referral.completed':
      case 'referral.created':
        return await handleReferral(data);

      default:
        return { success: true }; // Acknowledge but take no action
    }
  } catch (error) {
    Sentry.captureException(error, {
      extra: { eventType, data },
      tags: { source: 'webhook_processor' },
    });

    return { success: false, error };
  }
};
