import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/providers/AuthProvider';
import { createPromotion } from '@/services/promotionService';
import { calculatePromotionEstimate, estimateReach } from '@/services/promotionUtils';
import { toast } from 'sonner';
import { promotionFormSchema, PromotionFormValues } from './form/types';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { BasicPromotionInfo } from './form/BasicPromotionInfo';
import { BudgetScheduling } from './form/BudgetScheduling';
import { PricingDelivery } from './form/PricingDelivery';
import { TargetAudience } from './form/TargetAudience';
import { PromotionSummary } from './form/PromotionSummary';
import { Loader2, ArrowRight, CreditCard, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CreatePromotionFormProps {
  availableCredits: number;
  hasCredits: boolean;
  isLoadingCredits?: boolean | undefined;
}

export const CreatePromotionForm: React.FC<CreatePromotionFormProps> = ({
  availableCredits,
  hasCredits,
  isLoadingCredits = false,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [estimatedReach, setEstimatedReach] = useState(0);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [needsPaymentMethod, setNeedsPaymentMethod] = useState(false);

  const form = useForm<PromotionFormValues>({
    resolver: zodResolver(promotionFormSchema),
    defaultValues: {
      targetType: 'event',
      title: '',
      description: '',
      budget: 100,
      dailyBudgetLimit: 20,
      startDate: new Date(),
      bidAmount: 0.05,
      deliveryMethod: 'feed',
      aiDeliveryTone: 'casual',
      audience: [],
    },
  });

  const watchBudget = form.watch('budget');
  const watchAudience = form.watch('audience');

  useEffect(() => {
    if (watchBudget) {
      const reach = estimateReach(watchBudget, 0.05, 'per-view', {
        interests: watchAudience || [],
      });
      setEstimatedReach(reach);
      const cost = calculatePromotionEstimate(reach, Math.floor(reach * 0.1));
      setEstimatedCost(cost);

      if (!isLoadingCredits && watchBudget > availableCredits) {
        setNeedsPaymentMethod(true);
      } else {
        setNeedsPaymentMethod(false);
      }
    }
  }, [watchBudget, watchAudience, availableCredits, isLoadingCredits]);

  const onSubmit = async (data: PromotionFormValues) => {
    if (!user) {
      toast.error('You need to be logged in to create a promotion');
      return;
    }

    setIsLoading(true);

    try {
      const promotionData = {
        userId: user.id,
        stats: {
          impressions: 0,
          clicks: 0,
          conversions: 0,
          spent: 0,
          engagements: 0,
        },
        createdBy: user.id,
        type: data.targetType,
        status: 'pending' as 'pending' | 'active' | 'completed' | 'rejected',
        title: data.title,
        description: data.description,
        budget: data.budget,
        dailyBudgetLimit: data.dailyBudgetLimit,
        startDate: data.startDate instanceof Date ? data.startDate.toISOString() : data.startDate,
        endDate: data.endDate
          ? data.endDate instanceof Date
            ? data.endDate.toISOString()
            : data.endDate
          : null,
        targetId: data.targetId || '',
        targetAudience: data.audience?.join(', ') || '',
        bidAmount: data.bidAmount || 0.05,
        audience: data.audience || [],
        deliveryMethod: data.deliveryMethod,
        aiDeliveryTone: data.aiDeliveryTone,
        ageRangeMin: data.ageRangeMin,
        ageRangeMax: data.ageRangeMax,
        locationTargeting: data.locationTargeting || selectedLocations,
        interestTags: data.interestTags,
      };

      const result = await createPromotion(promotionData);

      if (result) {
        toast.success('Promotion created successfully!');
        navigate('/dashboard?tab=promotions');
      } else {
        toast.error('Failed to create promotion');
      }
    } catch (error) {
      toast.error('An error occurred while creating the promotion');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className='space-y-8'>
          {/* Payment method alert */}
          {needsPaymentMethod && (
            <Alert variant='destructive'>
              <AlertTriangle className='h-4 w-4' />
              <AlertDescription>
                Your budget (${watchBudget}) exceeds your available credits ($
                {availableCredits.toFixed(2)}).
                {!hasCredits
                  ? ' You have no credits available.'
                  : ' The remaining amount will be charged to your payment method.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Credit usage info */}
          {hasCredits && (
            <div className='flex items-center justify-between p-4 border rounded-md bg-muted/30'>
              <div className='flex items-center'>
                <CreditCard className='h-5 w-5 mr-2 text-primary' />
                <div>
                  <p className='font-medium'>Credits will be used first</p>
                  <p className='text-sm text-muted-foreground'>
                    Available: ${availableCredits.toFixed(2)}
                  </p>
                </div>
              </div>
              <div>
                {watchBudget <= availableCredits ? (
                  <span className='text-sm text-green-600 font-medium'>Covered by credits</span>
                ) : (
                  <span className='text-sm text-amber-600 font-medium'>
                    ${Math.min(availableCredits, watchBudget).toFixed(2)} from credits + $
                    {(watchBudget - Math.min(availableCredits, watchBudget)).toFixed(2)} charged
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Form components */}
          <BasicPromotionInfo form={form} isLoading={isLoading} />
          <BudgetScheduling form={form} isLoading={isLoading} />
          <PricingDelivery form={form} isLoading={isLoading} />
          <TargetAudience
            form={form}
            isLoading={isLoading}
            selectedLocations={selectedLocations}
            setSelectedLocations={setSelectedLocations}
          />
          <PromotionSummary
            budget={watchBudget}
            estimatedReach={estimatedReach}
            estimatedCost={estimatedCost}
          />

          <div className='flex justify-end'>
            <Button type='submit' disabled={isLoading} size='lg'>
              {isLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Creating Promotion...
                </>
              ) : (
                <>
                  Create Promotion
                  <ArrowRight className='ml-2 h-4 w-4' />
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};
