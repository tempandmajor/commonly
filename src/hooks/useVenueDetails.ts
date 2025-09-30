import { useQuery } from '@tanstack/react-query';
import { getVenueById } from '@/services/venue';
import { toast } from 'sonner';
import { Venue } from '@/lib/types/venue';

export const useVenueDetails = (venueId: string | undefined) => {
  return useQuery({
    queryKey: ['venue', venueId],
    queryFn: async () => {
      try {
        if (!venueId) {
          throw new Error('Venue ID is required');
        }

        return getVenueById(venueId);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to load venue details';
        toast.error('Error loading venue', { description: errorMessage });
        throw error;
      }
    },
    enabled: !!venueId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export default useVenueDetails;
