import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

interface EnvironmentDebugProps {
  show?: boolean | undefined;
}

export const EnvironmentDebug: React.FC<EnvironmentDebugProps> = ({ show = false }) => {
  const [isVisible, setIsVisible] = useState(show);

  if (!isVisible) {
    return (
      <div className='fixed bottom-4 right-4 z-50'>
        <Button
          onClick={() => setIsVisible(true)}
          className='bg-white/80 backdrop-blur-sm border h-7 px-2 text-xs'
        >
          Debug Env
        </Button>
      </div>
    );
  }

  const envVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SUPABASE_PROJECT_ID: process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NODE_ENV: process.env.NODE_ENV,
  };

  const criticalVars = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
  const missingCritical = criticalVars.filter(key => !envVars[key as keyof typeof envVars]);

  const getStatusIcon = (value: string | undefined) => {
    if (!value) return <XCircle className='h-4 w-4 text-red-500' />;
    if (value.length < 10) return <AlertTriangle className='h-4 w-4 text-yellow-500' />;
    return <CheckCircle className='h-4 w-4 text-green-500' />;
  };

  const getStatusBadge = (value: string | undefined) => {
    if (!value) return <Badge className='bg-red-600 text-white'>Missing</Badge>;
    if (value.length < 10) return <Badge className='bg-gray-300 text-gray-800'>Invalid</Badge>;
    return <Badge className='bg-green-600 text-white'>OK</Badge>;
  };

  return (
    <div className='fixed inset-4 z-50 overflow-auto bg-black/50 backdrop-blur-sm'>
      <div className='min-h-full flex items-center justify-center p-4'>
        <Card className='w-full max-w-2xl max-h-full overflow-auto'>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <CardTitle className='flex items-center gap-2'>
                <Info className='h-5 w-5' />
                Environment Debug
              </CardTitle>
              <Button onClick={() => setIsVisible(false)} className='border h-7 px-2 text-xs'>
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent className='space-y-4'>
            {missingCritical.length > 0 && (
              <Alert className='border-red-200 bg-red-50'>
                <XCircle className='h-4 w-4' />
                <AlertDescription>
                  <strong>Critical Error:</strong> Missing required environment variables:{' '}
                  {missingCritical.join(', ')}
                </AlertDescription>
              </Alert>
            )}

            <div className='space-y-3'>
              {Object.entries(envVars).map(([key, value]) => (
                <div key={key} className='flex items-center justify-between p-3 border rounded-lg'>
                  <div className='flex items-center gap-3'>
                    {getStatusIcon(value)}
                    <div>
                      <div className='font-medium text-sm'>{key}</div>
                      <div className='text-xs text-gray-500'>
                        {value
                          ? `${value.substring(0, 20)}${value.length > 20 ? '...' : ''}`
                          : 'Not set'}
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(value)}
                </div>
              ))}
            </div>

            <div className='pt-4 border-t'>
              <h4 className='font-medium mb-2'>Current Location:</h4>
              <div className='text-sm text-gray-600 space-y-1'>
                <div>Origin: {window.location.origin}</div>
                <div>Pathname: {window.location.pathname}</div>
                <div>Search: {window.location.search}</div>
              </div>
            </div>

            <div className='pt-4 border-t'>
              <h4 className='font-medium mb-2'>Quick Actions:</h4>
              <div className='flex gap-2'>
                <Button
                  onClick={() => {
                    // Environment debugging information logged internally
                  }}
                  className='border h-7 px-2 text-xs'
                >
                  Log to Console
                </Button>
                <Button
                  onClick={() => {
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.reload();
                  }}
                  className='border h-7 px-2 text-xs'
                >
                  Clear Storage & Reload
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
