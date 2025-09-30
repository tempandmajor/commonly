import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users, DollarSign } from 'lucide-react';

interface AnalyticsData {
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  ctr: number;
  conversionRate: number;
}

export const AdvertisingAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    impressions: 0,
    clicks: 0,
    conversions: 0,
    revenue: 0,
    ctr: 0,
    conversionRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Mock analytics data for demonstration
      setAnalytics({
        impressions: 12450,
        clicks: 1567,
        conversions: 234,
        revenue: 4789.5,
        ctr: 12.6,
        conversionRate: 14.9,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        {Array.from({ length: 4 }).map((_, i) => (
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
            <CardTitle className='text-sm font-medium'>Impressions</CardTitle>
            <BarChart3 className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{analytics.impressions.toLocaleString()}</div>
            <p className='text-xs text-muted-foreground'>Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Clicks</CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{analytics.clicks.toLocaleString()}</div>
            <p className='text-xs text-muted-foreground'>CTR: {analytics.ctr.toFixed(2)}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Conversions</CardTitle>
            <TrendingUp className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{analytics.conversions.toLocaleString()}</div>
            <p className='text-xs text-muted-foreground'>
              Rate: {analytics.conversionRate.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Revenue</CardTitle>
            <DollarSign className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>${analytics.revenue.toFixed(2)}</div>
            <p className='text-xs text-muted-foreground'>Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <div className='flex justify-between items-center'>
              <span className='text-sm font-medium'>Click-through Rate</span>
              <span className='text-sm text-muted-foreground'>{analytics.ctr.toFixed(2)}%</span>
            </div>
            <div className='flex justify-between items-center'>
              <span className='text-sm font-medium'>Conversion Rate</span>
              <span className='text-sm text-muted-foreground'>
                {analytics.conversionRate.toFixed(2)}%
              </span>
            </div>
            <div className='flex justify-between items-center'>
              <span className='text-sm font-medium'>Revenue per Click</span>
              <span className='text-sm text-muted-foreground'>
                ${analytics.clicks > 0 ? (analytics.revenue / analytics.clicks).toFixed(2) : '0.00'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
