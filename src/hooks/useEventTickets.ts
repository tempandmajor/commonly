import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEventTickets, scanTicketAtomic, Ticket } from '@/services/ticketService';
import { useAuth } from '@/providers/AuthProvider';
import { handleError } from '@/utils/errorUtils';
import { toast } from 'sonner';

const queryKeys = {
  eventTickets: (eventId: string) => ['tickets', 'event', eventId] as const,
};

export const useEventTickets = (eventId?: string) => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const enabled = !!eventId;

  const { data, isLoading, error, refetch } = useQuery<Ticket[]>({
    queryKey: enabled ? queryKeys.eventTickets(eventId!) : ['tickets', 'event', 'disabled'],
    queryFn: async () => {
      if (!eventId) return [];
      return await getEventTickets(eventId);
    },
    enabled,
    staleTime: 30_000,
  });

  const { mutateAsync: scanMutate, isPending: validating } = useMutation({
    mutationFn: async (ticketId: string) => {
      if (!user || !eventId) throw new Error('Not authenticated');
      const res = await scanTicketAtomic({ code: ticketId, eventId });
      if (!res.success) throw new Error(res.message || 'Scan failed');
      return res.ticket;
    },
    onMutate: async (ticketId: string) => {
      if (!eventId) return;
      await qc.cancelQueries({ queryKey: queryKeys.eventTickets(eventId) });
      const prev = qc.getQueryData<Ticket[]>(queryKeys.eventTickets(eventId));
      // optimistic mark used
      if (prev) {
        qc.setQueryData<Ticket[]>(
          queryKeys.eventTickets(eventId),
          prev.map(t => (t.id === ticketId ? { ...t, status: 'used' } : t))
        );
      }
      return { prev };
    },
    onError: (err: any, _ticketId, ctx) => {
      if (err) handleError(err, {}, 'Failed to scan ticket');
      toast.error(typeof err?.message === 'string' ? err.message : 'Failed to scan ticket');
      if (eventId && ctx?.prev) qc.setQueryData(queryKeys.eventTickets(eventId), ctx.prev);
    },
    onSuccess: () => {
      if (eventId) qc.invalidateQueries({ queryKey: queryKeys.eventTickets(eventId) });
      toast.success('Ticket scanned');
    },
  });

  const validateTicket = useMemo(
    () => async (ticketId: string) => {
      try {
        return await scanMutate(ticketId);
      } catch {
        return null;
      }
    },
    [scanMutate]
  );

  return {
    tickets: data || [],
    loading: isLoading,
    error,
    validating,
    validateTicket,
    refreshTickets: refetch,
  };
};
