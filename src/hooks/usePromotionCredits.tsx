import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import {
  getUserPromotionalCredits,
  getPlatformCreditBalance,
  getAvailablePromotionalCredit,
  PromotionCredit,
} from '@/services/creditService';

// Define credit types for UI components
interface CreditSummary {
  available: number;
  platformCredit: number;
  promotionalCredit: number;
  expiringCredits: PromotionCredit[];
  closeToExpiry: boolean;
  hasCredits: boolean;
}

export const usePromotionCredits = () => {
  const [credits, setCredits] = useState<PromotionCredit[]>([]);
  const [creditSummary, setCreditSummary] = useState<CreditSummary>({
    available: 0,
    platformCredit: 0,
    promotionalCredit: 0,
    expiringCredits: [],
    closeToExpiry: false,
    hasCredits: false,
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Function to refresh credits
  const refreshCredits = async () => {
    if (!user) {
      setCredits([]);
      setCreditSummary({
        available: 0,
        platformCredit: 0,
        promotionalCredit: 0,
        expiringCredits: [],
        closeToExpiry: false,
        hasCredits: false,
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Get promotional credits
      const promotionCredits = await getUserPromotionalCredits(user.id);
      setCredits(promotionCredits);

      // Get platform credit balance
      const platformCredit = await getPlatformCreditBalance(user.id);

      // Get available promotional credit
      const promotionalCredit = await getAvailablePromotionalCredit(user.id);

      // Calculate total available credit
      const totalAvailable = platformCredit + promotionalCredit;

      // Find credits expiring in the next 7 days
      const now = new Date();
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(now.getDate() + 7);

      const expiringCredits = promotionCredits.filter(credit => {
        const expiryDate = new Date(credit.expiresAt);
        return (
          credit.status === 'active' &&
          credit.remainingAmount > 0 &&
          expiryDate > now &&
          expiryDate < sevenDaysFromNow
        );
      });

      setCreditSummary({
        available: totalAvailable,
        platformCredit,
        promotionalCredit,
        expiringCredits,
        closeToExpiry: expiringCredits.length > 0,
        hasCredits: totalAvailable > 0,
      });
    } catch (_error) {
      // Error handling silently ignored
    } finally {
      setLoading(false);
    }
  };

  // Load credits on component mount and when user changes
  useEffect(() => {
    refreshCredits();
  }, [user]);

  return {
    credits,
    creditSummary,
    loading,
    refreshCredits,
    hasPromotionalCredit: creditSummary.promotionalCredit > 0,
    hasPlatformCredit: creditSummary.platformCredit > 0,
    hasCredits: creditSummary.hasCredits,
  };
};
