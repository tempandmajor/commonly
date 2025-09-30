/**
 * Comprehensive Dashboard Analytics Service
 */

import { supabase } from '@/integrations/supabase/client';

export interface AnalyticsData {
  // Core Metrics
  totalRevenue: number;
  revenueChange: number;
  totalFollowers: number;
  followersChange: number;
  totalEvents: number;
  eventsChange: number;
  totalProducts: number;
  productsChange: number;

  // Engagement Metrics
  engagementRate: number;
  engagementChange: number;
  conversionRate: number;
  conversionChange: number;

  // Activity Counts
  ordersCount: number;
  eventsCount: number;
  messagesCount: number;
  postsCount: number;

  // Financial Data
  totalEarnings: number;
  pendingPayments: number;
  walletBalance: number;

  // User Activity
  profileViews: number;
  contentViews: number;
  clickThroughRate: number;
}

export interface RecentActivity {
  id: string;
  type: 'sale' | 'follow' | 'event' | 'message' | 'project' | 'payment' | 'booking';
  description: string;
  amount?: number | undefined;
  timestamp: Date;
  user?: string | undefined;
  metadata?: Record<string, any> | undefined;
}

export interface TimeSeriesData {
  date: string;
  revenue: number;
  events: number;
  followers: number;
  orders: number;
}

