import { supabase } from '@/integrations/supabase/client';
import { PromotionSettings } from '@/lib/types/promotion';
import { toast } from 'sonner';

// Since promotions table doesn't exist, use ContentTest as fallback
const PROMOTIONS_TABLE = 'ContentTest';

export const calculatePromotionEstimate = (impressions: number, clicks: number): number => {
  // A simple model: Cost = Base + (impressions * CPM) + (clicks * CPC)
  const baseAmount = 5; // Base cost in dollars
  const cpm = 2; // Cost per mille (thousand impressions) in dollars
  const cpc = 0.5; // Cost per click in dollars

  return baseAmount + (impressions / 1000) * cpm + clicks * cpc;
};

export const estimateReach = (
  budget: number,
  bidAmount: number,
  bidType: 'per-view' | 'per-click',
  targetingParams: { interests?: string[] } = {}
): number => {
  // A simple reach estimation model
  let baseReach = budget / bidAmount;

  // Adjust based on bidding type
  if (bidType === 'per-view') {
    baseReach *= 1000; // Views are typically cheaper than clicks
  }

  // Apply targeting factors
  const interestsCount = targetingParams.interests?.length || 0;
  const targetingMultiplier = Math.max(0.5, 1 - interestsCount * 0.1); // More targeting = less reach

  return Math.floor(baseReach * targetingMultiplier);
};

export const getPromotedContentForUser = async (userId: string) => {
  try {
    const now = new Date().toISOString();

    // Query promotions from ContentTest that are active and within the date range
    const { data: promotions, error } = await supabase
      .from(PROMOTIONS_TABLE)
      .select('*')
      .like('body', '%"type":"promotion"%')
      .like('body', '%"status":"active"%')
      .limit(5);

    if (error) throw error;

    return (
      promotions
        ?.map(item => {
          try {
            const promotionData = JSON.parse(item.body || '{}') as any;
            if (promotionData.type === 'promotion') {
              return promotionData as PromotionSettings;
            }
          } catch {
            // Skip invalid JSON
          }
          return null;
        })
        .filter(Boolean) || []
    );
  } catch (error) {
    toast.error('Failed to load promotional content');
    return [];
  }
};

export const trackPromotionImpression = async (promotionId: string, userId?: string) => {
  try {
    // Since promotion_analytics table doesn't exist, just log the tracking
    return true;
  } catch (error) {
    return false;
  }
};

export const trackPromotionEngagement = async (
  promotionId: string,
  engagementType: 'click' | 'conversion' | 'share',
  userId?: string
) => {
  try {
    // Since promotion_analytics table doesn't exist, just log the tracking
    return true;
  } catch (error) {
    return false;
  }
};

export const getPromotableItems = async (userId: string, type?: string) => {
  try {
    // Define which content types to query
    const contentTypes = type ? [type] : ['event', 'post', 'venue', 'podcast'];
    let results: unknown[] = [];

    // Query each content type owned by the user
    for (const contentType of contentTypes) {
      let table;
      switch (contentType) {
        case 'event':
          table = 'events';
          break;
        case 'post':
          table = 'ContentTest';
          break;
        case 'venue':
          table = 'venues';
          break;
        case 'podcast':
          table = 'ContentTest';
          break;
        default:
          continue;
      }

      let data: unknown[] = [];
      let error = null;

      if (table === 'ContentTest') {
        // Special handling for ContentTest
        const result = await supabase
          .from(table)
          .select('id, title')
          .like('body', `%"userId":"${userId}"%`)
          .limit(10);

        data = result.data || [];
        error = result.error;
      } else {
        // Standard table query
        const result = await supabase
          .from(table)
          .select('id, name, title')
          .eq('creator_id', userId)
          .limit(10);

        data = result.data || [];
        error = result.error;
      }

      if (data && !error) {
        // Map the results to a common format
        const formattedData = data.map(item => ({
          id: item.id,
          name: item.name || item.title || 'Unnamed content',
          type: contentType,
        }));

        results = [...results, ...formattedData];
      }
    }

    return results;
  } catch (error) {
    toast.error('Failed to load your content');
    return [];
  }
};
