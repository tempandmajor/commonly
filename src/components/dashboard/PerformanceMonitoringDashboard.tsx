import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Clock, AlertTriangle, CheckCircle, TrendingUp, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PerformanceMetrics {
  totalEvents: number;
  activeEvents: number;
  totalTicketsSold: number;
  totalRevenue: number;
  averageEventCapacity: number;
  upcomingEvents: number;
  completedEvents: number;
  cancelledEvents: number;
}

export const PerformanceMonitoringDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    totalEvents: 0,
    activeEvents: 0,
    totalTicketsSold: 0,
    totalRevenue: 0,
    averageEventCapacity: 0,
    upcomingEvents: 0,
    completedEvents: 0,
    cancelledEvents: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerformanceMetrics();
  }, []);

  const fetchPerformanceMetrics = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch user's events
      const { data: events } = await supabase.from('events').select('*').eq('creator_id', user.id);

      // Fetch tickets for user's events
      const eventIds = (events as any[])?.map((e: any) => e.id) || [];
      const { data: tickets } =
        eventIds.length > 0
          ? await supabase.from('tickets').select('*').in('event_id', eventIds)
          : { data: [] };

      // Calculate metrics
      const now = new Date();
      const totalEvents = events?.length || 0;
      const activeEvents = (events as any[])?.filter((e: any) => e.status === 'active').length || 0;
      const upcomingEvents = (events as any[])?.filter((e: any) => new Date(e.start_date || '') > now).length || 0;
      const completedEvents = (events as any[])?.filter((e: any) => new Date(e.end_date || '') < now).length || 0;
      const cancelledEvents = (events as any[])?.filter((e: any) => e.status === 'cancelled').length || 0;

      const totalTicketsSold = tickets?.length || 0;
      const totalRevenue = (tickets as any[])?.reduce((sum: number, ticket: any) => sum + Number(ticket.price) as number, 0) || 0;
      const averageEventCapacity = events?.length
        ? (events as any[]).reduce((sum: number, event: any) => sum + (event.max_capacity || 0), 0) / events.length
        : 0;

      setMetrics({
        totalEvents,
        activeEvents,
        totalTicketsSold,
        totalRevenue,
        averageEventCapacity,
        upcomingEvents,
        completedEvents,
        cancelledEvents,
      });
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardContent className='p-6'>
              <div className='animate-pulse'>
                <div className='h-4 bg-gray-200 rounded mb-2'></div>
                <div className='h-8 bg-gray-200 rounded'></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Events</CardTitle>
            <Activity className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{metrics.totalEvents}</div>
            <p className='text-xs text-muted-foreground'>All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Active Events</CardTitle>
            <CheckCircle className='h-4 w-4 text-green-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{metrics.activeEvents}</div>
            <p className='text-xs text-muted-foreground'>Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Tickets Sold</CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{metrics.totalTicketsSold}</div>
            <p className='text-xs text-muted-foreground'>Total sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Revenue</CardTitle>
            <TrendingUp className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>${metrics.totalRevenue.toFixed(2)}</div>
            <p className='text-xs text-muted-foreground'>Total earned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Upcoming Events</CardTitle>
            <Clock className='h-4 w-4 text-blue-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{metrics.upcomingEvents}</div>
            <p className='text-xs text-muted-foreground'>Scheduled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Completed Events</CardTitle>
            <CheckCircle className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{metrics.completedEvents}</div>
            <p className='text-xs text-muted-foreground'>Finished</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Cancelled Events</CardTitle>
            <AlertTriangle className='h-4 w-4 text-red-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{metrics.cancelledEvents}</div>
            <p className='text-xs text-muted-foreground'>Cancelled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Avg Capacity</CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{Math.round(metrics.averageEventCapacity)}</div>
            <p className='text-xs text-muted-foreground'>Per event</p>
          </CardContent>
        </Card>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <Card>
          <CardHeader>
            <CardTitle>Event Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              <div className='flex justify-between items-center'>
                <span className='text-sm'>Active</span>
                <span className='text-sm font-medium'>{metrics.activeEvents}</span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-sm'>Upcoming</span>
                <span className='text-sm font-medium'>{metrics.upcomingEvents}</span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-sm'>Completed</span>
                <span className='text-sm font-medium'>{metrics.completedEvents}</span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-sm'>Cancelled</span>
                <span className='text-sm font-medium'>{metrics.cancelledEvents}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              <div className='flex justify-between items-center'>
                <span className='text-sm'>Revenue per Event</span>
                <span className='text-sm font-medium'>
                  $
                  {metrics.totalEvents > 0
                    ? (metrics.totalRevenue / metrics.totalEvents).toFixed(2)
                    : '0.00'}
                </span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-sm'>Tickets per Event</span>
                <span className='text-sm font-medium'>
                  {metrics.totalEvents > 0
                    ? (metrics.totalTicketsSold / metrics.totalEvents).toFixed(1)
                    : '0'}
                </span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-sm'>Success Rate</span>
                <span className='text-sm font-medium'>
                  {metrics.totalEvents > 0
                    ? (
                        ((metrics.totalEvents - metrics.cancelledEvents) / metrics.totalEvents) *
                        100
                      ).toFixed(1)
                    : '0'}
                  %
                </span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-sm'>Average Ticket Price</span>
                <span className='text-sm font-medium'>
                  $
                  {metrics.totalTicketsSold > 0
                    ? (metrics.totalRevenue / metrics.totalTicketsSold).toFixed(2)
                    : '0.00'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
