import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PromotionSettings } from '@/lib/types/promotion';
import { hasEnoughCredits, applyCredit } from '@/services/creditService';

export const createPromotion = async (
  promotion: Omit<PromotionSettings, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string | null> => {
  try {
    // Check if user has enough credits (combined platform and promotional)
    const hasCredits = await hasEnoughCredits(promotion.userId!, promotion.budget);

    let paymentResult: { success: boolean; message?: string } = { success: false };

    if (hasCredits) {
      // Use available credits first
      const creditUsed = await applyCredit(
        promotion.userId!,
        promotion.budget,
        `Promotion: ${promotion.title}`,
        { promotionType: promotion.type }
      );

      if (creditUsed) {
        paymentResult.success = true;
      }
    }

    // If credits were insufficient, process payment
    if (!paymentResult.success) {
      const { data, error } = await supabase.functions.invoke('createPromotionPayment', {
        body: {
          amount: promotion.budget,
          userId: promotion.userId,
        },
      });

      if (error) {
        throw error;
      }

      paymentResult = { success: data.success, message: data.message };
    }

    if (paymentResult.success) {
      const promotionData = {
          ...promotion,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        paidWithCredits: hasCredits,
        stats: {
          impressions: 0,
          clicks: 0,
          conversions: 0,
          spent: 0,
          engagements: 0,
        },
      };

      // Use ContentTest as fallback since promotions table doesn't exist
      const { data, error } = await supabase
        .from('ContentTest')
        .insert({
          title: promotion.title,
          body: JSON.stringify({ type: 'promotion', ...promotionData }),
        })
        .select('id')
        .single();

      if (error) throw error;
      return data?.id || null;
    } else {
      toast.error(
        'Payment failed: ' + (paymentResult.message || 'Insufficient funds or payment declined')
      );
      return null;
    }
  } catch (error) {
    toast.error('Failed to create promotion');
    return null;
  }
};
