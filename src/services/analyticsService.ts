/**
 * Analytics service - Real implementation with database queries
 */
import { supabase } from '@/integrations/supabase/client';

// Types for analytics data
export interface AnalyticsMetric {
  label: string;
  value: number;
  change?: number | undefined; // percentage change from previous period
  changeType?: 'increase' | undefined| 'decrease' | 'neutral';
}

export interface EventAnalytics {
  totalEvents: AnalyticsMetric;
  activeEvents: AnalyticsMetric;
  totalAttendees: AnalyticsMetric;
  revenue: AnalyticsMetric;
  topCategories: { category: string; count: number }[];
}

export interface UserAnalytics {
  totalUsers: AnalyticsMetric;
  activeUsers: AnalyticsMetric;
  newUsersThisMonth: AnalyticsMetric;
  userRetention: AnalyticsMetric;
}

export interface RevenueAnalytics {
  totalRevenue: AnalyticsMetric;
  monthlyRevenue: AnalyticsMetric;
  transactionVolume: AnalyticsMetric;
  averageTransactionSize: AnalyticsMetric;
}

// Basic tracking functions
export const initializeAnalytics = (trackingId: string) => {
  console.debug('Analytics initialized with tracking ID:', trackingId);
  // TODO: Initialize actual analytics provider when configured
};

export const trackPageView = (pathname: string) => {
  console.debug('Page view tracked:', pathname);
  // TODO: Send to analytics provider when configured
};

export const trackProfileView = (userId: string) => {
  console.debug('Profile view tracked for user:', userId);
  // TODO: Send to analytics provider when configured
};

export const trackEvent = (category: string, action: string, label?: string, value?: number) => {
  console.debug('Event tracked:', { category, action, label, value });
  // TODO: Send to analytics provider when configured
};

export const trackUserAction = (action: string, properties?: Record<string, unknown>) => {
  console.debug('User action tracked:', { action, properties });
  // TODO: Send to analytics provider when configured
};

export const trackConversion = (eventName: string, value?: number) => {
  console.debug('Conversion tracked:', { eventName, value });
  // TODO: Send to analytics provider when configured
};

// Real analytics data functions
export const getEventAnalytics = async (dateRange?: {
  start: Date;
  end: Date;
}): Promise<EventAnalytics> => {
  try {
    const startDate =
      dateRange?.start?.toISOString() ||
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = dateRange?.end?.toISOString() || new Date().toISOString();

    // Get total events
    const { count: totalEventsCount } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true });

    // Get active events (events happening now or in the future)
    const { count: activeEventsCount } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .gte('event_date', new Date().toISOString());

    // Get total attendees (sum of all event registrations)
    const { data: attendeeData } = await supabase.from('event_registrations').select('id');
    const totalAttendees = attendeeData?.length || 0;

    // Get revenue from transactions
    const { data: revenueData } = await supabase
      .from('wallet_transactions')
      .select('amount_cents')
      .eq('type', 'credit')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    const revenue = revenueData?.reduce((sum, tx) => sum + tx.amount_cents, 0) / 100 || 0;

    // Get top categories
    const { data: categoryData } = await supabase
      .from('events')
      .select('category')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    const categoryCounts =
      categoryData?.reduce(
        (acc, event) => {
          const category = event.category || 'Uncategorized';
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ) || {};

    const topCategories = Object.entries(categoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalEvents: { label: 'Total Events', value: totalEventsCount || 0 },
      activeEvents: { label: 'Active Events', value: activeEventsCount || 0 },
      totalAttendees: { label: 'Total Attendees', value: totalAttendees },
      revenue: { label: 'Revenue', value: revenue },
      topCategories,
    };
  } catch (error) {
    console.error('Error fetching event analytics:', error);
    return {
      totalEvents: { label: 'Total Events', value: 0 },
      activeEvents: { label: 'Active Events', value: 0 },
      totalAttendees: { label: 'Total Attendees', value: 0 },
      revenue: { label: 'Revenue', value: 0 },
      topCategories: [],
    };
  }
};

export const getUserAnalytics = async (dateRange?: {
  start: Date;
  end: Date;
}): Promise<UserAnalytics> => {
  try {
    const startDate =
      dateRange?.start?.toISOString() ||
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = dateRange?.end?.toISOString() || new Date().toISOString();

    // Get total users
    const { count: totalUsersCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Get active users (users who have created events or made transactions recently)
    const { data: activeUserData } = await supabase
      .from('events')
      .select('creator_id')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    const activeUserIds = new Set(activeUserData?.map(e => e.creator_id) || []);

    // Get new users this month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const { count: newUsersCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', monthStart.toISOString());

    return {
      totalUsers: { label: 'Total Users', value: totalUsersCount || 0 },
      activeUsers: { label: 'Active Users', value: activeUserIds.size },
      newUsersThisMonth: { label: 'New Users This Month', value: newUsersCount || 0 },
      userRetention: { label: 'User Retention', value: 0 }, // TODO: Calculate retention rate
    };
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    return {
      totalUsers: { label: 'Total Users', value: 0 },
      activeUsers: { label: 'Active Users', value: 0 },
      newUsersThisMonth: { label: 'New Users This Month', value: 0 },
      userRetention: { label: 'User Retention', value: 0 },
    };
  }
};

export const getRevenueAnalytics = async (dateRange?: {
  start: Date;
  end: Date;
}): Promise<RevenueAnalytics> => {
  try {
    const startDate =
      dateRange?.start?.toISOString() ||
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = dateRange?.end?.toISOString() || new Date().toISOString();

    // Get all revenue transactions
    const { data: revenueData } = await supabase
      .from('wallet_transactions')
      .select('amount_cents, created_at')
      .in('type', ['credit', 'payment'])
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    const totalRevenue = revenueData?.reduce((sum, tx) => sum + tx.amount_cents, 0) / 100 || 0;

    // Get this month's revenue
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const { data: monthlyData } = await supabase
      .from('wallet_transactions')
      .select('amount_cents')
      .in('type', ['credit', 'payment'])
      .gte('created_at', monthStart.toISOString());

    const monthlyRevenue = monthlyData?.reduce((sum, tx) => sum + tx.amount_cents, 0) / 100 || 0;

    const transactionVolume = revenueData?.length || 0;
    const averageTransactionSize = transactionVolume > 0 ? totalRevenue / transactionVolume : 0;

    return {
      totalRevenue: { label: 'Total Revenue', value: totalRevenue },
      monthlyRevenue: { label: 'Monthly Revenue', value: monthlyRevenue },
      transactionVolume: { label: 'Transaction Volume', value: transactionVolume },
      averageTransactionSize: { label: 'Avg Transaction Size', value: averageTransactionSize },
    };
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    return {
      totalRevenue: { label: 'Total Revenue', value: 0 },
      monthlyRevenue: { label: 'Monthly Revenue', value: 0 },
      transactionVolume: { label: 'Transaction Volume', value: 0 },
      averageTransactionSize: { label: 'Avg Transaction Size', value: 0 },
    };
  }
};

// Combined dashboard analytics
export const getDashboardAnalytics = async (dateRange?: { start: Date; end: Date }) => {
  const [eventAnalytics, userAnalytics, revenueAnalytics] = await Promise.all([
    getEventAnalytics(dateRange),
    getUserAnalytics(dateRange),
    getRevenueAnalytics(dateRange),
  ]);

  return {
    events: eventAnalytics,
    users: userAnalytics,
    revenue: revenueAnalytics,
  };
};
