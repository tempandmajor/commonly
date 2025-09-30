import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  CreditCard,
  Info,
  Wallet,
  Building2,
  Bitcoin,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { FormField, FormSection, FormActions, CreditCardInput } from '@/components/forms/shared';
import {
  checkoutSchema,
  quickCheckoutSchema,
  pledgeSchema,
  CheckoutFormValues,
  QuickCheckoutFormValues,
  PledgeFormValues,
  checkoutDefaults,
  quickCheckoutDefaults,
  pledgeDefaults,
} from '@/lib/validations/checkoutValidation';
import { useStripeConnect } from '@/hooks/useStripeConnect';
import { useKeyboardShortcuts, createCancelShortcut } from '@/hooks/useKeyboardShortcuts';
import PaymentMethodGuard from '@/components/auth/PaymentMethodGuard';
import AllOrNothingInfo from './AllOrNothingInfo';
import { calculateFees } from '@/services/fees/feeCalculator';

interface CheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  amount: number;
  onSuccess: () => void;
  onError: (error: Error) => void;
  paymentType?: string | undefined;
  requiresStripeConnect?: boolean | undefined;
  availableTickets?: number | undefined;
  metadata?: Record<string, unknown> | undefined;
  isAllOrNothing?: boolean | undefined;
  isPlatformFee?: boolean | undefined;
  eventId?: string | undefined;
  pledgeDeadline?: string | undefined;
  goalAmount?: number | undefined;
  currentAmount?: number | undefined;
  quickCheckout?: boolean | undefined;
  savedPaymentMethods?: Array<{
    id: string;
    type: string;
    last4: string;
    brand?: string | undefined;
    isDefault?: boolean | undefined;
  }> | undefined;
}

type FormValues = CheckoutFormValues | QuickCheckoutFormValues | PledgeFormValues;

