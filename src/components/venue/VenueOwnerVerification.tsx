import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Shield, AlertTriangle, CheckCircle, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useIdentityVerification } from '@/hooks/useIdentityVerification';
import { useLocation } from 'react-router-dom';

interface VenueOwnerVerificationProps {
  className?: string | undefined;
}

const VenueOwnerVerification = ({ className }: VenueOwnerVerificationProps) => {
  const location = useLocation();
  const { verificationStatus, lastUpdated, isCreatingSession, startVerification, refreshStatus } =
    useIdentityVerification();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleStartVerification = async () => {
    const currentUrl = `${window.location.origin}${location.pathname}`;
    setIsRedirecting(true);

    try {
      const verificationUrl = await startVerification(currentUrl);

      if (verificationUrl) {
        window.location.href = verificationUrl;
      } else {
        toast.error('Failed to start verification process');
        setIsRedirecting(false);
      }
    } catch (error) {
      toast.error('An error occurred while starting verification');
      setIsRedirecting(false);
    }
  };

  const getStatusDisplay = () => {
    switch (verificationStatus) {
      case 'loading':
        return (
          <div className='flex items-center'>
            <div className='h-4 w-4 mr-2 rounded-full border-2 border-primary border-t-transparent animate-spin'></div>
            <span>Loading verification status...</span>
          </div>
        );
      case 'verified':
        return (
          <div className='bg-green-50 p-4 rounded-md border border-green-200'>
            <div className='flex items-center'>
              <CheckCircle className='text-green-500 mr-2 h-5 w-5' />
              <div>
                <p className='font-medium text-green-700'>Identity Verified</p>
                <p className='text-sm text-green-600'>
                  Your identity has been verified successfully.
                </p>
                {lastUpdated && (
                  <p className='text-xs text-green-500 mt-1'>
                    Verified on {lastUpdated.toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      case 'pending':
        return (
          <div className='bg-amber-50 p-4 rounded-md border border-amber-200'>
            <div className='flex items-center'>
              <AlertTriangle className='text-amber-500 mr-2 h-5 w-5' />
              <div>
                <p className='font-medium text-amber-700'>Verification Pending</p>
                <p className='text-sm text-amber-600'>
                  Your identity verification is in progress. This may take a few minutes.
                </p>
                {lastUpdated && (
                  <p className='text-xs text-amber-500 mt-1'>
                    Last checked: {lastUpdated.toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      case 'failed':
        return (
          <div className='bg-red-50 p-4 rounded-md border border-red-200'>
            <div className='flex items-center'>
              <AlertTriangle className='text-red-500 mr-2 h-5 w-5' />
              <div>
                <p className='font-medium text-red-700'>Verification Failed</p>
                <p className='text-sm text-red-600'>
                  Your identity verification attempt failed. Please try again.
                </p>
              </div>
            </div>
          </div>
        );
      case 'none':
        return (
          <div className='bg-blue-50 p-4 rounded-md border border-blue-200'>
            <div className='flex items-center'>
              <Shield className='text-blue-500 mr-2 h-5 w-5' />
              <div>
                <p className='font-medium text-blue-700'>Verification Required</p>
                <p className='text-sm text-blue-600'>
                  Please verify your identity to list your venue on our platform.
                </p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <UserCheck className='h-5 w-5 text-primary' />
          Identity Verification
        </CardTitle>
        <CardDescription>
          We require venue owners to verify their identity for security purposes
        </CardDescription>
      </CardHeader>
      <CardContent>{getStatusDisplay()}</CardContent>
      <CardFooter className='flex flex-col sm:flex-row gap-2 sm:justify-between'>
        <div>
          {verificationStatus === 'verified' && (
            <Badge variant='outline' className='bg-green-100 text-green-800 border-green-300'>
              <CheckCircle className='mr-1 h-3 w-3' /> Verified Owner
            </Badge>
          )}
        </div>
        <div className='flex gap-2 w-full sm:w-auto'>
          <Button
            variant='outline'
            size='sm'
            onClick={refreshStatus}
            disabled={verificationStatus === 'loading' || isCreatingSession || isRedirecting}
            className='w-full sm:w-auto'
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${verificationStatus === 'loading' ? 'animate-spin' : ''}`}
            />
            Refresh Status
          </Button>

          {((verificationStatus === 'none' || verificationStatus === 'failed')) && (
            <Button
              variant='default'
              size='sm'
              onClick={handleStartVerification}
              disabled={isCreatingSession || isRedirecting}
              className='w-full sm:w-auto'
            >
              {isCreatingSession || isRedirecting ? (
                <>
                  <div className='h-4 w-4 mr-2 rounded-full border-2 border-white border-t-transparent animate-spin'></div>
                  {isRedirecting ? 'Redirecting...' : 'Starting...'}
                </>
              ) : (
                <>
                  <Shield className='mr-2 h-4 w-4' />
                  Verify Now
                </>
              )}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default VenueOwnerVerification;
