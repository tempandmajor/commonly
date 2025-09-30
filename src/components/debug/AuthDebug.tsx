import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { X, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';

interface DebugInfo {
  currentDomain: string;
  expectedDomain: any;
  environment: string;
  supabaseUrl: any;
  hasSupabaseKey: boolean;
  timestamp: string;
  authTest?: {
    success: boolean | undefined;
    hasSession?: boolean | undefined;
    error?: string | undefined;
  };
  signOutTest?: {
    success: boolean;
    error?: string;
  };
  issues?: string[];
  recommendations?: string[];
  error?: string;
}

export const AuthDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runDebug = async () => {
    setIsLoading(true);

    try {
      const info: DebugInfo = {
        currentDomain: window.location.origin,
        expectedDomain: process.env.NEXT_PUBLIC_APP_URL as string,
        environment: process.env.NODE_ENV as string,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL as string,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        timestamp: new Date().toISOString(),
      };

      // Test auth connection
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        info.authTest = {
          success: !error,
          hasSession: !!session,
          ...(error && { error: error.message }),
        };
      } catch (err) {
        info.authTest = {
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        };
      }

      // Test sign out (if signed in)
      try {
        const { error: signOutError } = await supabase.auth.signOut();
        info.signOutTest = {
          success: !signOutError,
          ...(signOutError && { error: signOutError.message }),
        };
      } catch (err) {
        info.signOutTest = {
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        };
      }

      // Check for common issues
      info.issues = [];
      info.recommendations = [];

      if (info.currentDomain !== info.expectedDomain) {
        info.issues.push('Domain mismatch detected');
        info.recommendations.push('Update Supabase Auth settings to include current domain');
      }

      if (!info.hasSupabaseKey) {
        info.issues.push('Missing Supabase API key');
        info.recommendations.push('Set VITE_SUPABASE_ANON_KEY environment variable');
      }

      if (!info.supabaseUrl) {
        info.issues.push('Missing Supabase URL');
        info.recommendations.push('Set VITE_SUPABASE_URL environment variable');
      }

      if (!info.authTest?.success) {
        info.issues.push('Authentication test failed');
        info.recommendations.push('Check Supabase Auth configuration and network connectivity');
      }

      setDebugInfo(info);
    } catch (error) {
      setDebugInfo({
        currentDomain: window.location.origin,
        expectedDomain: process.env.NEXT_PUBLIC_APP_URL as string,
        environment: process.env.NODE_ENV as string,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL as string,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setIsLoading(false);
    }

  };

  const clearDebug = () => {
    setDebugInfo(null);
  };

  if (!debugInfo) {
    return (
      <div className='fixed bottom-4 right-4 z-50'>
        <Button
          onClick={runDebug}
          variant='outline'
          size='sm'
          disabled={isLoading}
          className='bg-white/80 backdrop-blur-sm border-gray-300 shadow-lg'
        >
          {isLoading ? <RefreshCw className='h-4 w-4 animate-spin mr-2' /> : '🔐 Debug Auth'}
        </Button>
      </div>
    );
  }

  return (
    <div className='fixed bottom-4 right-4 z-50 max-w-md'>
      <Card className='bg-white/95 backdrop-blur-sm border-gray-300 shadow-xl'>
        <CardHeader className='pb-3'>
          <div className='flex items-center justify-between'>
            <CardTitle className='text-sm font-semibold'>🔐 Auth Debug Info</CardTitle>
            <Button onClick={clearDebug} variant='ghost' size='sm' className='h-6 w-6 p-0'>
              <X className='h-4 w-4' />
            </Button>
          </div>
        </CardHeader>
        <CardContent className='text-xs space-y-3'>
          {/* Basic Info */}
          <div className='space-y-2'>
            <div className='flex justify-between'>
              <strong>Domain:</strong>
              <span className='font-mono'>{debugInfo.currentDomain}</span>
            </div>
            <div className='flex justify-between'>
              <strong>Expected:</strong>
              <span className='font-mono'>{debugInfo.expectedDomain || 'Not set'}</span>
            </div>
            <div className='flex justify-between'>
              <strong>Environment:</strong>
              <Badge variant={debugInfo.environment === 'production' ? 'default' : 'secondary'}>
                {debugInfo.environment}
              </Badge>
            </div>
          </div>

          {/* Auth Test Results */}
          <div className='space-y-2'>
            <div className='flex justify-between items-center'>
              <strong>Auth Test:</strong>
              <Badge variant={debugInfo.authTest?.success ? 'default' : 'destructive'}>
                {debugInfo.authTest?.success ? 'PASS' : 'FAIL'}
              </Badge>
            </div>
            {debugInfo.authTest?.hasSession && (
              <div className='flex justify-between'>
                <strong>Session:</strong>
                <Badge variant='outline'>Active</Badge>
              </div>
            )}
            {debugInfo.authTest?.error && (
              <div className='text-red-500 text-xs'>
                <strong>Error:</strong> {debugInfo.authTest.error}
              </div>
            )}
          </div>

          {/* Issues and Recommendations */}
          {debugInfo.issues && debugInfo.issues.length > 0 && (
            <Alert className='border-red-200 bg-red-50'>
              <AlertTriangle className='h-4 w-4 text-red-600' />
              <AlertDescription className='text-xs text-red-700'>
                <strong>Issues Found:</strong>
                <ul className='list-disc list-inside mt-1 space-y-1'>
                  {debugInfo.issues.map((issue: string, index: number) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {debugInfo.recommendations && debugInfo.recommendations.length > 0 && (
            <Alert className='border-blue-200 bg-blue-50'>
              <CheckCircle className='h-4 w-4 text-blue-600' />
              <AlertDescription className='text-xs text-blue-700'>
                <strong>Recommendations:</strong>
                <ul className='list-disc list-inside mt-1 space-y-1'>
                  {debugInfo.recommendations.map((rec: string, index: number) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Timestamp */}
          <div className='text-gray-500 text-xs pt-2 border-t'>
            Debug run at: {new Date(debugInfo.timestamp).toLocaleTimeString()}
          </div>
        </CardContent>
      </Card>
    </div>
  );

};

