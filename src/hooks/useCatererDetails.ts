import { useQuery } from '@tanstack/react-query';
import { getCaterer } from '@/services/catererService';
import { toast } from 'sonner';

export const useCatererDetails = (id: string | undefined) => {
  return useQuery({
    queryKey: ['caterer', id],
    queryFn: async () => {
      try {
        if (!id) {
          throw new Error('Caterer ID is required');
        }
        const data = await getCaterer(id);
        if (!data) {
          throw new Error('Caterer not found');
        }
        return data;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to load caterer details';
        toast.error('Error loading caterer', { description: errorMessage });
        throw error;
      }
    },
    enabled: !!id,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export default useCatererDetails;
