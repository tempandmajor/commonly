import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { handleError } from '@/utils/errorUtils';

/**
 * Updates the status of a promotion in the database
 * @param promotionId - The ID of the promotion to update
 * @param status - The new status for the promotion
 * @returns Promise resolving to a boolean indicating success or failure
 */
export const updatePromotionStatus = async (
  promotionId: string,
  status: 'active' | 'completed' | 'pending' | 'rejected'
): Promise<boolean> => {
  try {
    // First, fetch the current promotion data
    const { data: promotion, error: fetchError } = await supabase
      .from('ContentTest')
      .select('*')
      .eq('id', promotionId)
      .single();

    if (fetchError) throw fetchError;
    if (!promotion) throw new Error(`Promotion with ID ${promotionId} not found`);

    // Parse the promotion body
    let promotionData;
    try {
      promotionData = JSON.parse(promotion.body || '{}') as any;
    } catch (e) {
      throw new Error(`Invalid promotion data format: ${e.message}`);
    }

    if (promotionData.type !== 'promotion') {
      throw new Error(`Content with ID ${promotionId} is not a promotion`);
    }

    // Update the status
    promotionData.isActive = status === 'active';
    promotionData.status = status;
    promotionData.lastUpdated = new Date().toISOString();

    // Update in database
    const { error: updateError } = await supabase
      .from('ContentTest')
      .update({
        body: JSON.stringify(promotionData),
        updated_at: new Date().toISOString(),
      })
      .eq('id', promotionId);

    if (updateError) throw updateError;

    // Log the status change event
    const { error: logError } = await supabase.from('Events').insert({
      event_type: 'promotion_status_change',
      event_object_id: promotionId,
      event_data: JSON.stringify({
        previous_status: promotionData.previousStatus || 'unknown',
        new_status: status,
        timestamp: new Date().toISOString(),
      }),
    });

    if (logError) {
      // Non-critical error, continue
    }

    // Show success toast
    const statusText = status.charAt(0).toUpperCase() + status.slice(1);
    toast.success(`Promotion ${statusText}`);
    return true;
  } catch (error) {
    handleError(error, { promotionId, status }, 'Error updating promotion status');
    toast.error('Failed to update promotion status');
    return false;
  }
};