const CheckoutModal: React.FC<CheckoutModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  amount,
  onSuccess,
  onError,
  paymentType = 'ticket',
  requiresStripeConnect = false,
  availableTickets,
  isAllOrNothing = false,
  isPlatformFee = false,
  eventId,
  pledgeDeadline,
  goalAmount,
  currentAmount = 0,
  quickCheckout = false,
  savedPaymentMethods = [],
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPromoCode, setShowPromoCode] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const { hasStripeConnect } = useStripeConnect();

  // Keyboard shortcuts
  useKeyboardShortcuts([createCancelShortcut(() => onOpenChange(false))]);

  // Determine which schema to use
  const getFormConfig = (): { schema: any; defaults: Partial<FormValues> } => {
    if (isAllOrNothing && eventId) {
      return {
        schema: pledgeSchema,
        defaults: {
          ...pledgeDefaults,
          eventId,
          pledgeAmount: amount,
          ticketQuantity: 1,
          paymentMethod: '',
        } as Partial<PledgeFormValues>,
      };
    } else if (quickCheckout) {
      return {
        schema: quickCheckoutSchema,
        defaults: {
          ...quickCheckoutDefaults,
          itemId: eventId || '',
          itemType: paymentType as 'ticket' | 'product' | 'subscription' | 'credit',
          quantity: 1,
          paymentMethodId: '',
        } as Partial<QuickCheckoutFormValues>,
      };
    } else {
      return {
        schema: checkoutSchema,
        defaults: {
          ...checkoutDefaults,
          items: [
            {
              id: eventId || '',
              name: title,
              quantity: 1,
              price: amount,
              type: paymentType as 'ticket' | 'product' | 'subscription' | 'credit',
            },
          ],
          subtotal: amount,
          total: amount,
        } as Partial<CheckoutFormValues>,
      };
    }
  };

  const { schema, defaults } = getFormConfig();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: defaults as any,
  });

  // Calculate totals
  useEffect(() => {
    if (!quickCheckout && !isAllOrNothing) {
      const values = form.getValues() as CheckoutFormValues;
      const subtotal = values.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;
      const tax = subtotal * 0.08; // 8% tax

      // Use the new fee calculator
      const feeBreakdown = calculateFees({
        amount: subtotal,
        isPlatformFee,
        includeStripeFees: !isPlatformFee,
      });

      const tipAmount = (form.watch('tipAmount' as any) as number | undefined) || 0;
      const total = subtotal + tax + feeBreakdown.stripeFee + tipAmount - promoDiscount;

      form.setValue('subtotal' as any, subtotal);
      form.setValue('tax' as any, tax);
      form.setValue('platformFee' as any, feeBreakdown.stripeFee);
      form.setValue('total' as any, total);
    }
  }, [form.watch('items' as any), form.watch('tipAmount' as any), promoDiscount, isPlatformFee, quickCheckout, isAllOrNothing]);

  const handlePayment = async (_values: FormValues) => {
    try {
      setIsProcessing(true);

      // Mock payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast.success(
        isAllOrNothing
          ? 'Pledge successful! You will be charged if the event reaches its goal.'
          : 'Payment successful! Check your email for confirmation.'
      );
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      onError(error as Error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyPromo = () => {
    const promoCode = form.getValues('promoCode' as any) as string | undefined;
    if (promoCode === 'SAVE10') {
      setPromoDiscount(amount * 0.1);
      toast.success('Promo code applied! 10% discount');
    } else {
      toast.error('Invalid promo code');
    }
  };

  const paymentMethod = form.watch('paymentMethod' as any) as string | undefined;
  const subtotal = form.watch('subtotal' as any) as number | undefined;
  const tipAmount = form.watch('tipAmount' as any) as number | undefined;
  const tax = form.watch('tax' as any) as number | undefined;
  const platformFee = form.watch('platformFee' as any) as number | undefined;
  const total = form.watch('total' as any) as number | undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[600px] max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <PaymentMethodGuard
          message={
            isAllOrNothing
              ? 'You need to add a payment method to pledge support for this event.'
              : 'You need to add a payment method before making a purchase.'
          }
        >
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handlePayment as any)} className='space-y-6'>
              {/* All-or-Nothing Info */}
              {isAllOrNothing && (
                <AllOrNothingInfo
                  deadline={pledgeDeadline}
                  goalAmount={goalAmount}
                  currentAmount={currentAmount}
                />
              )}

              {/* Order Summary */}
              <FormSection
                title='Order Summary'
                description={isAllOrNothing ? 'Your pledge details' : 'Review your order'}
              >
                <div className='space-y-3'>
                  <div className='flex items-center justify-between py-2'>
                    <div>
                      <p className='font-medium'>{title}</p>
                      <p className='text-sm text-muted-foreground'>
                        {paymentType === 'ticket' && availableTickets && `${availableTickets} available`}
                      </p>
                    </div>
                    <span className='font-semibold'>${amount.toFixed(2)}</span>
                  </div>

                  {!quickCheckout && !isAllOrNothing && (
                    <>
                      <Separator />

                      {/* Promo Code */}
                      {!showPromoCode ? (
                        <Button
                          type='button'
                          variant='link'
                          size='sm'
                          onClick={() => setShowPromoCode(true)}
                          className='p-0 h-auto'
                        >
                          <Tag className='mr-2 h-3 w-3' />
                          Add promo code
                        </Button>
                      ) : (
                        <div className='flex gap-2'>
                          <FormField
                            form={form}
                            name='promoCode'
                            label='Promo Code'
                            placeholder='Enter code'
                            className='flex-1'
                          />
                          <Button type='button' size='sm' onClick={handleApplyPromo}>
                            Apply
                          </Button>
                        </div>
                      )}

                      {/* Tip Option */}
                      <div className='space-y-2'>
                        <Label className='text-sm'>Add a tip for the creator</Label>
                        <RadioGroup
                          defaultValue='0'
                          onValueChange={value => {
                            const tip = value === 'custom' ? 0 : parseFloat(value);
                            form.setValue('tipAmount' as any, tip);
                          }}
                        >
                          <div className='flex gap-4'>
                            <div className='flex items-center space-x-2'>
                              <RadioGroupItem value='0' id='tip0' />
                              <Label htmlFor='tip0' className='text-sm'>
                                No tip
                              </Label>
                            </div>
                            <div className='flex items-center space-x-2'>
                              <RadioGroupItem value='5' id='tip5' />
                              <Label htmlFor='tip5' className='text-sm'>
                                $5
                              </Label>
                            </div>
                            <div className='flex items-center space-x-2'>
                              <RadioGroupItem value='10' id='tip10' />
                              <Label htmlFor='tip10' className='text-sm'>
                                $10
                              </Label>
                            </div>
                            <div className='flex items-center space-x-2'>
                              <RadioGroupItem value='custom' id='tipCustom' />
                              <Label htmlFor='tipCustom' className='text-sm'>
                                Custom
                              </Label>
                            </div>
                          </div>
                        </RadioGroup>
                      </div>

                      <Separator />

                      {/* Price Breakdown */}
                      <div className='space-y-2 text-sm'>
                        <div className='flex justify-between'>
                          <span className='text-muted-foreground'>Subtotal</span>
                          <span>${subtotal?.toFixed(2) || '0.00'}</span>
                        </div>
                        {tipAmount && tipAmount > 0 && (
                          <div className='flex justify-between'>
                            <span className='text-muted-foreground'>Tip</span>
                            <span>${tipAmount.toFixed(2)}</span>
                          </div>
                        )}
                        {promoDiscount > 0 && (
                          <div className='flex justify-between text-green-600'>
                            <span>Promo discount</span>
                            <span>-${promoDiscount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className='flex justify-between'>
                          <span className='text-muted-foreground'>Tax</span>
                          <span>${tax?.toFixed(2) || '0.00'}</span>
                        </div>
                        {!isPlatformFee && (
                          <div className='flex justify-between'>
                            <span className='text-muted-foreground'>Processing fee</span>
                            <span>
                              ${platformFee?.toFixed(2) || '0.00'}
                            </span>
                          </div>
                        )}
                        <Separator />
                        <div className='flex justify-between font-semibold text-base'>
                          <span>Total</span>
                          <span>
                            ${total?.toFixed(2) || amount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </FormSection>

              {/* Payment Method Selection */}
              <FormSection title='Payment Method' description="Select how you'd like to pay">
                <Tabs defaultValue={savedPaymentMethods.length > 0 ? 'saved' : 'new'}>
                  {savedPaymentMethods.length > 0 && (
                    <TabsList className='grid w-full grid-cols-2'>
                      <TabsTrigger value='saved'>Saved Cards</TabsTrigger>
                      <TabsTrigger value='new'>New Card</TabsTrigger>
                    </TabsList>
                  )}

                  {savedPaymentMethods.length > 0 && (
                    <TabsContent value='saved' className='space-y-3'>
                      <RadioGroup
                        defaultValue={savedPaymentMethods.find(pm => pm.isDefault)?.id ?? undefined}
                        onValueChange={value =>
                          form.setValue('savedPaymentMethodId' as any, value)
                        }
                      >
                        {savedPaymentMethods.map(method => (
                          <div
                            key={method.id}
                            className='flex items-center space-x-3 p-3 border rounded-lg'
                          >
                            <RadioGroupItem value={method.id} id={method.id} />
                            <Label htmlFor={method.id} className='flex-1 cursor-pointer'>
                              <div className='flex items-center gap-2'>
                                <CreditCard className='h-4 w-4' />
                                <span className='font-medium'>
                                  {method.brand} •••• {method.last4}
                                </span>
                                {method.isDefault && (
                                  <Badge variant='secondary' className='text-xs'>
                                    Default
                                  </Badge>
                                )}
                              </div>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </TabsContent>
                  )}

                  <TabsContent value='new' className='space-y-4'>
                    <div className='grid grid-cols-4 gap-2'>
                      <Button
                        type='button'
                        variant={
                          paymentMethod === 'card' ? 'default' : 'outline'
                        }
                        size='sm'
                        onClick={() => form.setValue('paymentMethod' as any, 'card')}
                        className='flex flex-col gap-1 h-auto py-3'
                      >
                        <CreditCard className='h-4 w-4' />
                        <span className='text-xs'>Card</span>
                      </Button>
                      <Button
                        type='button'
                        variant={
                          paymentMethod === 'wallet'
                            ? 'default'
                            : 'outline'
                        }
                        size='sm'
                        onClick={() => form.setValue('paymentMethod' as any, 'wallet')}
                        className='flex flex-col gap-1 h-auto py-3'
                      >
                        <Wallet className='h-4 w-4' />
                        <span className='text-xs'>Wallet</span>
                      </Button>
                      <Button
                        type='button'
                        variant={
                          paymentMethod === 'bank' ? 'default' : 'outline'
                        }
                        size='sm'
                        onClick={() => form.setValue('paymentMethod' as any, 'bank')}
                        className='flex flex-col gap-1 h-auto py-3'
                      >
                        <Building2 className='h-4 w-4' />
                        <span className='text-xs'>Bank</span>
                      </Button>
                      <Button
                        type='button'
                        variant={
                          paymentMethod === 'crypto'
                            ? 'default'
                            : 'outline'
                        }
                        size='sm'
                        onClick={() => form.setValue('paymentMethod' as any, 'crypto')}
                        className='flex flex-col gap-1 h-auto py-3'
                        disabled
                      >
                        <Bitcoin className='h-4 w-4' />
                        <span className='text-xs'>Crypto</span>
                      </Button>
                    </div>

                    {paymentMethod === 'card' && (
                      <CreditCardInput form={form} />
                    )}

                    {paymentMethod === 'wallet' && (
                      <div className='space-y-3'>
                        <RadioGroup
                          onValueChange={value => form.setValue('walletType' as any, value)}
                        >
                          <div className='flex items-center space-x-3 p-3 border rounded-lg'>
                            <RadioGroupItem value='apple_pay' id='apple_pay' />
                            <Label htmlFor='apple_pay' className='flex-1 cursor-pointer'>
                              Apple Pay
                            </Label>
                          </div>
                          <div className='flex items-center space-x-3 p-3 border rounded-lg'>
                            <RadioGroupItem value='google_pay' id='google_pay' />
                            <Label htmlFor='google_pay' className='flex-1 cursor-pointer'>
                              Google Pay
                            </Label>
                          </div>
                          <div className='flex items-center space-x-3 p-3 border rounded-lg'>
                            <RadioGroupItem value='paypal' id='paypal' />
                            <Label htmlFor='paypal' className='flex-1 cursor-pointer'>
                              PayPal
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                    )}

                    {paymentMethod === 'bank' && (
                      <Alert>
                        <Info className='h-4 w-4' />
                        <AlertDescription>
                          Bank transfer option coming soon. Please use a card for now.
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Save Payment Method */}
                    {paymentMethod === 'card' && (
                      <div className='flex items-center space-x-2'>
                        <Checkbox
                          id='saveCard'
                          checked={form.watch('newCard.saveCard' as any) as boolean | undefined}
                          onCheckedChange={checked =>
                            form.setValue('newCard.saveCard' as any, checked)
                          }
                        />
                        <Label htmlFor='saveCard' className='text-sm'>
                          Save this card for future purchases
                        </Label>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </FormSection>

              {/* Billing Address */}
              {!quickCheckout && (
                <FormSection
                  title='Billing Address'
                  description='Enter your billing information'
                  collapsible
                  defaultCollapsed
                >
                  <div className='space-y-4'>
                    <FormField
                      form={form}
                      name='billingAddress.line1'
                      label='Address Line 1'
                      placeholder='123 Main St'
                      required
                    />
                    <FormField
                      form={form}
                      name='billingAddress.line2'
                      label='Address Line 2'
                      placeholder='Apt 4B'
                    />
                    <div className='grid grid-cols-2 gap-4'>
                      <FormField
                        form={form}
                        name='billingAddress.city'
                        label='City'
                        placeholder='San Francisco'
                        required
                      />
                      <FormField
                        form={form}
                        name='billingAddress.state'
                        label='State'
                        placeholder='CA'
                        required
                      />
                    </div>
                    <div className='grid grid-cols-2 gap-4'>
                      <FormField
                        form={form}
                        name='billingAddress.postalCode'
                        label='ZIP Code'
                        placeholder='94105'
                        required
                      />
                      <FormField
                        form={form}
                        name='billingAddress.country'
                        label='Country'
                        placeholder='US'
                        required
                      />
                    </div>
                  </div>
                </FormSection>
              )}

              {/* Terms and Conditions */}
              <div className='space-y-3'>
                {isAllOrNothing ? (
                  <>
                    <div className='flex items-start space-x-2'>
                      <Checkbox
                        id='understandTerms'
                        checked={form.watch('understandPledgeTerms' as any) as boolean | undefined}
                        onCheckedChange={checked =>
                          form.setValue('understandPledgeTerms' as any, checked)
                        }
                      />
                      <Label htmlFor='understandTerms' className='text-sm leading-relaxed'>
                        I understand that I will only be charged if this event reaches its funding
                        goal by the deadline
                      </Label>
                    </div>
                    <div className='flex items-start space-x-2'>
                      <Checkbox
                        id='acceptCancel'
                        checked={form.watch('acceptCancellationPolicy' as any) as boolean | undefined}
                        onCheckedChange={checked =>
                          form.setValue('acceptCancellationPolicy' as any, checked)
                        }
                      />
                      <Label htmlFor='acceptCancel' className='text-sm leading-relaxed'>
                        I accept the cancellation policy
                      </Label>
                    </div>
                  </>
                ) : (
                  <>
                    <div className='flex items-start space-x-2'>
                      <Checkbox
                        id='acceptTerms'
                        checked={form.watch('acceptTerms' as any) as boolean | undefined}
                        onCheckedChange={checked =>
                          form.setValue('acceptTerms' as any, checked)
                        }
                      />
                      <Label htmlFor='acceptTerms' className='text-sm leading-relaxed'>
                        I agree to the Terms of Service and authorize this payment
                      </Label>
                    </div>
                    {!quickCheckout && (
                      <div className='flex items-start space-x-2'>
                        <Checkbox
                          id='acceptRefund'
                          checked={form.watch('acceptRefundPolicy' as any) as boolean | undefined}
                          onCheckedChange={checked =>
                            form.setValue('acceptRefundPolicy' as any, checked)
                          }
                        />
                        <Label htmlFor='acceptRefund' className='text-sm leading-relaxed'>
                          I have read and accept the refund policy
                        </Label>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Security Notice */}
              <Alert>
                <ShieldCheck className='h-4 w-4' />
                <AlertDescription>
                  Your payment information is encrypted and secure. We never store your full card
                  details.
                </AlertDescription>
              </Alert>

              <DialogFooter>
                <FormActions
                  isSubmitting={isProcessing}
                  isDisabled={requiresStripeConnect && !hasStripeConnect}
                  submitLabel={
                    isAllOrNothing
                      ? `Pledge $${amount.toFixed(2)}`
                      : `Pay $${total?.toFixed(2) || amount.toFixed(2)}`
                  }
                  submitIcon={<CreditCard className='h-4 w-4' />}
                  showCancel={true}
                  onCancel={() => onOpenChange(false)}
                  cancelLabel='Cancel'
                />
              </DialogFooter>
            </form>
          </Form>
        </PaymentMethodGuard>
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutModal;
