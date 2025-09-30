import React from 'react';
import SimpleHeader from '@/components/layout/SimpleHeader';
import Footer from '@/components/layout/Footer';
import { StripeConnectDebug } from '@/components/debug/StripeConnectDebug';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const StripeConnectTest: React.FC = () => {
  return (
    <div className='flex min-h-screen flex-col'>
      <SimpleHeader />
      <main className='flex-1 container mx-auto px-4 py-8'>
        <div className='max-w-4xl mx-auto space-y-6'>
          <div className='text-center'>
            <h1 className='text-3xl font-bold tracking-tight'>Stripe Connect Testing</h1>
            <p className='text-muted-foreground mt-2'>
              Debug and test Stripe Connect functionality
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Stripe Connect Debug Tools</CardTitle>
              <CardDescription>
                Use the debug component in the bottom-left corner to test Stripe Connect
                functionality. This page is for development and testing purposes only.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div>
                  <h3 className='font-semibold'>Available Tests:</h3>
                  <ul className='list-disc list-inside mt-2 space-y-1 text-sm text-muted-foreground'>
                    <li>Authentication status check</li>
                    <li>Stripe account status verification</li>
                    <li>Edge function connectivity test</li>
                    <li>Onboarding link generation</li>
                    <li>Real-time status monitoring</li>
                  </ul>
                </div>

                <div>
                  <h3 className='font-semibold'>How to Use:</h3>
                  <ol className='list-decimal list-inside mt-2 space-y-1 text-sm text-muted-foreground'>
                    <li>Click the "Debug Stripe Connect" button in the bottom-left corner</li>
                    <li>Review the authentication and account status</li>
                    <li>Check edge function test results</li>
                    <li>Follow any recommendations provided</li>
                    <li>Use "Test Onboarding" button if needed</li>
                  </ol>
                </div>

                <div>
                  <h3 className='font-semibold'>Common Issues:</h3>
                  <ul className='list-disc list-inside mt-2 space-y-1 text-sm text-muted-foreground'>
                    <li>
                      <strong>401 Unauthorized:</strong> Session expired - try logging out and back
                      in
                    </li>
                    <li>
                      <strong>Account not enabled:</strong> Complete Stripe onboarding process
                    </li>
                    <li>
                      <strong>Charges disabled:</strong> Complete identity verification in Stripe
                    </li>
                    <li>
                      <strong>WebSocket errors:</strong> Network connectivity issues
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />

      {/* Debug Component */}
      <StripeConnectDebug />
    </div>
  );
};

export default StripeConnectTest;
