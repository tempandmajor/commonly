import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DashboardStats {
  totalUsers: number;
  newUsersToday: number;
  activeEvents: number;
  totalEvents: number;
  venuesListed: number;
  totalRevenue: number;
  caterers: number;
  conversionRate: number;
}

export interface RecentActivity {
  id: string;
  type: 'user' | 'event' | 'venue' | 'payment' | 'report';
  action: string;
  user: string;
  time: string;
  timestamp: Date;
}

export interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  count: number;
}

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      // Fetch dashboard metrics from management_dashboard table
      const { data: metricsData, error: metricsError } = await supabase
        .from('management_dashboard')
        .select('*')
        .eq('period', 'daily')
        .eq('date', new Date().toISOString().split('T')[0]);

      if (metricsError) throw metricsError;

      // Transform metrics data into stats object
      const metricsMap = (metricsData || []).reduce((acc, metric) => {
        acc[metric.metric_name] = metric.metric_value;
        return acc;
      }, {} as Record<string, number>);

      // Fetch additional data directly
      const [usersResult, eventsResult, venuesResult, caterersResult] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('events').select('id, start_date', { count: 'exact' }),
        supabase.from('venues').select('id', { count: 'exact', head: true }),
        supabase.from('caterers').select('id', { count: 'exact', head: true }),
      ]);

      const totalUsers = usersResult.count || metricsMap.total_users || 0;
      const totalEvents = eventsResult.count || metricsMap.total_events || 0;
      const activeEvents = eventsResult.data?.filter(e => new Date(e.start_date) >= new Date()).length || metricsMap.active_events || 0;
      const venuesListed = venuesResult.count || 0;
      const caterers = caterersResult.count || 0;

      setStats({
        totalUsers,
        newUsersToday: metricsMap.new_users_today || 0,
        activeEvents,
        totalEvents,
        venuesListed,
        totalRevenue: metricsMap.total_revenue || 0,
        caterers,
        conversionRate: 3.2, // Calculated metric - can be computed from data
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast.error('Failed to load dashboard statistics');
    }
  };

  const fetchActivities = async () => {
    try {
      // Fetch recent security logs and admin actions
      const { data: logsData, error: logsError } = await supabase
        .from('security_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (logsError) throw logsError;

      const activities: RecentActivity[] = (logsData || []).map((log) => {
        const timeAgo = getTimeAgo(new Date(log.created_at));
        return {
          id: log.id,
          type: getActivityType(log.event_type),
          action: log.action,
          user: log.metadata?.email || 'Unknown',
          time: timeAgo,
          timestamp: new Date(log.created_at),
        };
      });

      setActivities(activities);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const fetchAlerts = async () => {
    try {
      const alertsList: Alert[] = [];

      // Check pending venues
      const { count: pendingVenues } = await supabase
        .from('venues')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (pendingVenues && pendingVenues > 0) {
        alertsList.push({
          id: 'pending-venues',
          type: 'warning',
          message: `${pendingVenues} venues pending approval`,
          count: pendingVenues,
        });
      }

      // Check reported events
      const { count: reportedEvents } = await supabase
        .from('reported_events')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (reportedEvents && reportedEvents > 0) {
        alertsList.push({
          id: 'reported-events',
          type: 'error',
          message: `${reportedEvents} reported events need review`,
          count: reportedEvents,
        });
      }

      // Check pending caterers
      const { count: pendingCaterers } = await supabase
        .from('caterers')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (pendingCaterers && pendingCaterers > 0) {
        alertsList.push({
          id: 'pending-caterers',
          type: 'info',
          message: `${pendingCaterers} new caterer applications`,
          count: pendingCaterers,
        });
      }

      setAlerts(alertsList);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchActivities(), fetchAlerts()]);
      setLoading(false);
    };

    loadData();

    // Refresh data every 30 seconds
    const interval = setInterval(loadData, 30000);

    return () => clearInterval(interval);
  }, []);

  return {
    stats,
    activities,
    alerts,
    loading,
    refresh: async () => {
      await Promise.all([fetchStats(), fetchActivities(), fetchAlerts()]);
    },
  };
};

// Helper functions
function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

function getActivityType(eventType: string): 'user' | 'event' | 'venue' | 'payment' | 'report' {
  if (eventType.includes('login') || eventType.includes('user')) return 'user';
  if (eventType.includes('event')) return 'event';
  if (eventType.includes('venue')) return 'venue';
  if (eventType.includes('payment')) return 'payment';
  return 'report';
}