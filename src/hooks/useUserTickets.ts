import { getUserTickets, Ticket } from '@/services/ticketService';
import { useAuth } from '@/providers/AuthProvider';
import { useQuery } from '@tanstack/react-query';

export const useUserTickets = () => {
  const { user } = useAuth();
  const query = useQuery<Ticket[]>({
    queryKey: ['user-tickets', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return getUserTickets(user.id);
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  return {
    tickets: query.data || [],
    loading: query.isLoading,
    error: query.error ? 'Could not load your tickets. Please try again later.' : null,
    refreshTickets: query.refetch,
  };
};
