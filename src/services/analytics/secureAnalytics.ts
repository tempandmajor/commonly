import { supabase } from '@/integrations/supabase/client';

/**
 * Secure Analytics Service
 * Uses the secure database functions created in the security migration
 */

export interface DailyAnalytics {
  date: string;
  total_users: number;
  total_events: number;
  total_revenue: number;
  active_events: number;
}

export interface UserAnalytics {
  total_events: number;
  total_attendees: number;
  total_revenue: number;
  events_this_month: number;
}

export interface EventAnalytics {
  total_registrations: number;
  total_revenue: number;
  average_rating: number;
  completion_rate: number;
}

export interface AnalyticsReport {
  report_date: string;
  total_users: number;
  total_events: number;
  total_revenue: number;
  active_users: number;
  conversion_rate: number;
}

export interface DashboardAnalytics {
  date: string;
  new_users: number;
  new_events: number;
  daily_revenue: number;
  new_registrations: number;
}

/**
 * Get daily analytics for a specific date
 */
export const getDailyAnalytics = async (
  date: Date = new Date()
): Promise<DailyAnalytics | null> => {
  try {
    const { data, error } = await supabase.rpc('aggregate_daily_analytics', {
      p_date: date.toISOString().split('T')[0],
    });

    if (error) {
      console.error('Error fetching daily analytics:', error);
      return null;
    }

    return data?.[0] || null;
  } catch (error) {
    console.error('Error in getDailyAnalytics:', error);
    return null;
  }
};

/**
 * Get analytics for a specific user
 */
export const getUserAnalytics = async (userId: string): Promise<UserAnalytics | null> => {
  try {
    const { data, error } = await supabase.rpc('get_user_analytics', {
      p_user_id: userId,
    });

    if (error) {
      console.error('Error fetching user analytics:', error);
      return null;
    }

    return data?.[0] || null;
  } catch (error) {
    console.error('Error in getUserAnalytics:', error);
    return null;
  }
};

/**
 * Get analytics for a specific event
 */
export const getEventAnalytics = async (eventId: string): Promise<EventAnalytics | null> => {
  try {
    const { data, error } = await supabase.rpc('get_event_analytics', {
      p_event_id: eventId,
    });

    if (error) {
      console.error('Error fetching event analytics:', error);
      return null;
    }

    return data?.[0] || null;
  } catch (error) {
    console.error('Error in getEventAnalytics:', error);
    return null;
  }
};

/**
 * Generate analytics report for a date range
 */
export const generateAnalyticsReport = async (
  startDate: Date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  endDate: Date = new Date()
): Promise<AnalyticsReport | null> => {
  try {
    const { data, error } = await supabase.rpc('generate_analytics_report', {
      p_start_date: startDate.toISOString().split('T')[0],
      p_end_date: endDate.toISOString().split('T')[0],
    });

    if (error) {
      console.error('Error generating analytics report:', error);
      return null;
    }

    return data?.[0] || null;
  } catch (error) {
    console.error('Error in generateAnalyticsReport:', error);
    return null;
  }
};

/**
 * Get dashboard analytics for the last 30 days
 */
export const getDashboardAnalytics = async (): Promise<DashboardAnalytics[]> => {
  try {
    const { data, error } = await supabase
      .from('analytics_dashboard')
      .select('*')
      .order('date', { ascending: false })
      .limit(30);

    if (error) {
      console.error('Error fetching dashboard analytics:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getDashboardAnalytics:', error);
    return [];
  }
};

/**
 * Trigger daily analytics update (should be called by cron job)
 */
export const triggerDailyAnalyticsUpdate = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.rpc('update_daily_analytics');

    if (error) {
      console.error('Error triggering daily analytics update:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in triggerDailyAnalyticsUpdate:', error);
    return false;
  }
};

/**
 * Clean up old analytics data (should be called periodically)
 */
export const cleanupOldAnalytics = async (daysToKeep: number = 90): Promise<number> => {
  try {
    const { data, error } = await supabase.rpc('cleanup_old_analytics', {
      p_days_to_keep: daysToKeep,
    });

    if (error) {
      console.error('Error cleaning up old analytics:', error);
      return 0;
    }

    return data || 0;
  } catch (error) {
    console.error('Error in cleanupOldAnalytics:', error);
    return 0;
  }
};

/**
 * Get analytics summary for admin dashboard
 */
export const getAnalyticsSummary = async (): Promise<{
  totalUsers: number;
  totalEvents: number;
  totalRevenue: number;
  activeUsers: number;
  conversionRate: number;
} | null> => {
  try {
    const report = await generateAnalyticsReport();

    if (!report) {
      return null;
    }

    return {
      totalUsers: report.total_users,
      totalEvents: report.total_events,
      totalRevenue: report.total_revenue,
      activeUsers: report.active_users,
      conversionRate: report.conversion_rate,
    };
  } catch (error) {
    console.error('Error in getAnalyticsSummary:', error);
    return null;
  }
};

/**
 * Get user analytics for profile page
 */
export const getProfileAnalytics = async (
  userId: string
): Promise<{
  eventsCreated: number;
  totalAttendees: number;
  totalRevenue: number;
  eventsThisMonth: number;
  averageRating: number;
} | null> => {
  try {
    const analytics = await getUserAnalytics(userId);

    if (!analytics) {
      return null;
    }

    return {
      eventsCreated: analytics.total_events,
      totalAttendees: analytics.total_attendees,
      totalRevenue: analytics.total_revenue,
      eventsThisMonth: analytics.events_this_month,
      averageRating: 0, // This would need to be calculated separately
    };
  } catch (error) {
    console.error('Error in getProfileAnalytics:', error);
    return null;
  }
};

/**
 * Get event analytics for event details page
 */
export const getEventDetailsAnalytics = async (
  eventId: string
): Promise<{
  registrations: number;
  revenue: number;
  averageRating: number;
  completionRate: number;
} | null> => {
  try {
    const analytics = await getEventAnalytics(eventId);

    if (!analytics) {
      return null;
    }

    return {
      registrations: analytics.total_registrations,
      revenue: analytics.total_revenue,
      averageRating: analytics.average_rating,
      completionRate: analytics.completion_rate,
    };
  } catch (error) {
    console.error('Error in getEventDetailsAnalytics:', error);
    return null;
  }
};

/**
 * Analytics service with error handling and logging
 */
export class SecureAnalyticsService {
  /**
   * Get comprehensive analytics for admin dashboard
   */
  static async getAdminDashboardData() {
    try {
      const [summary, dashboard] = await Promise.all([
        getAnalyticsSummary(),
        getDashboardAnalytics(),
      ]);

      return {
        summary,
        dashboard,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error getting admin dashboard data:', error);
      return {
        summary: null,
        dashboard: [],
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  /**
   * Get user-specific analytics for profile pages
   */
  static async getUserProfileData(userId: string) {
    try {
      const analytics = await getProfileAnalytics(userId);

      return {
        analytics,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error getting user profile data:', error);
      return {
        analytics: null,
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  /**
   * Get event-specific analytics for event pages
   */
  static async getEventPageData(eventId: string) {
    try {
      const analytics = await getEventDetailsAnalytics(eventId);

      return {
        analytics,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error getting event page data:', error);
      return {
        analytics: null,
        lastUpdated: new Date().toISOString(),
      };
    }
  }
}
