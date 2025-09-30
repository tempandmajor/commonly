import React, { useState, useEffect, ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  ShoppingBag,
  Calendar,
  BarChart3,
  Activity,
  RefreshCw,
  Download,
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';
import Footer from '@/components/layout/Footer';
import { LoadingSkeleton, LoadingSpinner } from '@/components/ui/loading';
import CreatorEarnings from '@/components/dashboard/CreatorEarnings';
import {
  DashboardAnalyticsService,
  AnalyticsData,
  RecentActivity,
} from '@/services/analytics/dashboardAnalytics';

interface DashboardStats {
  totalRevenue: number;
  revenueChange: number;
  totalFollowers: number;
  followersChange: number;
  totalEvents: number;
  eventsChange: number;
  totalProducts: number;
  productsChange: number;
  engagementRate: number;
  engagementChange: number;
  conversionRate: number;
  conversionChange: number;
  ordersCount: number;
  eventsCount: number;
}

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('7d');

  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    revenueChange: 0,
    totalFollowers: 0,
    followersChange: 0,
    totalEvents: 0,
    eventsChange: 0,
    totalProducts: 0,
    productsChange: 0,
    engagementRate: 0,
    engagementChange: 0,
    conversionRate: 0,
    conversionChange: 0,
    ordersCount: 0,
    eventsCount: 0,
  });

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, dateRange]);

  // Sync tab with URL (?tab=overview|earnings)
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'overview' || tab === 'earnings') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    const next = new URLSearchParams(searchParams);
    next.set('tab', val);
    setSearchParams(next, { replace: false });
  };

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const days =
        dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 365;

      // Use the comprehensive analytics service
      const [analyticsData, recentActivityData] = await Promise.all([
        DashboardAnalyticsService.getUserAnalytics(user.id, days),
        DashboardAnalyticsService.getRecentActivity(user.id, 10),
      ]);

      // Convert AnalyticsData to DashboardStats format
      const realStats: DashboardStats = {
        totalRevenue: analyticsData.totalRevenue,
        revenueChange: analyticsData.revenueChange,
        totalFollowers: analyticsData.totalFollowers,
        followersChange: analyticsData.followersChange,
        totalEvents: analyticsData.totalEvents,
        eventsChange: analyticsData.eventsChange,
        totalProducts: analyticsData.totalProducts,
        productsChange: analyticsData.productsChange,
        engagementRate: analyticsData.engagementRate,
        engagementChange: analyticsData.engagementChange,
        conversionRate: analyticsData.conversionRate,
        conversionChange: analyticsData.conversionChange,
        ordersCount: analyticsData.ordersCount,
        eventsCount: analyticsData.eventsCount,
      };

      setStats(realStats);
      setRecentActivity(recentActivityData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    toast.success('Dashboard refreshed');
  };

  const handleExportData = async () => {
    try {
      const csvData = [
        ['Metric', 'Value', 'Change'],
        [
          'Total Revenue',
          `$${stats.totalRevenue.toFixed(2)}`,
          `${stats.revenueChange.toFixed(1)}%`,
        ],
        [
          'Total Followers',
          stats.totalFollowers.toString(),
          `${stats.followersChange.toFixed(1)}%`,
        ],
        ['Total Events', stats.totalEvents.toString(), `${stats.eventsChange.toFixed(1)}%`],
        ['Total Products', stats.totalProducts.toString(), `${stats.productsChange.toFixed(1)}%`],
        [
          'Engagement Rate',
          `${stats.engagementRate.toFixed(1)}%`,
          `${stats.engagementChange.toFixed(1)}%`,
        ],
        [
          'Conversion Rate',
          `${stats.conversionRate.toFixed(1)}%`,
          `${stats.conversionChange.toFixed(1)}%`,
        ],
      ];

      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard-data-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('Dashboard data exported successfully');
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getTrendIcon = (change: number) => {
    return change > 0 ? (
      <TrendingUp className='w-4 h-4 text-primary' />
    ) : (
      <TrendingDown className='w-4 h-4 text-muted-foreground' />
    );
  };

  const getTrendColor = (change: number) => {
    return change > 0 ? 'text-primary' : 'text-muted-foreground';
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'sale':
        return <DollarSign className='w-4 h-4 text-primary' />;
      case 'event':
        return <Calendar className='w-4 h-4 text-primary' />;
      case 'follow':
        return <Users className='w-4 h-4 text-primary' />;
      case 'message':
        return <Activity className='w-4 h-4 text-gray-600' />;
      default:
        return <Activity className='w-4 h-4 text-gray-600' />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else {
      return `${hours}h ago`;
    }
  };

  if (!isAuthenticated) {
    return (
      <>
        <main className='flex-1 container mx-auto px-4 py-8'>
          <div className='text-center'>
            <h1 className='text-2xl font-bold text-[#2B2B2B] mb-4'>
              Please sign in to view your dashboard
            </h1>
          </div>
        </main>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <main className='flex-1 container mx-auto px-4 py-8'>
          <div className='space-y-6'>
            {/* Stats cards skeleton */}
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <LoadingSkeleton skeletonType='card' />
                </div>
              ))}
            </div>

            {/* Chart area skeleton */}
            <LoadingSkeleton skeletonType='card' />

            {/* Table skeleton */}
            <LoadingSkeleton skeletonType='list' skeletonCount={6} />
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <main className='flex-1 container mx-auto px-4 py-8'>
        {/* Header */}
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8'>
          <div>
            <h1 className='text-3xl font-bold flex items-center gap-2 text-[#2B2B2B]'>
              <BarChart3 className='w-8 h-8' />
              Dashboard
            </h1>
            <p className='text-gray-600 mt-2'>
              Welcome back,{' '}
              {(() => {
                const fullName = user?.user_metadata?.full_name || user?.user_metadata?.name;
                if (typeof fullName === 'string') {
                  return fullName.split(' ')[0];
                }
                return 'Creator';
              })()}
              ! Here's your performance overview.
            </p>
          </div>

          <div className='flex items-center gap-3 mt-4 sm:mt-0'>
            <select
              value={dateRange}
              onChange={e => setDateRange((e.target as HTMLInputElement).value)}
              className='border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-[#2B2B2B]'
            >
              <option value='7d'>Last 7 days</option>
              <option value='30d'>Last 30 days</option>
              <option value='90d'>Last 90 days</option>
              <option value='1y'>Last year</option>
            </select>

            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant='outline'
              size='sm'
              className='border-gray-300 text-gray-700 hover:bg-gray-50'
            >
              {refreshing ? (
                <LoadingSpinner size='small' className='mr-2' />
              ) : (
                <RefreshCw className='w-4 h-4 mr-2' />
              )}
              Refresh
            </Button>

            <Button
              onClick={handleExportData}
              variant='outline'
              size='sm'
              className='border-gray-300 text-gray-700 hover:bg-gray-50'
            >
              <Download className='w-4 h-4 mr-2' />
              Export
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className='space-y-6'>
          <TabsList className='grid w-full grid-cols-2 bg-gray-100'>
            <TabsTrigger value='overview' className='data-[state=active]:bg-white'>
              Overview
            </TabsTrigger>
            <TabsTrigger value='earnings' className='data-[state=active]:bg-white'>
              Earnings
            </TabsTrigger>
          </TabsList>

          <TabsContent value='overview' className='space-y-6'>
            {/* Stats Cards */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
              <Card className='border border-gray-200'>
                <CardContent className='p-6'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm font-medium text-gray-600'>Total Revenue</p>
                      <p className='text-2xl font-bold text-[#2B2B2B]'>
                        {formatCurrency(stats.totalRevenue)}
                      </p>
                    </div>
                    <div className='w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center'>
                      <DollarSign className='w-6 h-6 text-gray-600' />
                    </div>
                  </div>
                  <div className='flex items-center mt-4'>
                    {getTrendIcon(stats.revenueChange)}
                    <span className={`text-sm ml-1 ${getTrendColor(stats.revenueChange)}`}>
                      {formatPercentage(stats.revenueChange)} from last period
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className='border border-gray-200'>
                <CardContent className='p-6'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm font-medium text-gray-600'>Followers</p>
                      <p className='text-2xl font-bold text-[#2B2B2B]'>
                        {stats.totalFollowers.toLocaleString()}
                      </p>
                    </div>
                    <div className='w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center'>
                      <Users className='w-6 h-6 text-gray-600' />
                    </div>
                  </div>
                  <div className='flex items-center mt-4'>
                    {getTrendIcon(stats.followersChange)}
                    <span className={`text-sm ml-1 ${getTrendColor(stats.followersChange)}`}>
                      {formatPercentage(stats.followersChange)} from last period
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className='border border-gray-200'>
                <CardContent className='p-6'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm font-medium text-gray-600'>Events</p>
                      <p className='text-2xl font-bold text-[#2B2B2B]'>{stats.totalEvents}</p>
                    </div>
                    <div className='w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center'>
                      <Calendar className='w-6 h-6 text-gray-600' />
                    </div>
                  </div>
                  <div className='flex items-center mt-4'>
                    {getTrendIcon(stats.eventsChange)}
                    <span className={`text-sm ml-1 ${getTrendColor(stats.eventsChange)}`}>
                      {formatPercentage(stats.eventsChange)} from last period
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className='border border-gray-200'>
                <CardContent className='p-6'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm font-medium text-gray-600'>Products</p>
                      <p className='text-2xl font-bold text-[#2B2B2B]'>{stats.totalProducts}</p>
                    </div>
                    <div className='w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center'>
                      <ShoppingBag className='w-6 h-6 text-gray-600' />
                    </div>
                  </div>
                  <div className='flex items-center mt-4'>
                    {getTrendIcon(stats.productsChange)}
                    <span className={`text-sm ml-1 ${getTrendColor(stats.productsChange)}`}>
                      {formatPercentage(stats.productsChange)} from last period
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts and Activity */}
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
              {/* Revenue Chart */}
              <Card className='lg:col-span-2 border border-gray-200'>
                <CardHeader>
                  <CardTitle className='text-[#2B2B2B]'>Revenue Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='h-64 flex flex-col'>
                    <div className='flex-1 flex items-center justify-center'>
                      <div className='text-center space-y-4'>
                        <div className='flex items-center justify-center space-x-4'>
                          <div className='text-center'>
                            <div className='text-3xl font-bold text-primary'>
                              ${stats.totalRevenue.toFixed(2)}
                            </div>
                            <p className='text-sm text-gray-600'>Total Revenue</p>
                          </div>
                          <div className='text-center'>
                            <div className='text-2xl font-bold text-primary'>
                              {stats.ordersCount}
                            </div>
                            <p className='text-sm text-gray-600'>Orders</p>
                          </div>
                          <div className='text-center'>
                            <div className='text-2xl font-bold text-primary'>
                              {stats.eventsCount}
                            </div>
                            <p className='text-sm text-gray-600'>Events</p>
                          </div>
                        </div>
                        {stats.revenueChange !== 0 && (
                          <div className='text-sm text-gray-500'>
                            {stats.revenueChange > 0 ? '+' : ''}
                            {stats.revenueChange.toFixed(1)}% from last period
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className='border border-gray-200'>
                <CardHeader>
                  <CardTitle className='text-[#2B2B2B]'>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    {recentActivity.length > 0 ? (
                      recentActivity.map(activity => (
                        <div key={activity.id} className='flex items-center gap-3'>
                          <div className='w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0'>
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className='flex-1 min-w-0'>
                            <p className='text-sm font-medium text-[#2B2B2B] truncate'>
                              {activity.description}
                            </p>
                            <p className='text-xs text-gray-500'>
                              {formatTimeAgo(activity.timestamp)}
                            </p>
                          </div>
                          {activity.amount && (
                            <span className='text-sm font-medium text-gray-800'>
                              +{formatCurrency(activity.amount)}
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className='text-center py-8'>
                        <Activity className='w-12 h-12 text-gray-300 mx-auto mb-2' />
                        <p className='text-gray-600'>No recent activity</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Metrics */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <Card className='border border-gray-200'>
                <CardHeader>
                  <CardTitle className='text-[#2B2B2B]'>Engagement Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    <div>
                      <div className='flex items-center justify-between mb-2'>
                        <span className='text-2xl font-bold text-[#2B2B2B]'>
                          {stats.engagementRate.toFixed(1)}%
                        </span>
                        <div className='flex items-center'>
                          {getTrendIcon(stats.engagementChange)}
                          <span className={`text-sm ml-1 ${getTrendColor(stats.engagementChange)}`}>
                            {formatPercentage(stats.engagementChange)}
                          </span>
                        </div>
                      </div>
                      <Progress value={stats.engagementRate} className='w-full h-2' />
                    </div>
                    <p className='text-sm text-gray-600'>
                      Your content engagement compared to last period
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className='border border-gray-200'>
                <CardHeader>
                  <CardTitle className='text-[#2B2B2B]'>Conversion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    <div>
                      <div className='flex items-center justify-between mb-2'>
                        <span className='text-2xl font-bold text-[#2B2B2B]'>
                          {stats.conversionRate.toFixed(1)}%
                        </span>
                        <div className='flex items-center'>
                          {getTrendIcon(stats.conversionChange)}
                          <span className={`text-sm ml-1 ${getTrendColor(stats.conversionChange)}`}>
                            {formatPercentage(stats.conversionChange)}
                          </span>
                        </div>
                      </div>
                      <Progress value={stats.conversionRate} className='w-full h-2' />
                    </div>
                    <p className='text-sm text-gray-600'>Visitors who become customers</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value='earnings' className='space-y-6'>
            <CreatorEarnings />
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </>
  );
};

export default Dashboard;
