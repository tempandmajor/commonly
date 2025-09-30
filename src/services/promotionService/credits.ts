import { supabase } from '@/integrations/supabase/client';
import { PromotionCredit } from '../promotionTypes';

// Since PROMOTIONAL_CREDITS table doesn't exist, use ContentTest as fallback
const PROMOTIONAL_CREDITS_TABLE = 'ContentTest';

export async function getAvailablePromotionalCredit(userId: string): Promise<number> {
  try {
    // Use ContentTest to store promotional credits data
    const { data: credits, error } = await supabase
      .from(PROMOTIONAL_CREDITS_TABLE)
      .select('body')
      .like('body', `%"type":"promotional_credit"%`)
      .like('body', `%"userId":"${userId}"%`);

    if (error) throw error;

    return (
      credits?.reduce((total, credit) => {
        try {
          const creditData = JSON.parse(credit.body || '{}') as any;
          if (creditData.type === 'promotional_credit' && creditData.status === 'active') {
            return total + (creditData.remainingAmount || 0);
          }
        } catch {
          // Skip invalid JSON
        }
        return total;
      }, 0) || 0
    );
  } catch (error) {
    return 0;
  }
}

/**
 * Deducts promotional credits from a user's available credits
 * @param userId - The user ID to deduct credits from
 * @param amount - The amount of credits to deduct
 * @returns boolean indicating success or failure
 */
export async function deductPromotionalCredit(userId: string, amount: number): Promise<boolean> {
  try {
    // Get the user's current credits
    const { data: credits, error: fetchError } = await supabase
      .from(PROMOTIONAL_CREDITS_TABLE)
      .select('id, body')
      .like('body', `%"type":"promotional_credit"%`)
      .like('body', `%"userId":"${userId}"%`)
      .like('body', `%"status":"active"%`)
      .order('created_at', { ascending: true });

    if (fetchError) throw fetchError;

    let remainingAmountToDeduct = amount;
    const updatedCredits = [];

    // Process credits until we've deducted the full amount or run out of credits
    for (const credit of credits || []) {
      try {
        const creditData = JSON.parse(credit.body || '{}') as any;

        if (
          creditData.type !== 'promotional_credit' ||
          creditData.status !== 'active' ||
          creditData.userId !== userId
        ) {
          continue;
        }

        const currentAmount = creditData.remainingAmount || 0;

        if (currentAmount <= 0) continue;

        // Determine how much to deduct from this credit
        const deduction = Math.min(currentAmount, remainingAmountToDeduct);
        remainingAmountToDeduct -= deduction;

        // Update the credit data
        creditData.remainingAmount = currentAmount - deduction;
        creditData.lastUsed = new Date().toISOString();

        // If fully used, mark as inactive
        if (creditData.remainingAmount <= 0) {
          creditData.status = 'used';
        }

        // Add to the list of credits to update
        updatedCredits.push({
          id: credit.id,
          body: JSON.stringify(creditData),
        });

        // If we've deducted the full amount, we can stop
        if (remainingAmountToDeduct <= 0) break;
      } catch (e) {
        // Skip invalid JSON and continue with next credit
      }
    }

    // If we couldn't deduct the full amount, return false
    if (remainingAmountToDeduct > 0) {
      return false;
    }

    // Update each credit in the database
    for (const credit of updatedCredits) {
      const { error: updateError } = await supabase
        .from(PROMOTIONAL_CREDITS_TABLE)
        .update({ body: credit.body })
        .eq('id', credit.id);

      if (updateError) throw updateError;
    }

    // Log the transaction
    const { error: logError } = await supabase.from('Events').insert({
      event_type: 'promotional_credit_used',
      user_id: userId,
      event_data: JSON.stringify({
        amount: amount,
        credits_used: updatedCredits.length,
        timestamp: new Date().toISOString(),
      }),
    });

    if (logError) return true;
  } catch (error) {
    return false;
  }
}

export const getUserPromotionalCredits = async (userId: string): Promise<PromotionCredit[]> => {
  try {
    // Use ContentTest to get promotional credits
    const { data: credits, error } = await supabase
      .from(PROMOTIONAL_CREDITS_TABLE)
      .select('*')
      .like('body', `%"type":"promotional_credit"%`)
      .like('body', `%"userId":"${userId}"%`);

    if (error) throw error;

    return (
      credits
        ?.map(credit => {
          try {
            const creditData = JSON.parse(credit.body || '{}') as any;
            if (creditData.type === 'promotional_credit') {
              return {
                id: credit.id,
                userId: creditData.userId,
                userName: creditData.userName || 'User',
                amount: creditData.amount || 0,
                remainingAmount: creditData.remainingAmount || 0,
                createdAt: credit.created_at ? new Date(credit.created_at) : new Date(),
                expiresAt: creditData.expiresAt ? new Date(creditData.expiresAt) : new Date(),
                reason: creditData.reason || 'Promotional credit',
                createdBy: creditData.createdBy || 'system',
                status: creditData.status || 'active',
              } as PromotionCredit;
            }
          } catch {
            // Skip invalid JSON
          }
          return null;
        })
        .filter(Boolean) || []
    );
  } catch (error) {
    return [];
  }
};