export class DashboardAnalyticsService {
  static async getUserAnalytics(userId: string, days: number = 30): Promise<AnalyticsData> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    // Previous period for comparison
    const prevEndDate = new Date(startDate);
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - days);

    try {
      // Parallel fetch for better performance
      const [
        events,
        prevEvents,
        userProducts,
        orders,
        prevOrders,
        follows,
        prevFollows,
        payments,
        wallet,
        posts,
        activities,
        messages,
      ] = await Promise.all([
        // Current period events
        supabase
          .from('events')
          .select('*')
          .eq('creator_id', userId)
          .gte('created_at', startDate.toISOString()),

        // Previous period events
        supabase
          .from('events')
          .select('*')
          .eq('creator_id', userId)
          .gte('created_at', prevStartDate.toISOString())
          .lt('created_at', startDate.toISOString()),

        // User's products
        supabase.from('products').select('*').eq('store_id', userId), // Assuming store_id links to user

        // Current period orders
        supabase
          .from('orders')
          .select(
            `
            *,
            store:stores!orders_store_id_fkey(owner_id)
          `
          )
          .eq('stores.owner_id', userId)
          .gte('created_at', startDate.toISOString()),

        // Previous period orders
        supabase
          .from('orders')
          .select(
            `
            *,
            store:stores!orders_store_id_fkey(owner_id)
          `
          )
          .eq('stores.owner_id', userId)
          .gte('created_at', prevStartDate.toISOString())
          .lt('created_at', startDate.toISOString()),

        // Current followers
        supabase
          .from('follows')
          .select('*')
          .eq('following_id', userId)
          .gte('created_at', startDate.toISOString()),

        // Previous followers
        supabase
          .from('follows')
          .select('*')
          .eq('following_id', userId)
          .gte('created_at', prevStartDate.toISOString())
          .lt('created_at', startDate.toISOString()),

        // Payments
        supabase
          .from('payments')
          .select('*')
          .eq('user_id', userId)
          .gte('created_at', startDate.toISOString()),

        // Wallet balance
        supabase.from('wallets').select('*').eq('user_id', userId).single(),

        // Posts
        supabase
          .from('posts')
          .select('*')
          .eq('creator_id', userId)
          .gte('created_at', startDate.toISOString()),

        // User activities for engagement
        supabase
          .from('user_activities')
          .select('*')
          .eq('user_id', userId)
          .gte('created_at', startDate.toISOString()),

        // Messages
        supabase
          .from('messages')
          .select('*')
          .eq('sender_id', userId)
          .gte('created_at', startDate.toISOString()),
      ]);

      // Calculate metrics
      const currentRevenue =
        (orders.data as any)?.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0) || 0;
      const prevRevenue =
        (prevOrders.data as any)?.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0) || 0;
      const revenueChange =
        prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 0;

      const currentFollowers = follows.data?.length || 0;
      const prevFollowersCount = prevFollows.data?.length || 0;
      const followersChange =
        prevFollowersCount > 0
          ? ((currentFollowers - prevFollowersCount) / prevFollowersCount) * 100
          : 0;

      const currentEvents = events.data?.length || 0;
      const prevEventsCount = prevEvents.data?.length || 0;
      const eventsChange =
        prevEventsCount > 0 ? ((currentEvents - prevEventsCount) / prevEventsCount) * 100 : 0;

      const totalProducts = userProducts.data?.length || 0;
      const ordersCount = orders.data?.length || 0;
      const engagementRate = activities.data?.length || 0;
      const walletBalance = (wallet.data as any)?.balance_cents || 0;

      return {
        totalRevenue: currentRevenue,
        revenueChange,
        totalFollowers: currentFollowers,
        followersChange,
        totalEvents: currentEvents,
        eventsChange,
        totalProducts,
        productsChange: 0, // Could calculate if we track product history
        engagementRate: engagementRate,
        engagementChange: 0, // Could calculate with previous period
        conversionRate: ordersCount > 0 ? (ordersCount / (activities.data?.length || 1)) * 100 : 0,
        conversionChange: 0,
        ordersCount,
        eventsCount: currentEvents,
        messagesCount: messages.data?.length || 0,
        postsCount: posts.data?.length || 0,
        totalEarnings: currentRevenue,
        pendingPayments:
          (payments.data as any)
            ?.filter((p: any) => p.status === 'pending')
            .reduce((sum: number, p: any) => sum + p.amount, 0) || 0,
        walletBalance: walletBalance / 100, // Convert from cents
        profileViews: (activities.data as any)?.filter((a: any) => a.activity_type === 'profile_view').length || 0,
        contentViews: (activities.data as any)?.filter((a: any) => a.activity_type === 'content_view').length || 0,
        clickThroughRate: 0, // Would need more specific tracking
      };
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  }

  static async getRecentActivity(userId: string, limit: number = 10): Promise<RecentActivity[]> {
    try {
      const activities: RecentActivity[] = [];

      // Get recent orders
      const { data: orders } = await supabase
        .from('orders')
        .select(
          `
          *,
          store:stores!orders_store_id_fkey(owner_id),
          user:users!orders_user_id_fkey(name, display_name)
        `
        )
        .eq('stores.owner_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      (orders as any)?.forEach((order: any) => {
        activities.push({
          id: `order_${order.id}`,
          type: 'sale',
          description: `Sale: Order #${order.id.slice(-8)}`,
          amount: order.total_amount,
          timestamp: new Date(order.created_at),
          user: order.user?.display_name || order.user?.name || 'Unknown User',
        });
      });

      // Get recent followers
      const { data: follows } = await supabase
        .from('follows')
        .select(
          `
          *,
          follower:users!follows_follower_id_fkey(name, display_name)
        `
        )
        .eq('following_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      follows?.forEach(follow => {
        activities.push({
          id: `follow_${follow.id}`,
          type: 'follow',
          description: `New follower: ${follow.follower?.display_name || follow.follower?.name || 'Unknown User'}`,
          timestamp: new Date(follow.created_at),
          user: follow.follower?.display_name || follow.follower?.name || 'Unknown User',
        });
      });

      // Get recent events
      const { data: events } = await supabase
        .from('events')
        .select('*')
        .eq('creator_id', userId)
        .order('created_at', { ascending: false })
        .limit(3);

      events?.forEach(event => {
        activities.push({
          id: `event_${event.id}`,
          type: 'event',
          description: `Event created: ${event.title}`,
          timestamp: new Date(event.created_at),
        });
      });

      // Get recent messages
      const { data: messages } = await supabase
        .from('messages')
        .select(
          `
          *,
          conversation:conversations!messages_conversation_id_fkey(*)
        `
        )
        .eq('sender_id', userId)
        .order('created_at', { ascending: false })
        .limit(3);

      messages?.forEach(message => {
        activities.push({
          id: `message_${message.id}`,
          type: 'message',
          description: `Message sent`,
          timestamp: new Date(message.created_at),
        });
      });

      // Sort by timestamp and limit
      return activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }
  }

  static async getTimeSeriesData(userId: string, days: number = 30): Promise<TimeSeriesData[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    try {
      const dateRange = [];
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        dateRange.push(new Date(d).toISOString().split('T')[0]);
      }

      const timeSeriesData: TimeSeriesData[] = [];

      for (const date of dateRange) {
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const [orders, events, follows] = await Promise.all([
          supabase
            .from('orders')
            .select(
              `
              *,
              store:stores!orders_store_id_fkey(owner_id)
            `
            )
            .eq('stores.owner_id', userId)
            .gte('created_at', date)
            .lt('created_at', nextDate.toISOString().split('T')[0]),

          supabase
            .from('events')
            .select('*')
            .eq('creator_id', userId)
            .gte('created_at', date)
            .lt('created_at', nextDate.toISOString().split('T')[0]),

          supabase
            .from('follows')
            .select('*')
            .eq('following_id', userId)
            .gte('created_at', date)
            .lt('created_at', nextDate.toISOString().split('T')[0]),
        ]);

        timeSeriesData.push({
          date,
          revenue: orders.data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0,
          events: events.data?.length || 0,
          followers: follows.data?.length || 0,
          orders: orders.data?.length || 0,
        });
      }

      return timeSeriesData;
    } catch (error) {
      console.error('Error fetching time series data:', error);
      return [];
    }
  }
}

export default DashboardAnalyticsService;
