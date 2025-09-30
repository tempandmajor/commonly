import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, RefreshCw, CheckCircle, AlertTriangle, CreditCard } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { useStripeConnect } from '@/hooks/useStripeConnect';
import { createConnectOnboardingLink } from '@/services/supabase/edge-functions';
import { toast } from 'sonner';

interface DebugInfo {
  userId: string | null;
  isAuthenticated: boolean;
  stripeAccountStatus: {
    accountId: string | null;
    hasStripeConnect: boolean;
    isStripeConnectEnabled: boolean;
    requiresOnboarding: boolean;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
  };
  edgeFunctionTests: {
    getStatus?: { success: boolean; data?: any; error?: string };
    createOnboarding?: { success: boolean; data?: any; error?: string };
  };
  timestamp: string;
  issues: string[];
  recommendations: string[];
}

export const StripeConnectDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const stripeConnect = useStripeConnect();
  const runDebug = async () => {
    setIsLoading(true);

    try {
      const status = stripeConnect.status || {};
      const info: DebugInfo = {
        userId: user?.id ?? null,
        isAuthenticated: !!user,
        stripeAccountStatus: {
          accountId: (status.id || status.account || null) as string | null,
          hasStripeConnect: !!stripeConnect.hasStripeConnect,
          isStripeConnectEnabled: !!(status.charges_enabled || status.payouts_enabled),
          requiresOnboarding: status.details_submitted === false,
          chargesEnabled: !!status.charges_enabled,
          payoutsEnabled: !!status.payouts_enabled,
        },
        edgeFunctionTests: {},
        timestamp: new Date().toISOString(),
        issues: [],
        recommendations: [],
      };

      setDebugInfo(info);

    } catch (error) {
      setDebugInfo({
        userId: user?.id ?? null,
        isAuthenticated: !!user,
        stripeAccountStatus: {
          accountId: null,
          hasStripeConnect: false,
          isStripeConnectEnabled: false,
          requiresOnboarding: false,
          chargesEnabled: false,
          payoutsEnabled: false,
        },
        edgeFunctionTests: {},
        timestamp: new Date().toISOString(),
        issues: ['Debug failed'],
        recommendations: ['Check browser console for errors'],
      });

    } finally {
      setIsLoading(false);
    }
  };

  const clearDebug = () => {
    setDebugInfo(null);
  };

  const testOnboarding = async () => {
    try {
      const result = await createConnectOnboardingLink();
      if (result.url) {
        toast.success('Onboarding link created successfully!');
        window.open(result.url, '_blank');
      }
    } catch (error) {
      toast.error(
        'Failed to create onboarding link: ' +
          (error instanceof Error ? error.message : 'Unknown error')
      );
    }
  };

  if (!debugInfo) {
    return (
      <div className='fixed bottom-4 left-4 z-50'>
        <Button
          onClick={runDebug}
          disabled={isLoading}
          className='bg-white/80 backdrop-blur-sm border border-gray-300 shadow-lg text-xs h-7 px-2'
        >
          {isLoading ? (
            <RefreshCw className='h-4 w-4 animate-spin mr-2' />
          ) : (
            <CreditCard className='h-4 w-4 mr-2' />
          )}
          Debug Stripe Connect
        </Button>
      </div>
    );
  }

  return (
    <div className='fixed bottom-4 left-4 z-50 max-w-md'>
      <Card className='bg-white/95 backdrop-blur-sm border-gray-300 shadow-xl'>
        <CardHeader className='pb-3'>
          <div className='flex items-center justify-between'>
            <CardTitle className='text-sm font-semibold'>
              <CreditCard className='h-4 w-4 inline mr-2' />
              Stripe Connect Debug
            </CardTitle>
            <Button onClick={clearDebug} className='h-6 w-6 p-0 border'>
              <X className='h-4 w-4' />
            </Button>
          </div>
        </CardHeader>
        <CardContent className='text-xs space-y-3'>
          {/* Authentication Status */}
          <div className='space-y-2'>
            <div className='flex justify-between items-center'>
              <strong>User ID:</strong>
              <span className='font-mono text-xs'>{debugInfo.userId || 'Not logged in'}</span>
            </div>
            <div className='flex justify-between items-center'>
              <strong>Authenticated:</strong>
              <Badge className={debugInfo.isAuthenticated ? '' : 'bg-red-600 text-white'}>
                {debugInfo.isAuthenticated ? 'YES' : 'NO'}
              </Badge>
            </div>
          </div>

          {/* Stripe Account Status */}
          <div className='space-y-2 border-t pt-2'>
            <strong className='text-sm'>Stripe Account Status:</strong>
            <div className='grid grid-cols-2 gap-1 text-xs'>
              <div>Has Account:</div>
              <Badge
                className={'text-xs ' + (debugInfo.stripeAccountStatus.hasStripeConnect ? '' : 'bg-gray-300 text-gray-800')}
              >
                {debugInfo.stripeAccountStatus.hasStripeConnect ? 'YES' : 'NO'}
              </Badge>

              <div>Enabled:</div>
              <Badge
                className={'text-xs ' + (debugInfo.stripeAccountStatus.isStripeConnectEnabled ? '' : 'bg-red-600 text-white')}
              >
                {debugInfo.stripeAccountStatus.isStripeConnectEnabled ? 'YES' : 'NO'}
              </Badge>

              <div>Charges:</div>
              <Badge
                className={'text-xs ' + (debugInfo.stripeAccountStatus.chargesEnabled ? '' : 'bg-red-600 text-white')}
              >
                {debugInfo.stripeAccountStatus.chargesEnabled ? 'YES' : 'NO'}
              </Badge>

              <div>Payouts:</div>
              <Badge
                className={'text-xs ' + (debugInfo.stripeAccountStatus.payoutsEnabled ? '' : 'bg-red-600 text-white')}
              >
                {debugInfo.stripeAccountStatus.payoutsEnabled ? 'YES' : 'NO'}
              </Badge>
            </div>
          </div>

          {/* Edge Function Tests */}
          <div className='space-y-2 border-t pt-2'>
            <strong className='text-sm'>Edge Function Tests:</strong>
            {Object.entries(debugInfo.edgeFunctionTests).map(([testName, result]) => (
              <div key={testName} className='flex justify-between items-center'>
                <span className='capitalize'>
                  {testName.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                </span>
                <Badge className={'text-xs ' + (result.success ? '' : 'bg-red-600 text-white')}>
                  {result.success ? 'PASS' : 'FAIL'}
                </Badge>
              </div>
            ))}
          </div>

          {/* Issues */}
          {debugInfo.issues.length > 0 && (
            <Alert className='border-red-200 bg-red-50'>
              <AlertTriangle className='h-4 w-4 text-red-600' />
              <AlertDescription className='text-xs text-red-700'>
                <strong>Issues Found:</strong>
                <ul className='list-disc list-inside mt-1 space-y-1'>
                  {debugInfo.issues.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Recommendations */}
          {debugInfo.recommendations.length > 0 && (
            <Alert className='border-blue-200 bg-blue-50'>
              <CheckCircle className='h-4 w-4 text-blue-600' />
              <AlertDescription className='text-xs text-blue-700'>
                <strong>Recommendations:</strong>
                <ul className='list-disc list-inside mt-1 space-y-1'>
                  {debugInfo.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Quick Actions */}
          <div className='space-y-2 border-t pt-2'>
            <strong className='text-sm'>Quick Actions:</strong>
            <div className='flex gap-2'>
              <Button onClick={runDebug} className='text-xs border h-7 px-2'>
                <RefreshCw className='h-3 w-3 mr-1' />
                Refresh
              </Button>
              {debugInfo.isAuthenticated && debugInfo.stripeAccountStatus.requiresOnboarding && (
                <Button onClick={testOnboarding} className='text-xs h-7 px-2'>
                  Test Onboarding
                </Button>
              )}
            </div>
          </div>

          {/* Timestamp */}
          <div className='text-gray-500 text-xs pt-2 border-t'>
            Debug run at: {new Date(debugInfo.timestamp).toLocaleTimeString()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
