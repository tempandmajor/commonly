// Production Ticket Service - Real Implementation
import { supabase } from '@/integrations/supabase/client';

export interface Ticket {
  id: string;
  eventId: string;
  userId: string;
  eventTitle: string;
  ticketType: string;
  price: number;
  status: 'active' | 'used' | 'cancelled';
  purchaseDate: string;
  qrCode: string;
}

export const createTicket = async (
  eventId: string,
  userId: string,
  ticketData: {
    type: string;
    price: number;
    eventTitle: string;
  }
): Promise<Ticket | null> => {
  try {
    const ticketId = `ticket_${Date.now()}_${Math.random().toString(36).substring(2)}`;

    const { data, error } = await supabase
      .from('tickets')
      .insert({
        id: ticketId,
        event_id: eventId,
        user_id: userId,
        ticket_type: ticketData.type,
        price_in_cents: Math.round(ticketData.price * 100),
        status: 'active',
        purchase_date: new Date().toISOString(),
        qr_code: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${ticketId}`,
      })
      .select()
      .single();

    if (error) throw error;

    const typedData = data as any;
    return {
      id: typedData.id,
      eventId: typedData.event_id,
      userId: typedData.user_id,
      eventTitle: ticketData.eventTitle,
      ticketType: typedData.ticket_type,
      price: typedData.price_in_cents / 100,
      status: typedData.status as 'active' | 'used' | 'cancelled',
      purchaseDate: typedData.purchase_date,
      qrCode: typedData.qr_code,
    };
  } catch (error) {
    return null;
  }
};

// New: mint a signed, opaque ticket token for QR payloads
export const mintTicketToken = async (ticketId: string): Promise<string | null> => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return null;
    const res = await supabase.functions.invoke('scan-ticket', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: { action: 'mint', ticketId },
    });
    const token = (res as any)?.data?.token as string | undefined;
    return token || null;
  } catch {
    return null;
  }
};

// New: atomic validate+mark-used with role checks handled by Edge Function
export const scanTicketAtomic = async (params: {
  token?: string;
  code?: string;
  eventId: string;
}): Promise<{
  success: boolean;
  message?: string;
  ticket?: Ticket;
}> => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return { success: false, message: 'Not authenticated' };
    const res = await supabase.functions.invoke('scan-ticket', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: { action: 'scan', ...params },
    });
    const ok = (res as any)?.data?.success as boolean | undefined;
    const message = (res as any)?.data?.message as string | undefined;
    const ticket = (res as any)?.data?.ticket as Ticket | undefined;
    return { success: !!ok, message, ticket };
  } catch (e) {
    return { success: false, message: 'Scan failed' };
  }
};

// New: mint a signed, opaque ticket token for QR payloads

export const updateTicketStatus = async (
  ticketId: string,
  status: 'active' | 'used' | 'cancelled'
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('tickets')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ticketId);

    if (error) throw error;
    return true;
  } catch (error) {
    return false;
  }
};

export const getUserTickets = async (userId: string): Promise<Ticket[]> => {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select(
        `
        *,
        events!inner(title)
      `
      )
      .eq('user_id', userId)
      .order('purchase_date', { ascending: false });

    if (error) throw error;

    return (
      data?.map((ticket: any) => ({
        id: ticket.id,
        eventId: ticket.event_id,
        userId: ticket.user_id,
        eventTitle: ticket.events?.title || 'Unknown Event',
        ticketType: ticket.ticket_type,
        price: ticket.price_in_cents / 100,
        status: ticket.status as 'active' | 'used' | 'cancelled',
        purchaseDate: ticket.purchase_date,
        qrCode: ticket.qr_code,
      })) || []
    );
  } catch (error) {
    return [];
  }
};

export const getEventTickets = async (eventId: string): Promise<Ticket[]> => {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select(
        `
        *,
        users!inner(display_name, email)
      `
      )
      .eq('event_id', eventId)
      .order('purchase_date', { ascending: false });

    if (error) throw error;

    return (
      data?.map((ticket: any) => ({
        id: ticket.id,
        eventId: ticket.event_id,
        userId: ticket.user_id,
        eventTitle: 'Event', // Would be joined from events table
        ticketType: ticket.ticket_type,
        price: ticket.price_in_cents / 100,
        status: ticket.status as 'active' | 'used' | 'cancelled',
        purchaseDate: ticket.purchase_date,
        qrCode: ticket.qr_code,
      })) || []
    );
  } catch (error) {
    return [];
  }
};

export const validateTicket = async (ticketId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('status')
      .eq('id', ticketId)
      .single();

    if (error) throw error;
    return (data as any)?.status === 'active';
  } catch (error) {
    return false;
  }
};

export const scanTicket = async (ticketId: string): Promise<boolean> => {
  try {
    const isValid = await validateTicket(ticketId);
    if (!isValid) return false;

    const success = await updateTicketStatus(ticketId, 'used');
    return success;
  } catch (error) {
    return false;
  }
};

export const verifyTicketByCode = async (
  ticketCode: string,
  eventId: string
): Promise<Ticket | null> => {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select(
        `
        *,
        events!inner(title),
        users!inner(display_name, email)
      `
      )
      .eq('id', ticketCode)
      .eq('event_id', eventId)
      .single();

    if (error) throw error;

    const typedData = data as any;
    return {
      id: typedData.id,
      eventId: typedData.event_id,
      userId: typedData.user_id,
      eventTitle: typedData.events?.title || 'Unknown Event',
      ticketType: typedData.ticket_type,
      price: typedData.price_in_cents / 100,
      status: typedData.status as 'active' | 'used' | 'cancelled',
      purchaseDate: typedData.purchase_date,
      qrCode: typedData.qr_code,
    };
  } catch (error) {
    return null;
  }
};
