'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useKeyboardShortcuts, createSubmitShortcut } from '@/hooks/useKeyboardShortcuts';
import { FormField, FormSection, FormActions, SearchSelect } from '@/components/forms/shared';
import {
  planSelectionSchema,
  planSelectionDefaults,
  PlanSelectionFormValues,
  cardPaymentSchema,
  cardPaymentDefaults,
  PaymentMethodFormValues,
  subscriptionUpdateSchema,
  subscriptionUpdateDefaults,
  SubscriptionUpdateFormValues,
  billingInfoSchema,
  billingInfoDefaults,
  BillingInfoFormValues,
  subscriptionPlans,
  billingCycles,
  currencies,
  formatCardNumber,
  validateCardNumber,
  getCardType,
  calculatePricing,
} from '@/lib/validations/subscriptionValidation';
import {
  CreditCard,
  Building,
  Shield,
  Check,
  X,
  TrendingUp,
  TrendingDown,
  Pause,
  Play,
  AlertTriangle,
  Calendar,
  DollarSign,
  Percent,
  Package,
  Zap,
  Star,
  Info,
  Download,
  Mail,
  Lock,
  Smartphone,
  Globe,
  Bitcoin,
  ArrowRight,
  Sparkles,
  Crown,
  Rocket,
  Plus,
  Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubscriptionFormProps {
  currentPlan?: {
    plan: string | undefined;
    billingCycle: string;
    price: number;
    nextBillingDate: Date;
    status: 'active' | 'cancelled' | 'paused';
  };
  onPlanChange?: (data: PlanSelectionFormValues) => Promise<void>;
  onPaymentUpdate?: (data: PaymentMethodFormValues) => Promise<void>;
  onSubscriptionUpdate?: (data: SubscriptionUpdateFormValues) => Promise<void>;
  onBillingInfoUpdate?: (data: BillingInfoFormValues) => Promise<void>;
  savedPaymentMethods?: Array<{
    id: string;
    type: string;
    last4?: string;
    brand?: string;
    isDefault: boolean;
  }>;
  className?: string;
}

const planIcons = {
  free: Sparkles,
  starter: Star,
  pro: Crown,
  enterprise: Rocket,
};

const planFeatures = {
  free: ['Up to 3 events', '50 attendees per event', 'Basic features', 'Community support'],
  starter: ['Unlimited events', '500 attendees per event', 'Advanced features', 'Email support'],
  pro: [
    'Unlimited events',
    'Unlimited attendees',
    'All features',
    'Priority support',
    'API access',
    'Advanced analytics',
  ],
  enterprise: [
    'Everything in Pro',
    'Dedicated account manager',
    'Custom integrations',
    'SLA guarantee',
    'Training sessions',
  ],
};

export const SubscriptionForm: React.FC<SubscriptionFormProps> = ({
  currentPlan,
  onPlanChange,
  onPaymentUpdate,
  onSubscriptionUpdate,
  onBillingInfoUpdate,
  savedPaymentMethods = [],
  className,
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('plan');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(currentPlan?.plan || 'free');
  const [selectedCycle, setSelectedCycle] = useState(currentPlan?.billingCycle || 'monthly');
  const [pricing, setPricing] = useState(calculatePricing(selectedPlan, selectedCycle, 1));
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'new' | string>('new');
  const [cardType, setCardType] = useState('unknown');

  // Plan selection form
  const planForm = useForm<PlanSelectionFormValues>({
    resolver: zodResolver(planSelectionSchema),
    defaultValues: {
      ...planSelectionDefaults,
      ...(currentPlan && { plan: currentPlan.plan || 'free' }),
      ...(currentPlan && { billingCycle: currentPlan.billingCycle || 'monthly' }),
    },
  });

  // Payment form
  const paymentForm = useForm<PaymentMethodFormValues>({
    resolver: zodResolver(cardPaymentSchema),
    defaultValues: cardPaymentDefaults as PaymentMethodFormValues,
  });

  // Subscription update form
  const updateForm = useForm<SubscriptionUpdateFormValues>({
    resolver: zodResolver(subscriptionUpdateSchema),
    defaultValues: subscriptionUpdateDefaults,
  });

  // Billing info form
  const billingForm = useForm<BillingInfoFormValues>({
    resolver: zodResolver(billingInfoSchema),
    defaultValues: billingInfoDefaults as BillingInfoFormValues,
  });

  // Update pricing when plan or cycle changes
  useEffect(() => {
    const subscription = planForm.watch(value => {
      if (value.plan && value.billingCycle) {
        const newPricing = calculatePricing(
          value.plan,
          value.billingCycle,
          value.quantity || 1,
          value.addons
        );
        setPricing(newPricing);
        setSelectedPlan(value.plan);
        setSelectedCycle(value.billingCycle);
      }
    });
    return () => subscription.unsubscribe();
  }, [planForm]);

  // Card number formatting and validation
  useEffect(() => {
    const subscription = paymentForm.watch(value => {
      if (value.type === 'card' && value.cardNumber) {
        const formatted = formatCardNumber(value.cardNumber) as number;
        if (formatted !== value.cardNumber) {
          paymentForm.setValue('cardNumber', formatted);
        }
        setCardType(getCardType(value.cardNumber));
      }
    });
    return () => subscription.unsubscribe();
  }, [paymentForm]);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    createSubmitShortcut(() => {
      switch (activeTab) {
        case 'plan':
          planForm.handleSubmit(handlePlanChange)();
          break;
        case 'payment':
          paymentForm.handleSubmit(handlePaymentUpdate)();
          break;
        case 'billing':
          billingForm.handleSubmit(handleBillingInfoUpdate)();
          break;
      }
    }),
  ]);

  const handlePlanChange = async (data: PlanSelectionFormValues) => {
    setIsSubmitting(true);
    try {
      if (onPlanChange) {
        await onPlanChange(data);
      }

      toast({
        title: 'Plan updated',
        description: 'Your subscription has been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Update failed',
        description: 'Failed to update your subscription. Please try again.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentUpdate = async (data: PaymentMethodFormValues) => {
    setIsSubmitting(true);
    try {
      // Validate card number
      if (data.type === 'card' && !validateCardNumber(data.cardNumber) as number) {
        toast({
          title: 'Invalid card number',
          description: 'Please check your card number and try again.',
          variant: 'destructive',
        });
        return;
      }

      if (onPaymentUpdate) {
        await onPaymentUpdate(data);
      }

      toast({
        title: 'Payment method updated',
        description: 'Your payment method has been saved.',
      });
    } catch (error) {
      toast({
        title: 'Update failed',
        description: 'Failed to update payment method. Please try again.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubscriptionUpdate = async (data: SubscriptionUpdateFormValues) => {
    setIsSubmitting(true);
    try {
      if (onSubscriptionUpdate) {
        await onSubscriptionUpdate(data);
      }

      const actionMessages = {
        cancel: 'Your subscription has been cancelled.',
        pause: 'Your subscription has been paused.',
        resume: 'Your subscription has been resumed.',
        upgrade: 'Your plan has been upgraded.',
        downgrade: 'Your plan has been downgraded.',
      };

      toast({
        title: 'Subscription updated',
        description: actionMessages[data.action],
      });

      setShowCancelConfirm(false);
    } catch (error) {
      toast({
        title: 'Update failed',
        description: 'Failed to update subscription. Please try again.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBillingInfoUpdate = async (data: BillingInfoFormValues) => {
    setIsSubmitting(true);
    try {
      if (onBillingInfoUpdate) {
        await onBillingInfoUpdate(data);
      }

      toast({
        title: 'Billing information updated',
        description: 'Your billing details have been saved.',
      });
    } catch (error) {
      toast({
        title: 'Update failed',
        description: 'Failed to update billing information. Please try again.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderPlanTab = () => (
    <form onSubmit={planForm.handleSubmit(handlePlanChange)} className='space-y-6'>
      {/* Current Plan Status */}
      {currentPlan && (
        <Alert>
          <Info className='w-4 h-4' />
          <AlertDescription>
            You are currently on the <strong>{currentPlan.plan}</strong> plan (
            {currentPlan.billingCycle} billing) at ${currentPlan.price}/
            {currentPlan.billingCycle === 'monthly'
              ? 'mo'
              : currentPlan.billingCycle === 'quarterly'
                ? 'qtr'
                : 'yr'}
            .
            {currentPlan.status === 'active' && (
              <> Next billing date: {currentPlan.nextBillingDate.toLocaleDateString()}</>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Plan Selection */}
      <div className='space-y-4'>
        <h3 className='text-lg font-semibold'>Choose Your Plan</h3>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          {subscriptionPlans.map(plan => {
            const Icon = planIcons[plan];
            const isCurrentPlan = currentPlan?.plan === plan;
            const isSelected = selectedPlan === plan;

            return (
              <Card
                key={plan}
                className={cn(
                  'relative cursor-pointer transition-all',
                  isSelected && 'ring-2 ring-primary',
                  isCurrentPlan && 'border-primary'
                )}
                onClick={() => planForm.setValue('plan', plan)}
              >
                {isCurrentPlan && (
                  <Badge className='absolute -top-2 -right-2' variant='default'>
                    Current
                  </Badge>
                )}
                {plan === 'pro' && (
                  <Badge className='absolute -top-2 -left-2' variant='secondary'>
                    Popular
                  </Badge>
                )}

                <CardHeader className='text-center pb-2'>
                  <Icon className='w-8 h-8 mx-auto mb-2 text-primary' />
                  <CardTitle className='capitalize'>{plan}</CardTitle>
                </CardHeader>

                <CardContent className='text-center space-y-4'>
                  <div>
                    <span className='text-3xl font-bold'>
                      ${calculatePricing(plan, selectedCycle, 1).total.toFixed(0)}
                    </span>
                    <span className='text-muted-foreground'>
                      /
                      {selectedCycle === 'monthly'
                        ? 'mo'
                        : selectedCycle === 'quarterly'
                          ? 'qtr'
                          : 'yr'}
                    </span>
                  </div>

                  <ul className='space-y-2 text-sm text-left'>
                    {planFeatures[plan].map((feature, index) => (
                      <li key={index} className='flex items-start gap-2'>
                        <Check className='w-4 h-4 text-green-600 mt-0.5 flex-shrink-0' />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    type='button'
                    variant={isSelected ? 'default' : 'outline'}
                    className='w-full'
                    onClick={() => planForm.setValue('plan', plan)}
                  >
                    {isSelected ? 'Selected' : 'Select'}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Billing Cycle */}
      <FormSection title='Billing Cycle' icon={<Calendar className='w-4 h-4' />}>
        <RadioGroup
          value={selectedCycle}
          onValueChange={value => planForm.setValue('billingCycle', value as unknown)}
        >
          <div className='space-y-3'>
            {billingCycles.map(cycle => {
              const cyclePrice = calculatePricing(selectedPlan, cycle, 1);
              const savings =
                cycle !== 'monthly'
                  ? calculatePricing(selectedPlan, 'monthly', 1).total *
                      (cycle === 'quarterly' ? 3 : 12) -
                    cyclePrice.total
                  : 0;

              return (
                <label
                  key={cycle}
                  className={cn(
                    'flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors',
                    selectedCycle === cycle
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <div className='flex items-center gap-3'>
                    <RadioGroupItem value={cycle} />
                    <div>
                      <div className='font-medium capitalize'>{cycle}</div>
                      <div className='text-sm text-muted-foreground'>
                        ${cyclePrice.total.toFixed(2)}/
                        {cycle === 'monthly' ? 'month' : cycle === 'quarterly' ? 'quarter' : 'year'}
                      </div>
                    </div>
                  </div>

                  {savings > 0 && (
                    <Badge variant='secondary' className='ml-auto'>
                      Save ${savings.toFixed(0)}
                    </Badge>
                  )}
                </label>
              );
            })}
          </div>
        </RadioGroup>
      </FormSection>

      {/* Add-ons */}
      {selectedPlan !== 'free' && (
        <FormSection title='Add-ons' icon={<Package className='w-4 h-4' />}>
          <div className='space-y-3'>
            {[
              { id: 'storage', name: 'Extra Storage (10GB)', price: 5 },
              { id: 'priority', name: 'Priority Support', price: 15 },
              { id: 'branding', name: 'White Label Branding', price: 25 },
            ].map(addon => (
              <label
                key={addon.id}
                className='flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50'
              >
                <div className='flex items-center gap-3'>
                  <input
                    type='checkbox'
                    className='rounded'
                    onChange={e => {
                      const currentAddons = planForm.watch('addons') || [];
                      if ((e.target as HTMLInputElement).checked) {
                        planForm.setValue('addons', [...currentAddons, { ...addon, quantity: 1 }]);
                      } else {
                        planForm.setValue(
                          'addons',
                          currentAddons.filter(a => a.id !== addon.id)
                        );
                      }
                    }}
                  />
                  <span>{addon.name}</span>
                </div>
                <span className='text-muted-foreground'>
                  +${addon.price}/
                  {selectedCycle === 'monthly'
                    ? 'mo'
                    : selectedCycle === 'quarterly'
                      ? 'qtr'
                      : 'yr'}
                </span>
              </label>
            ))}
          </div>
        </FormSection>
      )}

      {/* Promo Code */}
      <FormSection title='Promo Code' icon={<Percent className='w-4 h-4' />}>
        <div className='flex gap-2'>
          <Input {...planForm.register('promoCode')} placeholder='Enter promo code' />
          <Button type='button' variant='outline'>
            Apply
          </Button>
        </div>
      </FormSection>

      {/* Price Summary */}
      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>Order Summary</CardTitle>
        </CardHeader>
        <CardContent className='space-y-2'>
          <div className='flex justify-between'>
            <span>Subtotal</span>
            <span>${pricing.subtotal.toFixed(2)}</span>
          </div>
          {pricing.discount > 0 && (
            <div className='flex justify-between text-green-600'>
              <span>Discount</span>
              <span>-${pricing.discount.toFixed(2)}</span>
            </div>
          )}
          <div className='flex justify-between text-muted-foreground'>
            <span>Tax</span>
            <span>${pricing.tax.toFixed(2)}</span>
          </div>
          <Separator />
          <div className='flex justify-between font-semibold text-lg'>
            <span>Total</span>
            <span>${pricing.total.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      <FormActions
        isSubmitting={isSubmitting}
        submitLabel='Update Plan'
        submitIcon={<ArrowRight className='w-4 h-4' />}
        showCancel={false}
        fullWidth
      />
    </form>
  );

  const renderPaymentTab = () => (
    <form onSubmit={paymentForm.handleSubmit(handlePaymentUpdate)} className='space-y-6'>
      {/* Saved Payment Methods */}
      {savedPaymentMethods.length > 0 && (
        <FormSection title='Saved Payment Methods' icon={<CreditCard className='w-4 h-4' />}>
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
            <div className='space-y-3'>
              {savedPaymentMethods.map(method => (
                <label
                  key={method.id}
                  className={cn(
                    'flex items-center justify-between p-4 rounded-lg border cursor-pointer',
                    paymentMethod === method.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <div className='flex items-center gap-3'>
                    <RadioGroupItem value={method.id} />
                    <CreditCard className='w-5 h-5' />
                    <div>
                      <div className='font-medium'>
                        {method.brand} •••• {method.last4}
                      </div>
                      {method.isDefault && (
                        <Badge variant='secondary' className='mt-1'>
                          Default
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={e => {
                      e.preventDefault();
                      // Handle remove
                    }}
                  >
                    Remove
                  </Button>
                </label>
              ))}

              <label
                className={cn(
                  'flex items-center gap-3 p-4 rounded-lg border cursor-pointer',
                  paymentMethod === 'new'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <RadioGroupItem value='new' />
                <Plus className='w-5 h-5' />
                <span className='font-medium'>Add new payment method</span>
              </label>
            </div>
          </RadioGroup>
        </FormSection>
      )}

      {/* New Payment Method */}
      {(paymentMethod === 'new' || savedPaymentMethods.length === 0) && (
        <>
          <FormSection title='Card Information' icon={<CreditCard className='w-4 h-4' />}>
            <div className='space-y-4'>
              <div>
                <Label htmlFor='cardNumber'>Card Number</Label>
                <div className='relative'>
                  <Input
                    id='cardNumber'
                    {...paymentForm.register('cardNumber')}
                    placeholder='1234 5678 9012 3456'
                    maxLength={19}
                  />
                  {cardType !== 'unknown' && (
                    <div className='absolute right-3 top-1/2 -translate-y-1/2'>
                      <Badge variant='secondary'>{cardType.toUpperCase()}</Badge>
                    </div>
                  )}
                </div>
                {(paymentForm.formState.errors as any)?.cardNumber && (
                  <p className='text-sm text-destructive mt-1'>
                    {(paymentForm.formState.errors as any)?.cardNumber?.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor='cardholderName'>Cardholder Name</Label>
                <Input
                  id='cardholderName'
                  {...paymentForm.register('cardholderName')}
                  placeholder='John Doe'
                />
                {(paymentForm.formState.errors as any)?.cardholderName && (
                  <p className='text-sm text-destructive mt-1'>
                    {(paymentForm.formState.errors as any)?.cardholderName?.message}
                  </p>
                )}
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='expiry'>Expiry Date</Label>
                  <div className='flex gap-2'>
                    <Input
                      {...paymentForm.register('expiryMonth')}
                      placeholder='MM'
                      maxLength={2}
                    />
                    <Input {...paymentForm.register('expiryYear')} placeholder='YY' maxLength={2} />
                  </div>
                  {((paymentForm.formState.errors as any)?.expiryMonth ||
                    (paymentForm.formState.errors as any)?.expiryYear) && (
                    <p className='text-sm text-destructive mt-1'>Invalid expiry date</p>
                  )}
                </div>

                <div>
                  <Label htmlFor='cvv'>CVV</Label>
                  <Input
                    id='cvv'
                    {...paymentForm.register('cvv')}
                    placeholder='123'
                    maxLength={4}
                    type='password'
                  />
                  {(paymentForm.formState.errors as any)?.cvv && (
                    <p className='text-sm text-destructive mt-1'>
                      {(paymentForm.formState.errors as any)?.cvv?.message}
                    </p>
                  )}
                </div>
              </div>

              <div className='flex items-center gap-2'>
                <Switch
                  id='saveCard'
                  checked={paymentForm.watch('saveCard')}
                  onCheckedChange={checked => paymentForm.setValue('saveCard', checked)}
                />
                <Label htmlFor='saveCard' className='cursor-pointer'>
                  Save card for future payments
                </Label>
              </div>
            </div>
          </FormSection>

          <FormSection title='Billing Address' icon={<Building className='w-4 h-4' />}>
            <div className='space-y-4'>
              <FormField
                form={paymentForm}
                name='billingAddress.line1'
                label='Address Line 1'
                required
              />

              <FormField form={paymentForm} name='billingAddress.line2' label='Address Line 2' />

              <div className='grid grid-cols-2 gap-4'>
                <FormField form={paymentForm} name='billingAddress.city' label='City' required />

                <FormField
                  form={paymentForm}
                  name='billingAddress.state'
                  label='State/Province'
                  required
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  form={paymentForm}
                  name='billingAddress.postalCode'
                  label='Postal Code'
                  required
                />

                <FormField
                  form={paymentForm}
                  name='billingAddress.country'
                  label='Country Code'
                  placeholder='US'
                  required
                />
              </div>
            </div>
          </FormSection>
        </>
      )}

      <Alert>
        <Shield className='w-4 h-4' />
        <AlertDescription>
          Your payment information is encrypted and secure. We never store your full card details.
        </AlertDescription>
      </Alert>

      <FormActions
        isSubmitting={isSubmitting}
        submitLabel='Update Payment Method'
        submitIcon={<Lock className='w-4 h-4' />}
        showCancel={false}
        fullWidth
      />
    </form>
  );

  const renderManageTab = () => (
    <div className='space-y-6'>
      {/* Subscription Status */}
      {currentPlan && (
        <Card>
          <CardHeader>
            <CardTitle>Current Subscription</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <p className='text-sm text-muted-foreground'>Plan</p>
                <p className='font-medium capitalize'>{currentPlan.plan}</p>
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>Status</p>
                <Badge variant={currentPlan.status === 'active' ? 'default' : 'secondary'}>
                  {currentPlan.status}
                </Badge>
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>Billing Cycle</p>
                <p className='font-medium capitalize'>{currentPlan.billingCycle}</p>
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>Next Billing</p>
                <p className='font-medium'>{currentPlan.nextBillingDate.toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {currentPlan?.status === 'active' && (
          <>
            <Card
              className='cursor-pointer hover:shadow-md transition-shadow'
              onClick={() => setActiveTab('plan')}
            >
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <TrendingUp className='w-5 h-5' />
                  Upgrade Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-muted-foreground'>Get more features and higher limits</p>
              </CardContent>
            </Card>

            <Card
              className='cursor-pointer hover:shadow-md transition-shadow'
              onClick={() => {
                updateForm.setValue('action', 'pause');
                setShowCancelConfirm(true);
              }}
            >
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Pause className='w-5 h-5' />
                  Pause Subscription
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-muted-foreground'>Temporarily pause your subscription</p>
              </CardContent>
            </Card>
          </>
        )}

        {currentPlan?.status === 'paused' && (
          <Card
            className='cursor-pointer hover:shadow-md transition-shadow'
            onClick={() => {
              updateForm.setValue('action', 'resume');
              updateForm.handleSubmit(handleSubscriptionUpdate)();
            }}
          >
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Play className='w-5 h-5' />
                Resume Subscription
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-sm text-muted-foreground'>Reactivate your paused subscription</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Billing Information */}
      <form onSubmit={billingForm.handleSubmit(handleBillingInfoUpdate)} className='space-y-6'>
        <FormSection title='Billing Information' icon={<Building className='w-4 h-4' />}>
          <FormField form={billingForm} name='companyName' label='Company Name (Optional)' />

          <FormField form={billingForm} name='taxId' label='Tax ID (Optional)' />

          <FormField
            form={billingForm}
            name='billingEmail'
            label='Billing Email'
            type='email'
            required
          />
        </FormSection>

        <FormSection title='Invoice Preferences' icon={<Download className='w-4 h-4' />}>
          <div>
            <Label>Invoice Frequency</Label>
            <SearchSelect
              options={[
                { value: 'per-transaction', label: 'Per Transaction' },
                { value: 'monthly', label: 'Monthly Summary' },
                { value: 'quarterly', label: 'Quarterly Summary' },
              ]}
              value={billingForm.watch('invoicePreferences.frequency')}
              onChange={value =>
                billingForm.setValue('invoicePreferences.frequency', value as unknown)
              }
            />
          </div>

          <div>
            <Label>Invoice Format</Label>
            <SearchSelect
              options={[
                { value: 'pdf', label: 'PDF' },
                { value: 'csv', label: 'CSV' },
                { value: 'xml', label: 'XML' },
              ]}
              value={billingForm.watch('invoicePreferences.format')}
              onChange={value =>
                billingForm.setValue('invoicePreferences.format', value as unknown)
              }
            />
          </div>

          <div className='flex items-center gap-2'>
            <Switch
              id='includeDetails'
              checked={billingForm.watch('invoicePreferences.includeDetails')}
              onCheckedChange={checked =>
                billingForm.setValue('invoicePreferences.includeDetails', checked)
              }
            />
            <Label htmlFor='includeDetails' className='cursor-pointer'>
              Include detailed transaction information
            </Label>
          </div>
        </FormSection>

        <FormActions
          isSubmitting={isSubmitting}
          submitLabel='Update Billing Info'
          submitIcon={<Save className='w-4 h-4' />}
          showCancel={false}
        />
      </form>

      {/* Danger Zone */}
      <Card className='border-destructive/50'>
        <CardHeader>
          <CardTitle className='text-destructive flex items-center gap-2'>
            <AlertTriangle className='w-5 h-5' />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant='destructive'
            onClick={() => {
              updateForm.setValue('action', 'cancel');
              setShowCancelConfirm(true);
            }}
          >
            Cancel Subscription
          </Button>
        </CardContent>
      </Card>

      {/* Cancel Confirmation Dialog */}
      {showCancelConfirm && (
        <Card className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
          <Card className='w-full max-w-md mx-4'>
            <CardHeader>
              <CardTitle>
                {updateForm.watch('action') === 'cancel'
                  ? 'Cancel Subscription?'
                  : 'Pause Subscription?'}
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <p className='text-muted-foreground'>
                {updateForm.watch('action') === 'cancel'
                  ? 'Are you sure you want to cancel your subscription? You will lose access to premium features.'
                  : 'Your subscription will be paused and you can resume it anytime.'}
              </p>

              <div>
                <Label>Reason (Optional)</Label>
                <Textarea
                  {...updateForm.register('reason')}
                  placeholder='Help us improve by sharing your reason...'
                  rows={3}
                />
              </div>

              <div className='flex gap-3'>
                <Button
                  variant='outline'
                  onClick={() => setShowCancelConfirm(false)}
                  className='flex-1'
                >
                  Keep Subscription
                </Button>
                <Button
                  variant='destructive'
                  onClick={() => updateForm.handleSubmit(handleSubscriptionUpdate)()}
                  className='flex-1'
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Processing...' : 'Confirm'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </Card>
      )}
    </div>
  );

  return (
    <Card className={cn('w-full max-w-4xl mx-auto', className)}>
      <CardHeader>
        <CardTitle>Subscription Management</CardTitle>
        <CardDescription>
          Manage your subscription plan, payment methods, and billing preferences
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className='grid w-full grid-cols-3'>
            <TabsTrigger value='plan'>Plan</TabsTrigger>
            <TabsTrigger value='payment'>Payment</TabsTrigger>
            <TabsTrigger value='manage'>Manage</TabsTrigger>
          </TabsList>

          <div className='mt-6'>
            <TabsContent value='plan' className='mt-0'>
              {renderPlanTab()}
            </TabsContent>

            <TabsContent value='payment' className='mt-0'>
              {renderPaymentTab()}
            </TabsContent>

            <TabsContent value='manage' className='mt-0'>
              {renderManageTab()}
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );

};

export default SubscriptionForm;
