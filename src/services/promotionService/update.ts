import { supabase } from '@/integrations/supabase/client';

export const updatePromotionStatus = async (
  promotionId: string,
  status: 'pending' | 'active' | 'completed' | 'rejected'
): Promise<boolean> => {
  try {
    // Since promotions table doesn't exist, use ContentTest as fallback
    // First get the existing promotion data
    const { data: existing, error: fetchError } = await supabase
      .from('ContentTest')
      .select('*')
      .eq('id', promotionId)
      .single();

    if (fetchError) throw fetchError;

    // Parse existing data and update status
    const existingData = JSON.parse(existing.body || '{}') as any;
    const updatedData = {
          ...existingData,
      status,
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('ContentTest')
      .update({
        body: JSON.stringify(updatedData),
      })
      .eq('id', promotionId);

    if (error) throw error;
    return true;
  } catch (error) {
    return false;
  }
};
