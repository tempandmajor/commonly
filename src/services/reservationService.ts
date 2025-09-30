import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface EventReservation {
  id: string;
  user_id: string;
  event_id: string;
  quantity: number;
  total_amount: number;
  status: 'reserved' | 'confirmed' | 'cancelled' | 'refunded';
  payment_intent_id?: string | undefined;
  expires_at?: string | undefined;
  reserved_at: string;
  confirmed_at?: string | undefined;
  cancelled_at?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
}

export interface ReservationData {
  eventId: string;
  quantity: number;
  totalAmount: number;
  paymentMethodId?: string | undefined;
}

export class ReservationService {
  /**
   * Reserve tickets for an all-or-nothing event
   * Creates a payment intent but doesn't charge immediately
   */
  static async reserveTickets(
    data: ReservationData
  ): Promise<{ success: boolean; reservation?: EventReservation; error?: string }> {
    try {
      // First check if user already has a reservation for this event
      const { data: existingReservation, error: checkError } = await supabase
        .from('event_attendees')
        .select('*')
        .eq('event_id', data.eventId)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 = no rows returned
        throw checkError;
      }

      if (existingReservation) {
        return {
          success: false,
          error: 'You already have a reservation for this event',
        };
      }

      // Check if event is still accepting reservations
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select(
          'id, title, available_tickets, reserved_tickets, max_capacity, funding_status, pledge_deadline'
        )
        .eq('id', data.eventId)
        .single();

      if (eventError) throw eventError;

      if (!eventData) {
        return {
          success: false,
          error: 'Event not found',
        };
      }

      if (eventData.funding_status !== 'in_progress') {
        return {
          success: false,
          error: 'Event is no longer accepting reservations',
        };
      }

      if (eventData.pledge_deadline && new Date(eventData.pledge_deadline) <= new Date()) {
        return {
          success: false,
          error: 'Reservation deadline has passed',
        };
      }

      const availableTickets = eventData.available_tickets || 0;
      if (availableTickets < data.quantity) {
        return {
          success: false,
          error: `Only ${availableTickets} tickets available`,
        };
      }

      // Create payment intent for future capture
      const { data: paymentIntent, error: paymentError } = await supabase.functions.invoke(
        'create-payment-intent',
        {
          body: {
            amount: Math.round(data.totalAmount * 100), // Convert to cents
            currency: 'usd',
            capture_method: 'manual', // Don't capture immediately
            payment_method: data.paymentMethodId,
            metadata: {
              event_id: data.eventId,
              quantity: data.quantity,
              type: 'event_reservation',
            },
          },
        }
      );

      if (paymentError) {
        return {
          success: false,
          error: 'Failed to create payment authorization. Please check your payment method.',
        };
      }

      // Create reservation record
      const { data: reservation, error: reservationError } = await supabase
        .from('event_attendees')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          event_id: data.eventId,
          quantity: data.quantity,
          total_amount: data.totalAmount,
          status: 'reserved',
          payment_intent_id: paymentIntent.payment_intent_id,
          expires_at: eventData.pledge_deadline,
          metadata: {
            payment_method_id: data.paymentMethodId,
          },
        })
        .select()
        .single();

      if (reservationError) throw reservationError;

      // Update event reserved tickets count
      const { error: updateError } = await supabase
        .from('events')
        .update({
          reserved_tickets: (eventData.reserved_tickets || 0) + data.quantity,
          available_tickets: availableTickets - data.quantity,
          attendees_count: (eventData.reserved_tickets || 0) + data.quantity,
        })
        .eq('id', data.eventId);

      if (updateError) {
      }

      // Send confirmation notification
      try {
        await supabase.rpc('send_notification', {
          p_user_id: (await supabase.auth.getUser()).data.user?.id,
          p_type: 'reservation_confirmed',
          p_title: 'Ticket Reservation Confirmed',
          p_message: `Your reservation for ${eventData.title} has been confirmed. You'll only be charged if the event reaches its goal before the deadline.`,
          p_data: {
            event_id: data.eventId,
            event_title: eventData.title,
            quantity: data.quantity,
            total_amount: data.totalAmount,
          },
        });
      } catch (_error) {
        // Error handling silently ignored
      }

      toast.success(
        "Tickets reserved successfully! You'll only be charged if the event reaches its goal."
      );

      return {
        success: true,
        reservation: reservation as EventReservation,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reserve tickets',
      };
    }
  }

  /**
   * Cancel a reservation
   */
  static async cancelReservation(
    reservationId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: reservation, error: fetchError } = await supabase
        .from('event_attendees')
        .select('*, events(title, reserved_tickets, available_tickets)')
        .eq('id', reservationId)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (fetchError) throw fetchError;

      if (reservation.status !== 'reserved') {
        return {
          success: false,
          error: 'Reservation cannot be cancelled',
        };
      }

      // Cancel the reservation
      const { error: cancelError } = await supabase
        .from('event_attendees')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', reservationId);

      if (cancelError) throw cancelError;

      // Update event ticket counts
      const eventData = reservation.events as unknown;
      const { error: updateError } = await supabase
        .from('events')
        .update({
          reserved_tickets: Math.max(0, (eventData.reserved_tickets || 0) - reservation.quantity),
          available_tickets: (eventData.available_tickets || 0) + reservation.quantity,
          attendees_count: Math.max(0, (eventData.reserved_tickets || 0) - reservation.quantity),
        })
        .eq('id', reservation.event_id);

      if (updateError) {
      }

      // Cancel payment intent if it exists
      if (reservation.payment_intent_id) {
        try {
          await supabase.functions.invoke('cancel-payment-intent', {
            body: { payment_intent_id: reservation.payment_intent_id },
          });
        } catch (_error) {
          // Error handling silently ignored
        }
      }

      toast.success('Reservation cancelled successfully');

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel reservation',
      };
    }
  }

  /**
   * Get user's reservations
   */
  static async getUserReservations(userId?: string): Promise<EventReservation[]> {
    try {
      const user = userId || (await supabase.auth.getUser()).data.user?.id;
      if (!user) return [];

      const { data, error } = await supabase
        .from('event_attendees')
        .select(
          `
          *,
          events (
            id,
            title,
            start_date,
            location,
            image_url,
            funding_status,
            target_amount,
            current_amount
          )
        `
        )
        .eq('user_id', user)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get event attendees/reservations
   */
  static async getEventAttendees(eventId: string): Promise<EventReservation[]> {
    try {
      const { data, error } = await supabase
        .from('event_attendees')
        .select('*')
        .eq('event_id', eventId)
        .in('status', ['reserved', 'confirmed'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      return [];
    }
  }
}

export default ReservationService;
