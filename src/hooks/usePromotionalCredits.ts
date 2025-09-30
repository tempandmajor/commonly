import { useAuth } from '@/providers/AuthProvider';
import { getUserPromotionalCredits } from '@/services/promotionService';
import { PromotionCredit } from '@/services/promotionTypes';
import { useDataFetch } from './useDataFetch';

// Export the PromotionCredit type for external use
export type { PromotionCredit };

export const usePromotionalCredits = () => {
  const { user } = useAuth();

  const fetchCredits = async (): Promise<PromotionCredit[]> => {
    if (!user) {
      return [];
    }

    const userCredits = await getUserPromotionalCredits(user.id);
    return userCredits.map(credit => ({
          ...credit,
      userName: user.email || 'User', // Use email instead of displayName
    }));
  };

  const { data, isLoading, refetch } = useDataFetch(fetchCredits, [user?.id], {
    errorMessage: 'Failed to load promotional credits',
    fetchOnMount: !!user,
  });

  return {
    credits: data || [],
    loading: isLoading,
    refreshCredits: refetch,
  };
};
