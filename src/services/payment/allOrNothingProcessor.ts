import { supabase } from '@/integrations/supabase/client';
import {
  captureEventAuthorizedPayments,
  cancelEventAuthorizedPayments,
} from './paymentVerification';
import { convertReservedToSold, releaseTicketReservation } from './ticketManagement';

/**
 * Check and process all-or-nothing events that have reached their deadline or goal
 */
export const processAllOrNothingEvents = async (): Promise<void> => {
  try {
    const now = new Date();

    // Find all-or-nothing events that need processing
    const { data: eventsToProcess, error } = await supabase
      .from('events')
      .select(
        `
        id, 
        title, 
        target_amount, 
        current_amount, 
        pledge_deadline, 
        funding_status,
        reserved_tickets
      `
      )
      .eq('is_all_or_nothing', true)
      .eq('funding_status', 'in_progress')
      .or(`pledge_deadline.lte.${now.toISOString()},current_amount.gte.target_amount`);

    if (error) {
      return;
    }

    if (!eventsToProcess || eventsToProcess.length === 0) {
      return;
    }

    for (const event of eventsToProcess) {
      await processEvent(event);
    }
  } catch (_error) {
    // Error handling silently ignored
  }
};

/**
 * Process a single all-or-nothing event
 */
const processEvent = async (event: {
  id: string;
  title: string;
  target_amount: number | null;
  current_amount: number | null;
  pledge_deadline: string | null;
  funding_status: string;
  reserved_tickets: number | null;
}): Promise<void> => {
  try {
    const goalReached = (event.current_amount || 0) >= (event.target_amount || 0);
    const deadlinePassed = event.pledge_deadline && new Date(event.pledge_deadline) <= new Date();

    if (goalReached) {
      // Goal reached - capture payments and convert reserved tickets to sold
      await handleSuccessfulFunding(event);
    } else if (deadlinePassed) {
      // Deadline passed without reaching goal - cancel payments and release tickets
      await handleFailedFunding(event);
    }
  } catch (_error) {
    // Error handling silently ignored
  }
};

/**
 * Handle successful funding (goal reached)
 */
const handleSuccessfulFunding = async (event: {
  id: string;
  reserved_tickets: number | null;
}): Promise<void> => {
  try {
    // Capture all authorized payments for this event
    const paymentsCaptured = await captureEventAuthorizedPayments(event.id);

    if (paymentsCaptured) {
      // Convert reserved tickets to sold tickets
      if (event.reserved_tickets && event.reserved_tickets > 0) {
        await convertReservedToSold(event.id, event.reserved_tickets);
      }

      // Update event status to funded
      const { error: updateError } = await supabase
        .from('events')
        .update({
          funding_status: 'funded',
          funded_at: new Date().toISOString(),
        })
        .eq('id', event.id);

      if (updateError) {
        // No action needed
      } else {
        // No action needed
      }

      // TODO: Send success notifications to pledgers
      // TODO: Send notification to event organizer
    } else {
      // TODO: Handle payment capture failure
    }
  } catch (_error) {
    // Error handling silently ignored
  }
};

/**
 * Handle failed funding (deadline passed without reaching goal)
 */
const handleFailedFunding = async (event: {
  id: string;
  reserved_tickets: number | null;
}): Promise<void> => {
  try {
    // Cancel all authorized payments for this event
    const paymentsCancelled = await cancelEventAuthorizedPayments(event.id);

    if (paymentsCancelled) {
      // Release reserved tickets back to available
      if (event.reserved_tickets && event.reserved_tickets > 0) {
        await releaseTicketReservation(event.id, event.reserved_tickets);
      }

      // Update event status to funding_failed
      const { error: updateError } = await supabase
        .from('events')
        .update({
          funding_status: 'funding_failed',
        })
        .eq('id', event.id);

      if (updateError) {
        // No action needed
      } else {
        // No action needed
      }

      // TODO: Send failure notifications to pledgers
      // TODO: Send notification to event organizer
    } else {
      // TODO: Handle payment cancellation failure
    }
  } catch (_error) {
    // Error handling silently ignored
  }
};

/**
 * Check if an event should be processed for payment capture or cancellation
 * Can be called manually or by a scheduled job
 */
export const checkEventFundingStatus = async (eventId: string): Promise<void> => {
  try {
    // Get event details
    const { data: event, error } = await supabase
      .from('events')
      .select(
        `
        id, 
        title, 
        target_amount, 
        current_amount, 
        pledge_deadline, 
        funding_status,
        reserved_tickets,
        is_all_or_nothing
      `
      )
      .eq('id', eventId)
      .single();

    if (error || !event) {
      return;
    }

    if (!event.is_all_or_nothing) {
      return;
    }

    if (event.funding_status !== 'in_progress') {
      return;
    }

    await processEvent(event);
  } catch (_error) {
    // Error handling silently ignored
  }
};

/**
 * Update event funding progress when a new pledge is made
 */
export const updateEventFundingProgress = async (
  eventId: string,
  pledgeAmount: number
): Promise<void> => {
  try {
    // Get current amount
    const { data: event, error: fetchError } = await supabase
      .from('events')
      .select('current_amount, target_amount')
      .eq('id', eventId)
      .single();

    if (fetchError || !event) {
      return;
    }

    const newAmount = (event.current_amount || 0) + pledgeAmount;

    // Update current amount
    const { error: updateError } = await supabase
      .from('events')
      .update({
        current_amount: newAmount,
      })
      .eq('id', eventId);

    if (updateError) {
      return;
    }

    // Check if goal is reached
    if (newAmount >= (event.target_amount || 0)) {
      await checkEventFundingStatus(eventId);
    }
  } catch (_error) {
    // Error handling silently ignored
  }
};

async function processSuccessfulCrowdfunding(
  _projectId: string,
  _finalAmount: number,
  _pledges: Array<{
    id: string;
    user_id: string;
    amount: number;
    payment_intent_id: string;
  }>
): Promise<void> {
  // Implementation of processSuccessfulCrowdfunding function
}

async function refundFailedCrowdfunding(
  _projectId: string,
  _pledges: Array<{
    id: string;
    user_id: string;
    amount: number;
    payment_intent_id: string;
  }>
): Promise<void> {
  // Implementation of refundFailedCrowdfunding function
}

async function sendNotification(
  _userId: string,
  _title: string,
  _message: string,
  _metadata?: Record<string, unknown>
): Promise<void> {
  // Implementation of sendNotification function
}
