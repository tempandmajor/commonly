import { supabase } from '@/integrations/supabase/client';

/**
 * Update ticket reservations for an event
 * @param eventId The ID of the event
 * @param quantity Number of tickets to reserve/release
 * @param isAllOrNothing Whether this is an all-or-nothing event
 * @returns Promise that resolves when tickets are updated
 */
export const updateTicketReservation = async (
  eventId: string,
  quantity: number,
  isAllOrNothing: boolean
): Promise<void> => {
  try {
    // Get current event data
    const { data: eventData, error: fetchError } = await supabase
      .from('events')
      .select('id, title, max_capacity, available_tickets, reserved_tickets, tickets_sold')
      .eq('id', eventId)
      .single();

    if (fetchError) throw fetchError;

    if (!eventData) {
      throw new Error(`Event ${eventId} not found`);
    }

    const currentAvailable = eventData.available_tickets || eventData.max_capacity || 0;
    const currentReserved = eventData.reserved_tickets || 0;
    const currentSold = eventData.tickets_sold || 0;

    // Check if enough tickets are available
    if (currentAvailable < quantity) {
      throw new Error(
        `Not enough tickets available. Requested: ${quantity}, Available: ${currentAvailable}`
      );
    }

    let updateData: any = {};

    if (isAllOrNothing) {
      // For all-or-nothing events, move tickets from available to reserved
      updateData = {
        available_tickets: currentAvailable - quantity,
        reserved_tickets: currentReserved + quantity,
      };
    } else {
      // For regular events, move tickets from available to sold
      updateData = {
        available_tickets: currentAvailable - quantity,
        tickets_sold: currentSold + quantity,
      };
    }

    // Update the event with new ticket counts
    const { error: updateError } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', eventId);

    if (updateError) throw updateError;
  } catch (error) {
    throw error;
  }
};

/**
 * Release reserved tickets back to available pool (for all-or-nothing events that fail)
 * @param eventId The ID of the event
 * @param quantity Number of tickets to release
 * @returns Promise that resolves when tickets are released
 */
export const releaseTicketReservation = async (
  eventId: string,
  quantity: number
): Promise<void> => {
  try {
    // Get current event data
    const { data: eventData, error: fetchError } = await supabase
      .from('events')
      .select('id, title, available_tickets, reserved_tickets')
      .eq('id', eventId)
      .single();

    if (fetchError) throw fetchError;

    if (!eventData) {
      throw new Error(`Event ${eventId} not found`);
    }

    const currentAvailable = eventData.available_tickets || 0;
    const currentReserved = eventData.reserved_tickets || 0;

    // Move tickets from reserved back to available
    const { error: updateError } = await supabase
      .from('events')
      .update({
        available_tickets: currentAvailable + quantity,
        reserved_tickets: Math.max(0, currentReserved - quantity),
      })
      .eq('id', eventId);

    if (updateError) throw updateError;
  } catch (error) {
    throw error;
  }
};

/**
 * Convert reserved tickets to sold tickets (when all-or-nothing goal is met)
 * @param eventId The ID of the event
 * @param quantity Number of tickets to convert
 * @returns Promise that resolves when tickets are converted
 */
export const convertReservedToSold = async (eventId: string, quantity: number): Promise<void> => {
  try {
    // Get current event data
    const { data: eventData, error: fetchError } = await supabase
      .from('events')
      .select('id, title, reserved_tickets, tickets_sold')
      .eq('id', eventId)
      .single();

    if (fetchError) throw fetchError;

    if (!eventData) {
      throw new Error(`Event ${eventId} not found`);
    }

    const currentReserved = eventData.reserved_tickets || 0;
    const currentSold = eventData.tickets_sold || 0;

    // Move tickets from reserved to sold
    const { error: updateError } = await supabase
      .from('events')
      .update({
        reserved_tickets: Math.max(0, currentReserved - quantity),
        tickets_sold: currentSold + quantity,
      })
      .eq('id', eventId);

    if (updateError) throw updateError;
  } catch (error) {
    throw error;
  }
};

/**
 * Initialize ticket counts for an event based on capacity
 * @param eventId The ID of the event
 * @param capacity The maximum capacity of the event
 * @returns Promise that resolves when tickets are initialized
 */
export const initializeEventTickets = async (eventId: string, capacity: number): Promise<void> => {
  try {
    const { error } = await supabase
      .from('events')
      .update({
        available_tickets: capacity,
        reserved_tickets: 0,
        tickets_sold: 0,
      })
      .eq('id', eventId);

    if (error) throw error;
  } catch (error) {
    throw error;
  }
};
