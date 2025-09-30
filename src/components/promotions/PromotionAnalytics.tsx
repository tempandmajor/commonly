import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Target, Users, Gift } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PromotionMetrics {
  totalPromotions: number;
  activePromotions: number;
  totalRedemptions: number;
  totalCreditsIssued: number;
  averageRedemptionRate: number;
  topPerformingPromotion: string;
}

export const PromotionAnalytics: React.FC = () => {
  const [metrics, setMetrics] = useState<PromotionMetrics>({
    totalPromotions: 0,
    activePromotions: 0,
    totalRedemptions: 0,
    totalCreditsIssued: 0,
    averageRedemptionRate: 0,
    topPerformingPromotion: 'None',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPromotionMetrics();
  }, []);

  const fetchPromotionMetrics = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch promotion credits
      const { data: credits } = await supabase
        .from('promotion_credits')
        .select('*')
        .eq('user_id', user.id);

      // Fetch promotion transactions
      const { data: transactions } = await supabase
        .from('promotion_transactions')
        .select('*')
        .eq('user_id', user.id);

      // Calculate metrics
      const totalCreditsIssued =
        credits?.reduce((sum, credit) => sum + Number(credit.amount) as number, 0) || 0;
      const totalRedemptions = transactions?.length || 0;
      const activePromotions = credits?.filter(credit => credit.status === 'active').length || 0;

      setMetrics({
        totalPromotions: credits.length || 0,
        activePromotions,
        totalRedemptions,
        totalCreditsIssued,
        averageRedemptionRate: credits.length ? (totalRedemptions / credits.length) * 100 : 0,
        topPerformingPromotion: credits.length ? credits[0]?.reason || 'None' : 'None',
      });

    } catch (error) {
      console.error('Error fetching promotion metrics:', error);

    } finally {

      setLoading(false);
    }

  };

  if (loading) {
    return (
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {Array.from({ length: 6 }).map((_, i) => (
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

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Promotions</CardTitle>
            <Gift className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{metrics.totalPromotions}</div>
            <p className='text-xs text-muted-foreground'>All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Active Promotions</CardTitle>
            <Target className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{metrics.activePromotions}</div>
            <p className='text-xs text-muted-foreground'>Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Redemptions</CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{metrics.totalRedemptions}</div>
            <p className='text-xs text-muted-foreground'>Times used</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Credits Issued</CardTitle>
            <TrendingUp className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>${metrics.totalCreditsIssued.toFixed(2)}</div>
            <p className='text-xs text-muted-foreground'>Total value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Redemption Rate</CardTitle>
            <Target className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{metrics.averageRedemptionRate.toFixed(1)}%</div>
            <p className='text-xs text-muted-foreground'>Average per promotion</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Top Performer</CardTitle>
            <TrendingUp className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-lg font-bold truncate'>{metrics.topPerformingPromotion}</div>
            <p className='text-xs text-muted-foreground'>Best promotion</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Promotion Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <div className='flex justify-between items-center'>
              <span className='text-sm font-medium'>Average Credit Value</span>
              <span className='text-sm text-muted-foreground'>
                $
                {metrics.totalPromotions > 0
                  ? (metrics.totalCreditsIssued / metrics.totalPromotions).toFixed(2)
                  : '0.00'}
              </span>
            </div>
            <div className='flex justify-between items-center'>
              <span className='text-sm font-medium'>Redemptions per Promotion</span>
              <span className='text-sm text-muted-foreground'>
                {metrics.totalPromotions > 0
                  ? (metrics.totalRedemptions / metrics.totalPromotions).toFixed(1)
                  : '0'}
              </span>
            </div>
            <div className='flex justify-between items-center'>
              <span className='text-sm font-medium'>Active Promotion Rate</span>
              <span className='text-sm text-muted-foreground'>
                {metrics.totalPromotions > 0
                  ? ((metrics.activePromotions / metrics.totalPromotions) * 100).toFixed(1)
                  : '0'}
                %
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>

  );

};

