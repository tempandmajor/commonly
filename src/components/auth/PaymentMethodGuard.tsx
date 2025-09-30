import React, { useEffect, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { checkUserPaymentMethods } from '@/utils/payments/paymentMethodValidation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, CreditCard, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PaymentMethodGuardProps {
  children: React.ReactNode;
  onProceed?: () => void | undefined;
  message?: string | undefined;
}

const PaymentMethodGuard: React.FC<PaymentMethodGuardProps> = ({
  children,
  message = 'You need to add a payment method before making a purchase.',
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [hasPaymentMethod, setHasPaymentMethod] = useState(false);

  useEffect(() => {
    const checkPaymentMethod = async () => {
      if (!user?.id) {
        setIsChecking(false);
        return;
      }

      try {
        const result = await checkUserPaymentMethods(user.id);
        setHasPaymentMethod(result.hasPaymentMethods);
      } catch (error) {
        setHasPaymentMethod(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkPaymentMethod();
  }, [user?.id]);

  const handleAddPaymentMethod = () => {
    navigate('/settings?tab=payments&action=add-payment-method');
  };

  if (isChecking) {
    return (
      <div className='flex items-center justify-center min-h-[200px]'>
        <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
      </div>
    );
  }

  if (!hasPaymentMethod) {
    return (
      <Alert className='mb-6 bg-amber-50 border-amber-200'>
        <AlertCircle className='h-4 w-4 text-amber-600' />
        <AlertTitle className='text-amber-800'>Payment Method Required</AlertTitle>
        <AlertDescription className='text-amber-700'>
          <p className='mb-3'>{message}</p>
          <Button
            variant='outline'
            className='bg-amber-100 border-amber-300 hover:bg-amber-200'
            onClick={handleAddPaymentMethod}
          >
            <CreditCard className='mr-2 h-4 w-4' />
            Add Payment Method
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
};

export default PaymentMethodGuard;
