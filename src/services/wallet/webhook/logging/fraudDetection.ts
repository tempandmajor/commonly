import { supabase } from '@/integrations/supabase/client';
import * as Sentry from '@sentry/react';

interface FraudDetectionData {
  userId: string;
  eventType: string;
  provider: string;
  data: unknown;
  riskLevel: 'low' | 'medium' | 'high';
  reason: string;
  webhookId?: string | undefined;
}

/**
 * Main export used by webhook controller - Detect fraudulent activity in webhook events
 * @param webhookId Webhook ID
 * @param provider Provider name (e.g., 'stripe')
 * @param eventType Event type
 * @param payload Webhook payload
 * @returns Risk assessment result
 */
export const detectFraudulentActivity = async (
  webhookId: string,
  provider: string,
  eventType: string,
  payload: any
): Promise<{ isFraudulent: boolean; riskLevel: 'low' | 'medium' | 'high'; reason?: string }> => {
  try {
    // Extract relevant data for fraud detection
    const userId =
      payload?.user_id ||
      payload?.account?.user_id ||
      payload?.data?.object?.metadata?.user_id ||
      null;
    const amount = payload?.amount_in_cents || payload?.data?.object?.amount || null;
    const transactionType = payload?.type || payload?.data?.object?.type || eventType;

    // Perform fraud detection
    const riskAssessment = await analyzeFraudRisk(
      userId,
      transactionType,
      amount,
      provider,
      payload
    );

    // Log high-risk events
    if (riskAssessment.risk !== 'low') {
      await logFraudDetection({
        userId,
        eventType,
        provider,
        data: payload,
        riskLevel: riskAssessment.risk,
        reason: riskAssessment.details || 'Suspicious activity',
        webhookId,
      });
    }

    return {
      isFraudulent: riskAssessment.risk === 'high',
      riskLevel: riskAssessment.risk,
      reason: riskAssessment.details,
    };
  } catch (error) {
    Sentry.captureException(error, {
      extra: { webhookId, provider, eventType },
      tags: { source: 'fraud_detection' },
    });
    return { isFraudulent: false, riskLevel: 'low' };
  }
};

/**
 * Log a potentially fraudulent transaction
 * @param data Fraud detection data
 */
export const logFraudDetection = async (data: FraudDetectionData): Promise<void> => {
  try {
    // Log to Supabase security_logs table
    const { error } = await supabase.from('security_logs' as const).insert({
      type: 'fraud_detection',
      user_id: data.userId,
      details: {
        provider: data.provider,
        event_type: data.eventType,
        risk_level: data.riskLevel,
        reason: data.reason,
        webhook_id: data.webhookId,
      },
      created_at: new Date().toISOString(),
    });

    if (error) {
      Sentry.captureException(error, {
        extra: { data },
        tags: { source: 'fraud_detection_logging' },
      });
    }

    // For high-risk events, send alert to Sentry
    if (data.riskLevel === 'high') {
      Sentry.captureMessage('High-risk fraudulent activity detected', {
        level: 'warning',
        extra: {
          userId: data.userId,
          provider: data.provider,
          eventType: data.eventType,
          reason: data.reason,
        },
        tags: { source: 'fraud_detection', risk: 'high' },
      });
    }
  } catch (error) {
    Sentry.captureException(error, {
      extra: { data },
      tags: { source: 'fraud_detection_logging' },
    });
  }
};

/**
 * Analyze a transaction for fraud indicators
 * @param userId User ID
 * @param transactionType Transaction type
 * @param amount Transaction amount
 * @param provider Payment provider
 * @param payload Full event payload
 * @returns Risk assessment result
 */
export const analyzeFraudRisk = async (
  userId: string | null,
  transactionType: string,
  amount: number | null,
  provider: string,
  payload: any
): Promise<{ risk: 'low' | 'medium' | 'high'; details?: string }> => {
  // This is a fraud detection algorithm that checks for suspicious patterns

  // Check for missing essential data
  if (!userId) {
    return { risk: 'high', details: 'Missing user ID in transaction' };
  }

  // Check for unusually large transaction amounts
  if (amount && amount > 1000000) {
    // $10,000 in cents
    return { risk: 'medium', details: 'Unusually large transaction amount' };
  }

  // Check for suspicious transaction patterns
  const suspiciousEventTypes = ['dispute.created', 'charge.dispute.created', 'review.opened'];
  if (suspiciousEventTypes.includes(transactionType)) {
    return { risk: 'medium', details: 'Potentially suspicious transaction type' };
  }

  // Check transaction frequency (would normally query DB for history)
  // For now, just assume all transactions are normal frequency

  // Check for unusual IP address or device info (if available in payload)
  const ipAddress = payload?.data?.object?.source?.ip_address || payload?.ip_address;
  const knownBadIPs = []; // In production, this would be a real list
  if (ipAddress && knownBadIPs.includes(ipAddress)) {
    return { risk: 'high', details: 'Known suspicious IP address' };
  }

  // Check for multiple failed payment attempts (if available)
  const failedAttempts = payload?.data?.object?.outcome?.network_status === 'declined_by_network';
  if (failedAttempts) {
    return { risk: 'medium', details: 'Previously failed payment attempt' };
  }

  // Default to low risk if no issues found
  return { risk: 'low' };
};
