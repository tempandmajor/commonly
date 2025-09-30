import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Gets analytics data for a specific promotion
 * Retrieves impression, click, and conversion data from the database
 *
 * @param promotionId - The ID of the promotion to get analytics for
 * @returns Array of analytics data points
 */
export const getPromotionAnalytics = async (promotionId: string) => {
  try {
    // Get analytics events from the Events table
    const { data: eventsData, error: eventsError } = await supabase
      .from('Events')
      .select('*')
      .eq('event_object_id', promotionId)
      .in('event_type', ['promotion_view', 'promotion_click', 'promotion_redeem'])
      .order('created_at', { ascending: false });

    if (eventsError) throw eventsError;

    // Get redemption data from Orders table
    const { data: ordersData, error: ordersError } = await supabase
      .from('Orders')
      .select('id, created_at, total, promotion_id')
      .eq('promotion_id', promotionId);

    if (ordersError) throw ordersError;

    // Aggregate data by date
    const analyticsMap = new Map();

    // Process events data
    (eventsData || []).forEach(event => {
      const dateStr = new Date(event.created_at).toISOString().split('T')[0];

      if (!analyticsMap.has(dateStr)) {
        analyticsMap.set(dateStr, {
          id: `${promotionId}-${dateStr}`,
          promotionId,
          date: dateStr,
          impressions: 0,
          clicks: 0,
          conversions: 0,
          spend: 0,
        });
      }

      const analytics = analyticsMap.get(dateStr);

      // Increment counters based on event type
      switch (event.event_type) {
        case 'promotion_view':
          analytics.impressions++;
          break;
        case 'promotion_click':
          analytics.clicks++;
          break;
        case 'promotion_redeem':
          analytics.conversions++;
          break;
      }
    });

    // Process orders data for spend tracking
    (ordersData || []).forEach(order => {
      const dateStr = new Date(order.created_at).toISOString().split('T')[0];

      if (!analyticsMap.has(dateStr)) {
        analyticsMap.set(dateStr, {
          id: `${promotionId}-${dateStr}`,
          promotionId,
          date: dateStr,
          impressions: 0,
          clicks: 0,
          conversions: 0,
          spend: 0,
        });
      }

      const analytics = analyticsMap.get(dateStr);
      analytics.spend += order.total || 0;
    });

    // Convert map to array and sort by date
    return Array.from(analyticsMap.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  } catch (error) {
    toast.error('Failed to load analytics data');
    return [];
  }
};
