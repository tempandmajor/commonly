import { useDataFetch } from './useDataFetch';
import { supabase } from '@/integrations/supabase/client';

interface Promotion {
  id: string;
  title: string;
  description: string;
  discount: number;
  expiresAt: string;
  isActive: boolean;
}

const fetchPromotions = async (): Promise<Promotion[]> => {
  try {
    // Fetch active promotions from the database
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      return [];
    }

    // Transform the data to match the Promotion interface if needed
    return (data || []).map(promo => ({
      id: promo.id,
      title: promo.title,
      description: promo.description,
      discount: promo.discount_percentage || promo.discount || 0,
      expiresAt: promo.expires_at || promo.expiry_date,
      isActive: promo.status === 'active',
    }));
  } catch (error) {
    return [];
  }
};

export const usePromotionData = () => {
  const { data, isLoading, error } = useDataFetch(fetchPromotions, [], {
    errorMessage: 'Failed to load promotions',
  });

  return {
    promotions: data || [],
    isLoading,
    error,
  };
};
