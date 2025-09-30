import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, CreditCard, Shield, CheckCircle } from 'lucide-react';
import { Elements, useElements, useStripe, CardElement } from '@stripe/react-stripe-js';
import stripePromise from '@/services/stripe/stripeClient';
import { createSetupIntent } from '@/services/supabase/edge-functions';

const AddPaymentMethodInner = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [cardData, setCardData] = useState({
    cardholderName: '',
    billingAddress: {
      line1: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'US',
    },
  });

  const redirectUrl = searchParams.get('redirect') || '/wallet';

  // RouteWrapper now handles auth; keep component logic focused on form

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('billing.')) {
      const addressField = field.split('.')[1];
      setCardData(prev => ({
          ...prev,
        billingAddress: {
          ...prev.billingAddress,
          [addressField]: value,
        },
      }));
    } else {
      setCardData(prev => ({
          ...prev,
        [field]: value,
      }));
    }
  };

  // Card number/expiry/CVC handled by Stripe Elements

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      if (!stripe || !elements) {
        throw new Error('Stripe is not initialized. Please try again.');
      }

      // Get current session for authentication
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Authentication required');
      }

      // Create SetupIntent via Edge Function
      const setupIntent: any = await createSetupIntent();
      const clientSecret =
        setupIntent?.client_secret || setupIntent?.clientSecret || setupIntent?.data?.client_secret;
      if (!clientSecret) {
        throw new Error('Failed to create setup intent. Please try again.');
      }

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found.');
      }

      const { error: confirmError } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: cardData.cardholderName,
            address: {
              line1: cardData.billingAddress.line1,
              city: cardData.billingAddress.city,
              state: cardData.billingAddress.state,
              postal_code: cardData.billingAddress.postalCode,
              country: cardData.billingAddress.country,
            },
          },
        },
      });

      if (confirmError) {
        throw new Error(confirmError.message || 'Failed to confirm card setup');
      }

      toast.success('Payment method added successfully');
      navigate(redirectUrl);
    } catch (error: any) {
      console.error('Error adding payment method:', error);
      toast.error(error.message || 'Failed to add payment method. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // years selection handled inline; helper removed

  // Auth gating is provided by RouteWrapper

  return (
    <>
      <div className='container max-w-2xl mx-auto py-8 px-4'>
        {/* Header */}
        <div className='flex items-center gap-4 mb-6'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => navigate(-1)}
            className='flex items-center gap-2'
          >
            <ArrowLeft className='h-4 w-4' />
            Back
          </Button>
          <div>
            <h1 className='text-2xl font-bold'>Add Payment Method</h1>
            <p className='text-muted-foreground'>
              Securely add a credit or debit card to your account
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <Card className='mb-6 border-border bg-secondary'>
          <CardContent className='flex items-start gap-3 p-4'>
            <Shield className='h-5 w-5 text-primary mt-0.5' />
            <div className='flex-1'>
              <h3 className='font-medium text-foreground'>Secure Payment Processing</h3>
              <p className='text-sm text-muted-foreground mt-1'>
                Your payment information is encrypted and processed securely through Stripe. We
                never store your card details on our servers.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Payment Form */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <CreditCard className='h-5 w-5' />
              Card Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className='space-y-6'>
              {/* Card Element */}
              <div className='space-y-2'>
                <Label>Card Details</Label>
                <div className='p-3 border rounded-md'>
                  <CardElement options={{ hidePostalCode: true }} />
                </div>
              </div>

              {/* Cardholder Name */}
              <div className='space-y-2'>
                <Label htmlFor='cardholderName'>Cardholder Name</Label>
                <Input
                  id='cardholderName'
                  type='text'
                  value={cardData.cardholderName}
                  onChange={e => handleInputChange('cardholderName', (e.target as HTMLInputElement).value)}
                  placeholder='John Doe'
                  required
                />
              </div>

              {/* Expiry and CVC handled by CardElement */}

              {/* Billing Address */}
              <div className='space-y-4'>
                <h3 className='font-medium'>Billing Address</h3>

                <div className='space-y-2'>
                  <Label htmlFor='address'>Street Address</Label>
                  <Input
                    id='address'
                    type='text'
                    value={cardData.billingAddress.line1}
                    onChange={e => handleInputChange('billing.line1', (e.target as HTMLInputElement).value)}
                    placeholder='123 Main Street'
                    required
                  />
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='city'>City</Label>
                    <Input
                      id='city'
                      type='text'
                      value={cardData.billingAddress.city}
                      onChange={e => handleInputChange('billing.city', (e.target as HTMLInputElement).value)}
                      placeholder='New York'
                      required
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='state'>State</Label>
                    <Input
                      id='state'
                      type='text'
                      value={cardData.billingAddress.state}
                      onChange={e => handleInputChange('billing.state', (e.target as HTMLInputElement).value)}
                      placeholder='NY'
                      required
                    />
                  </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='postalCode'>Postal Code</Label>
                    <Input
                      id='postalCode'
                      type='text'
                      value={cardData.billingAddress.postalCode}
                      onChange={e => handleInputChange('billing.postalCode', (e.target as HTMLInputElement).value)}
                      placeholder='10001'
                      required
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='country'>Country</Label>
                    <Select
                      value={cardData.billingAddress.country}
                      onValueChange={value => handleInputChange('billing.country', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='US'>United States</SelectItem>
                        <SelectItem value='CA'>Canada</SelectItem>
                        <SelectItem value='GB'>United Kingdom</SelectItem>
                        <SelectItem value='AU'>Australia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className='flex justify-end pt-4'>
                <Button type='submit' disabled={loading} className='min-w-[120px]'>
                  {loading ? (
                    <div className='flex items-center gap-2'>
                      <div className='w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin' />
                      Adding...
                    </div>
                  ) : (
                    <div className='flex items-center gap-2'>
                      <CheckCircle className='h-4 w-4' />
                      Add Payment Method
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

const AddPaymentMethod: React.FC = () => {
  return (
    <Elements stripe={stripePromise}>
      <AddPaymentMethodInner />
    </Elements>
  );
};

export default AddPaymentMethod;
