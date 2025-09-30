import { safeToast } from '@/services/api/utils/safeToast';
import { supabase } from '@/integrations/supabase/client';

/**
 * Handles the verification of a successful payment (would be called when user returns from Stripe)
 */
export const verifyPayment = async (sessionId: string, paymentId?: string): Promise<boolean> => {
  try {
    if (!sessionId && !paymentId) {
      return false;
    }

    if (paymentId === 'platform-credit') {
      return true;
    }

    if (paymentId) {
      const { data: paymentData, error: fetchError } = await supabase
        .from('PaymentsTest')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (fetchError) throw fetchError;

      if (paymentData) {
        const updateData = {
          updated_at: new Date().toISOString(),
        };

        if (paymentData.is_all_or_nothing) {
          const { error } = await supabase
            .from('PaymentsTest')
            .update({
          ...updateData,
              status: 'authorized',
            })
            .eq('id', paymentId);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('PaymentsTest')
            .update({
          ...updateData,
              status: 'completed',
              completed_at: new Date().toISOString(),
            })
            .eq('id', paymentId);

          if (error) throw error;
        }
      }
    }

    return true;
  } catch (error) {
    safeToast.error('Failed to verify payment status.');
    return false;
  }
};

/**
 * Process authorized payments for an event once the target is reached
 */
export const processEventAuthorizedPayments = async (eventId: string): Promise<boolean> => {
  try {
    // Find all authorized payments for this event
    const { data: payments, error } = await supabase
      .from('PaymentsTest')
      .select('id')
      .eq('event_id', eventId)
      .eq('status', 'authorized')
      .eq('is_all_or_nothing', true);

    if (error) throw error;

    if (!payments || payments.length === 0) {
      return true; // No payments to process
    }

    // Process each payment
    const processing = payments.map(async payment => {
      const { error: updateError } = await supabase
        .from('PaymentsTest')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.id);

      if (updateError) throw updateError;
    });

    await Promise.all(processing);

    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Verify payment completion and update local records
 * @param paymentId Local payment ID
 * @param stripePaymentIntentId Stripe payment intent ID
 * @returns Promise resolving to verification result
 */
export const verifyPaymentCompletion = async (
  paymentId: string,
  stripePaymentIntentId: string
): Promise<boolean> => {
  try {
    // In a real implementation, this would call Stripe API to verify payment status
    // For now, we'll update the local record

    const { data: paymentData, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (fetchError || !paymentData) {
      return false;
    }

    // Check if this is an all-or-nothing payment that needs special handling
    const isAllOrNothing =
      paymentData.metadata &&
      typeof paymentData.metadata === 'object' &&
      'isAllOrNothing' in paymentData.metadata &&
      paymentData.metadata.isAllOrNothing === 'true';

    if (isAllOrNothing) {
      // For all-or-nothing payments, we don't mark as completed until goal is reached
      return true;
    }

    // For regular payments, mark as completed
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: 'completed',
        stripe_payment_id: stripePaymentIntentId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentId);

    if (updateError) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Get all authorized payments for an event
 * @param eventId The event ID
 * @returns Promise resolving to array of payment records
 */
export const getEventAuthorizedPayments = async (eventId: string) => {
  try {
    // Get pledges for all-or-nothing events
    const { data: pledges, error: pledgesError } = await supabase
      .from('pledges')
      .select('*')
      .eq('event_id', eventId)
      .eq('status', 'requires_capture');

    if (pledgesError) {
      return [];
    }

    // Get regular payments that are authorized but not captured
    const { data: payments, error: paymentsError } = await supabase
      .from('payment_history')
      .select('*')
      .eq('metadata->>eventId', eventId)
      .eq('status', 'requires_capture');

    if (paymentsError) {
      return [];
    }

    return [...(pledges || []), ...(payments || [])];
  } catch (error) {
    return [];
  }
};

/**
 * Capture all authorized payments for an event when the funding goal is reached
 */
export const captureEventAuthorizedPayments = async (eventId: string): Promise<boolean> => {
  try {
    const authorizedPayments = await getEventAuthorizedPayments(eventId);

    if (authorizedPayments.length === 0) {
      return true;
    }

    let successCount = 0;
    let failureCount = 0;

    for (const payment of authorizedPayments) {
      try {
        // In a real implementation, this would call Stripe API to capture the payment
        // stripe.paymentIntents.capture(payment.payment_intent_id)

        // Simulate successful capture for now
        const captureSuccessful = true; // In real implementation: await captureStripePayment(payment.payment_intent_id)

        if (captureSuccessful) {
          // Update payment status to completed
          if ('event_id' in payment) {
            // This is a pledge
            await supabase
              .from('pledges')
              .update({
                status: 'succeeded',
                updated_at: new Date().toISOString(),
              })
              .eq('id', payment.id);
          } else {
            // This is a payment history record
            await supabase
              .from('payment_history')
              .update({
                status: 'succeeded',
                updated_at: new Date().toISOString(),
              })
              .eq('id', payment.id);
          }

          successCount++;
        } else {
          failureCount++;
        }
      } catch (error) {
        failureCount++;
      }
    }

    // Return true if all payments were captured successfully
    return failureCount === 0;
  } catch (error) {
    return false;
  }
};

/**
 * Cancel authorized payments for an event if the funding target is not met
 */
export const cancelEventAuthorizedPayments = async (eventId: string): Promise<boolean> => {
  try {
    const authorizedPayments = await getEventAuthorizedPayments(eventId);

    if (authorizedPayments.length === 0) {
      return true;
    }

    let successCount = 0;
    let failureCount = 0;

    for (const payment of authorizedPayments) {
      try {
        // In a real implementation, this would call Stripe API to cancel the payment intent
        // stripe.paymentIntents.cancel(payment.payment_intent_id)

        // Simulate successful cancellation for now
        const cancellationSuccessful = true; // In real implementation: await cancelStripePayment(payment.payment_intent_id)

        if (cancellationSuccessful) {
          // Update payment status to cancelled
          if ('event_id' in payment) {
            // This is a pledge
            await supabase
              .from('pledges')
              .update({
                status: 'canceled',
                updated_at: new Date().toISOString(),
              })
              .eq('id', payment.id);
          } else {
            // This is a payment history record
            await supabase
              .from('payment_history')
              .update({
                status: 'canceled',
                updated_at: new Date().toISOString(),
              })
              .eq('id', payment.id);
          }

          successCount++;
        } else {
          failureCount++;
        }
      } catch (error) {
        failureCount++;
      }
    }

    // Return true if all payments were cancelled successfully
    return failureCount === 0;
  } catch (error) {
    return false;
  }
};
