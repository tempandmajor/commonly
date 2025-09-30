import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  ShoppingBag,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface DashboardStatsData {
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
}

interface DashboardStatsProps {
  stats: DashboardStatsData;
  loading?: boolean | undefined;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats, loading = false }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getChangeIcon = (change: number) => {
    return change > 0 ? (
      <ArrowUpRight className='w-4 h-4 text-green-600' />
    ) : (
      <ArrowDownRight className='w-4 h-4 text-red-600' />
    );
  };

  const getChangeColor = (change: number) => {
    return change > 0 ? 'text-green-600' : 'text-red-600';
  };

  if (loading) {
    return (
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className='animate-pulse'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <div className='h-4 bg-gray-200 rounded w-24'></div>
              <div className='h-4 w-4 bg-gray-200 rounded'></div>
            </CardHeader>
            <CardContent>
              <div className='h-8 bg-gray-200 rounded w-16 mb-2'></div>
              <div className='h-4 bg-gray-200 rounded w-20'></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      change: stats.revenueChange,
      icon: DollarSign,
      color: 'text-green-600',
    },
    {
      title: 'Followers',
      value: stats.totalFollowers.toLocaleString(),
      change: stats.followersChange,
      icon: Users,
      color: 'text-blue-600',
    },
    {
      title: 'Events',
      value: stats.totalEvents.toString(),
      change: stats.eventsChange,
      icon: Calendar,
      color: 'text-purple-600',
    },
    {
      title: 'Products',
      value: stats.totalProducts.toString(),
      change: stats.productsChange,
      icon: ShoppingBag,
      color: 'text-orange-600',
    },
    {
      title: 'Engagement Rate',
      value: `${stats.engagementRate.toFixed(1)}%`,
      change: stats.engagementChange,
      icon: TrendingUp,
      color: 'text-indigo-600',
    },
    {
      title: 'Conversion Rate',
      value: `${stats.conversionRate.toFixed(1)}%`,
      change: stats.conversionChange,
      icon: TrendingDown,
      color: 'text-pink-600',
    },
  ];

  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
      {statCards.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card key={index} className='hover:shadow-md transition-shadow'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium text-gray-600'>{stat.title}</CardTitle>
              <IconComponent className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-[#2B2B2B]'>{stat.value}</div>
              <div className='flex items-center space-x-1 text-xs'>
                {getChangeIcon(stat.change)}
                <span className={getChangeColor(stat.change)}>{formatPercentage(stat.change)}</span>
                <span className='text-gray-500'>from last period</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default DashboardStats;
