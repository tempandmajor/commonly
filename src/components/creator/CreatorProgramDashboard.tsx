import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Crown,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  Star,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Palette,
  HeadphonesIcon,
  Rocket,
  Calculator,
  ArrowUp,
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { safeSupabaseQuery } from '@/utils/supabaseHelpers';

interface CreatorProgramStatus {
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  application_date: string | null;
  approval_date: string | null;
  monthly_revenue: number | null;
  follower_count: number | null;
  events_hosted: number | null;
  commission_rate: number | null;
  priority_support_enabled: boolean | null;
  analytics_access_enabled: boolean | null;
  custom_branding_enabled: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

interface EligibilityCheck {
  is_eligible: boolean;
  current_stats: {
    total_attendees: number;
    followers_count: number;
    successful_events: number;
  };
  missing_requirements: Array<{
    type: string;
    current: number;
    required: number;
    needed: number;
  }>;
}

interface CreatorEarnings {
  total_earnings: number;
  monthly_earnings: number;
  commission_earned: number;
  events_count: number;
}

const CreatorProgramDashboard: React.FC = () => {
  const { user } = useAuth();
  const [programStatus, setProgramStatus] = useState<CreatorProgramStatus | null>(null);
  const [eligibility, setEligibility] = useState<EligibilityCheck | null>(null);
  const [earnings, setEarnings] = useState<CreatorEarnings | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    }
  }, [user?.id]);

  const loadDashboardData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const { data: status, error: statusError } = await safeSupabaseQuery(
        supabase.from('creator_program').select('*').eq('user_id', user.id).single(),
        null
      );

      if (!statusError && status) {
        setProgramStatus(status);
      }

      if (!status || status.status === 'pending' || status.status === 'rejected') {
        await checkEligibility();
      }

      if (status && status.status === 'approved') {
        await loadEarnings();
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load creator program data');
    } finally {
      setLoading(false);
    }
  };

  const checkEligibility = async () => {
    try {
      const mockEligibility: EligibilityCheck = {
        is_eligible: false,
        current_stats: {
          total_attendees: 150,
          followers_count: 85,
          successful_events: 3,
        },
        missing_requirements: [
          { type: 'followers', current: 85, required: 100, needed: 15 },
          { type: 'events', current: 3, required: 5, needed: 2 },
        ],
      };

      setEligibility(mockEligibility);
    } catch (error) {
      console.error('Error checking eligibility:', error);
    }
  };

  const loadEarnings = async () => {
    try {
      const mockEarnings: CreatorEarnings = {
        total_earnings: 2500,
        monthly_earnings: 450,
        commission_earned: 375,
        events_count: 12,
      };

      setEarnings(mockEarnings);
    } catch (error) {
      console.error('Error loading earnings:', error);
    }
  };

  const applyToProgram = async () => {
    if (!user?.id || !eligibility) return;

    try {
      setApplying(true);

      const applicationData = {
        user_id: user.id,
        status: 'pending' as const,
        application_date: new Date().toISOString(),
        follower_count: eligibility.current_stats.followers_count || 0,
        events_hosted: eligibility.current_stats.successful_events || 0,
        monthly_revenue: 0,
        commission_rate: 0.15,
        priority_support_enabled: false,
        analytics_access_enabled: true,
        custom_branding_enabled: false,
      };

      const { error } = await safeSupabaseQuery(
        supabase.from('creator_program').insert(applicationData),
        null
      );

      if (error) {
        toast.error('Failed to submit application');
        return;
      }

      toast.success('Application submitted successfully!');
      await loadDashboardData();
    } catch (error) {
      console.error('Error applying to program:', error);
      toast.error('Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { variant: 'outline' as const, icon: Clock, color: 'text-yellow-600' },
      approved: { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
      rejected: { variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' },
    };

    const config = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    const IconComponent = config.icon;

    return (
      <Badge variant={config.variant} className='flex items-center gap-1'>
        <IconComponent className='h-3 w-3' />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className='space-y-6'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          {[1, 2, 3].map(i => (
            <Card key={i} className='animate-pulse'>
              <CardContent className='p-6'>
                <div className='h-4 bg-gray-200 rounded w-3/4 mb-2'></div>
                <div className='h-8 bg-gray-200 rounded w-1/2'></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!programStatus && eligibility && !eligibility.is_eligible) {
    return (
      <div className='space-y-6'>
        <Card>
          <CardHeader>
            <div className='flex items-center gap-2'>
              <Crown className='h-6 w-6 text-yellow-500' />
              <CardTitle>Creator Program</CardTitle>
            </div>
            <CardDescription>
              Join our exclusive creator program to earn higher commissions and unlock premium
              features
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            <Alert>
              <ArrowUp className='h-4 w-4' />
              <AlertDescription>
                You're not yet eligible for the Creator Program. Complete the requirements below to
                apply!
              </AlertDescription>
            </Alert>

            <div className='space-y-4'>
              <h3 className='font-semibold'>Requirements Progress</h3>
              {eligibility.missing_requirements.map((req, index) => (
                <div key={index} className='space-y-2'>
                  <div className='flex justify-between text-sm'>
                    <span className='capitalize'>{req.type.replace('_', ' ')}</span>
                    <span>
                      {req.current} / {req.required}
                    </span>
                  </div>
                  <Progress value={(req.current / req.required) * 100} className='h-2' />
                  <p className='text-xs text-gray-600'>
                    Need {req.needed} more {req.type.replace('_', ' ')} to qualify
                  </p>
                </div>
              ))}
            </div>

            <div className='space-y-4'>
              <h3 className='font-semibold'>Current Stats</h3>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <Card>
                  <CardContent className='p-4 text-center'>
                    <Users className='h-8 w-8 mx-auto mb-2 text-blue-500' />
                    <p className='text-2xl font-bold'>
                      {eligibility.current_stats.followers_count}
                    </p>
                    <p className='text-sm text-gray-600'>Followers</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className='p-4 text-center'>
                    <Calendar className='h-8 w-8 mx-auto mb-2 text-green-500' />
                    <p className='text-2xl font-bold'>
                      {eligibility.current_stats.successful_events}
                    </p>
                    <p className='text-sm text-gray-600'>Events</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className='p-4 text-center'>
                    <TrendingUp className='h-8 w-8 mx-auto mb-2 text-purple-500' />
                    <p className='text-2xl font-bold'>
                      {eligibility.current_stats.total_attendees}
                    </p>
                    <p className='text-sm text-gray-600'>Total Attendees</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!programStatus && eligibility.is_eligible) {
    return (
      <div className='space-y-6'>
        <Card>
          <CardHeader>
            <div className='flex items-center gap-2'>
              <Crown className='h-6 w-6 text-yellow-500' />
              <CardTitle>Creator Program - Ready to Apply!</CardTitle>
            </div>
            <CardDescription>
              Congratulations! You meet all requirements for our Creator Program.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            <Alert>
              <CheckCircle className='h-4 w-4' />
              <AlertDescription>
                You're eligible to join the Creator Program! Apply now to unlock exclusive benefits.
              </AlertDescription>
            </Alert>

            <div className='space-y-4'>
              <h3 className='font-semibold'>Program Benefits</h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='flex items-center gap-3'>
                  <DollarSign className='h-5 w-5 text-green-500' />
                  <span>Higher commission rates (up to 15%)</span>
                </div>
                <div className='flex items-center gap-3'>
                  <BarChart3 className='h-5 w-5 text-blue-500' />
                  <span>Advanced analytics dashboard</span>
                </div>
                <div className='flex items-center gap-3'>
                  <Palette className='h-5 w-5 text-purple-500' />
                  <span>Custom branding options</span>
                </div>
                <div className='flex items-center gap-3'>
                  <HeadphonesIcon className='h-5 w-5 text-orange-500' />
                  <span>Priority customer support</span>
                </div>
              </div>
            </div>

            <Button
              onClick={applyToProgram}
              disabled={applying}
              className='w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600'
            >
              {applying ? 'Submitting Application...' : 'Apply to Creator Program'}
              <Rocket className='h-4 w-4 ml-2' />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Crown className='h-6 w-6 text-yellow-500' />
              <CardTitle>Creator Program Dashboard</CardTitle>
            </div>
            {programStatus && getStatusBadge(programStatus.status)}
          </div>
        </CardHeader>
      </Card>

      {programStatus.status === 'approved' && earnings && (
        <Tabs defaultValue='overview' className='space-y-4'>
          <TabsList>
            <TabsTrigger value='overview'>Overview</TabsTrigger>
            <TabsTrigger value='earnings'>Earnings</TabsTrigger>
            <TabsTrigger value='benefits'>Benefits</TabsTrigger>
          </TabsList>

          <TabsContent value='overview' className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
              <Card>
                <CardContent className='p-4'>
                  <div className='flex items-center space-x-2'>
                    <DollarSign className='h-8 w-8 text-green-500' />
                    <div>
                      <p className='text-2xl font-bold'>
                        {formatCurrency(earnings.total_earnings)}
                      </p>
                      <p className='text-sm text-gray-600'>Total Earnings</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className='p-4'>
                  <div className='flex items-center space-x-2'>
                    <TrendingUp className='h-8 w-8 text-blue-500' />
                    <div>
                      <p className='text-2xl font-bold'>
                        {formatCurrency(earnings.monthly_earnings)}
                      </p>
                      <p className='text-sm text-gray-600'>This Month</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className='p-4'>
                  <div className='flex items-center space-x-2'>
                    <Calculator className='h-8 w-8 text-purple-500' />
                    <div>
                      <p className='text-2xl font-bold'>
                        {((programStatus.commission_rate || 0) * 100).toFixed(1)}%
                      </p>
                      <p className='text-sm text-gray-600'>Commission Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className='p-4'>
                  <div className='flex items-center space-x-2'>
                    <Calendar className='h-8 w-8 text-orange-500' />
                    <div>
                      <p className='text-2xl font-bold'>{earnings.events_count}</p>
                      <p className='text-sm text-gray-600'>Events Hosted</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value='earnings' className='space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle>Earnings Breakdown</CardTitle>
                <CardDescription>
                  Your creator program earnings and commission details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='flex justify-between items-center p-4 border rounded-lg'>
                    <div>
                      <p className='font-medium'>Total Commission Earned</p>
                      <p className='text-sm text-gray-600'>From all events</p>
                    </div>
                    <p className='text-2xl font-bold text-green-600'>
                      {formatCurrency(earnings.commission_earned)}
                    </p>
                  </div>
                  <div className='flex justify-between items-center p-4 border rounded-lg'>
                    <div>
                      <p className='font-medium'>Monthly Earnings</p>
                      <p className='text-sm text-gray-600'>Current month</p>
                    </div>
                    <p className='text-2xl font-bold text-blue-600'>
                      {formatCurrency(earnings.monthly_earnings)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='benefits' className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <BarChart3 className='h-5 w-5' />
                    Analytics Access
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='flex items-center justify-between'>
                    <span>Advanced Analytics</span>
                    {programStatus.analytics_access_enabled ? (
                      <CheckCircle className='h-5 w-5 text-green-500' />
                    ) : (
                      <XCircle className='h-5 w-5 text-red-500' />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <HeadphonesIcon className='h-5 w-5' />
                    Priority Support
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='flex items-center justify-between'>
                    <span>24/7 Priority Support</span>
                    {programStatus.priority_support_enabled ? (
                      <CheckCircle className='h-5 w-5 text-green-500' />
                    ) : (
                      <XCircle className='h-5 w-5 text-red-500' />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Palette className='h-5 w-5' />
                    Custom Branding
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='flex items-center justify-between'>
                    <span>Custom Event Branding</span>
                    {programStatus.custom_branding_enabled ? (
                      <CheckCircle className='h-5 w-5 text-green-500' />
                    ) : (
                      <XCircle className='h-5 w-5 text-red-500' />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <DollarSign className='h-5 w-5' />
                    Commission Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='flex items-center justify-between'>
                    <span>Your Rate</span>
                    <Badge variant='secondary'>
                      {((programStatus.commission_rate || 0) * 100).toFixed(1)}%
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}

      {programStatus.status === 'pending' && (
        <Card>
          <CardContent className='p-6 text-center'>
            <Clock className='h-12 w-12 text-yellow-500 mx-auto mb-4' />
            <h3 className='text-lg font-semibold mb-2'>Application Under Review</h3>
            <p className='text-gray-600'>
              Your creator program application is being reviewed. We'll notify you once approved!
            </p>
          </CardContent>
        </Card>
      )}

      {programStatus.status === 'rejected' && (
        <Card>
          <CardContent className='p-6 text-center'>
            <XCircle className='h-12 w-12 text-red-500 mx-auto mb-4' />
            <h3 className='text-lg font-semibold mb-2'>Application Not Approved</h3>
            <p className='text-gray-600 mb-4'>
              Your application was not approved at this time. Continue growing your audience and
              events!
            </p>
            <Button variant='outline' onClick={() => checkEligibility()}>
              Check Eligibility Again
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CreatorProgramDashboard;