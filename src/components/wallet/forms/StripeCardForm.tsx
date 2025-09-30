import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StripeCardFormProps {
  onSubmit?: (token: unknown) => void | undefined;
  loading?: boolean | undefined;
}

export const StripeCardForm: React.FC<StripeCardFormProps> = ({ onSubmit, loading }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Method</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='p-4 border rounded-md bg-muted/50'>
          <p className='text-sm text-muted-foreground'>
            Stripe integration is not available in this environment.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default StripeCardForm;
