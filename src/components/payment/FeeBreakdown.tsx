import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Info, Crown } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useFeeCalculation } from '@/hooks/payment/useFeeCalculation';

interface FeeBreakdownProps {
  amount: number;
  isPlatformFee?: boolean | undefined;
  includeStripeFees?: boolean | undefined;
  tax?: number | undefined;
  tipAmount?: number | undefined;
  discount?: number | undefined;
  showCreatorEarnings?: boolean | undefined;
  title?: string | undefined;
  compact?: boolean | undefined;
  isCreatorProgram?: boolean | undefined;
}

export const FeeBreakdown: React.FC<FeeBreakdownProps> = ({
  amount,
  isPlatformFee = false,
  includeStripeFees = true,
  tax = 0,
  tipAmount = 0,
  discount = 0,
  showCreatorEarnings = false,
  title = 'Fee Breakdown',
  compact = false,
  isCreatorProgram = false,
}) => {
  const { feeBreakdown, formattedBreakdown, creatorProgramBenefit } = useFeeCalculation({
    amount,
    isPlatformFee,
    includeStripeFees,
    tax,
    tipAmount,
    discount,
    isCreatorProgram,
  });

  if (compact) {
    return (
      <div className='space-y-2'>
        <div className='flex justify-between items-center'>
          <span className='text-sm text-muted-foreground'>Subtotal</span>
          <span className='text-sm'>{formattedBreakdown.subtotal}</span>
        </div>

        {!isPlatformFee && feeBreakdown.platformFee > 0 && (
          <div className='flex justify-between items-center'>
            <div className='flex items-center gap-2'>
              <span className='text-sm text-muted-foreground'>
                Platform fee ({feeBreakdown.platformFeePercentage}%)
              </span>
              {isCreatorProgram && (
                <Badge variant='secondary' className='text-xs bg-yellow-100 text-yellow-800'>
                  <Crown className='w-3 h-3 mr-1' />
                  Creator
                </Badge>
              )}
            </div>
            <span className='text-sm'>{formattedBreakdown.platformFee}</span>
          </div>
        )}

        {includeStripeFees && feeBreakdown.stripeFee > 0 && (
          <div className='flex justify-between items-center'>
            <span className='text-sm text-muted-foreground'>Processing fee</span>
            <span className='text-sm'>{formattedBreakdown.stripeFee}</span>
          </div>
        )}

        {tax > 0 && (
          <div className='flex justify-between items-center'>
            <span className='text-sm text-muted-foreground'>Tax</span>
            <span className='text-sm'>{formattedBreakdown.tax}</span>
          </div>
        )}

        {tipAmount > 0 && (
          <div className='flex justify-between items-center'>
            <span className='text-sm text-muted-foreground'>Tip</span>
            <span className='text-sm'>{formattedBreakdown.tipAmount}</span>
          </div>
        )}

        {discount > 0 && (
          <div className='flex justify-between items-center'>
            <span className='text-sm text-muted-foreground'>Discount</span>
            <span className='text-sm text-green-600'>-{formattedBreakdown.discount}</span>
          </div>
        )}

        <Separator />

        <div className='flex justify-between items-center font-medium'>
          <span>Total</span>
          <span>{formattedBreakdown.finalTotal}</span>
        </div>

        {showCreatorEarnings && (
          <div className='flex justify-between items-center text-sm text-muted-foreground border-t pt-2'>
            <span>Creator receives</span>
            <span className='font-medium'>{formattedBreakdown.netToCreator}</span>
          </div>
        )}

        {/* Show Creator Program benefit for non-members */}
        {!isCreatorProgram && creatorProgramBenefit && creatorProgramBenefit.savings > 0 && (
          <div className='mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md'>
            <div className='flex items-center gap-1 text-xs text-yellow-800'>
              <Crown className='w-3 h-3' />
              <span className='font-medium'>Creator Program:</span>
              <span>
                Save ${creatorProgramBenefit.savings.toFixed(2)} (
                {creatorProgramBenefit.savingsPercentage.toFixed(1)}%)
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-lg'>{title}</CardTitle>
          {isCreatorProgram && (
            <Badge className='bg-yellow-100 text-yellow-800'>
              <Crown className='w-3 h-3 mr-1' />
              Creator Program
            </Badge>
          )}
        </div>
        {!isPlatformFee && isCreatorProgram && (
          <div className='text-sm text-green-600 font-medium'>
            ✨ {feeBreakdown.platformFeePercentage}% Platform Fee (5% savings vs regular users)
          </div>
        )}
      </CardHeader>
      <CardContent className='space-y-3'>
        <div className='space-y-2'>
          <div className='flex justify-between items-center'>
            <span className='text-muted-foreground'>Subtotal</span>
            <span className='font-medium'>{formattedBreakdown.subtotal}</span>
          </div>

          {!isPlatformFee && feeBreakdown.platformFee > 0 && (
            <div className='flex justify-between items-center'>
              <span className='text-muted-foreground'>
                Platform fee ({feeBreakdown.platformFeePercentage}%)
              </span>
              <span className='font-medium'>{formattedBreakdown.platformFee}</span>
            </div>
          )}

          {includeStripeFees && feeBreakdown.stripeFee > 0 && (
            <div className='flex justify-between items-center'>
              <span className='text-muted-foreground'>Processing fee</span>
              <span className='font-medium'>{formattedBreakdown.stripeFee}</span>
            </div>
          )}

          {tax > 0 && (
            <div className='flex justify-between items-center'>
              <span className='text-muted-foreground'>Tax</span>
              <span className='font-medium'>{formattedBreakdown.tax}</span>
            </div>
          )}

          {tipAmount > 0 && (
            <div className='flex justify-between items-center'>
              <span className='text-muted-foreground'>Tip</span>
              <span className='font-medium'>{formattedBreakdown.tipAmount}</span>
            </div>
          )}

          {discount > 0 && (
            <div className='flex justify-between items-center'>
              <span className='text-muted-foreground'>Discount</span>
              <span className='font-medium text-green-600'>-{formattedBreakdown.discount}</span>
            </div>
          )}
        </div>

        <Separator />

        <div className='flex justify-between items-center text-lg font-semibold'>
          <span>Total</span>
          <span>{formattedBreakdown.finalTotal}</span>
        </div>

        {showCreatorEarnings && (
          <div className='flex justify-between items-center text-sm text-muted-foreground border-t pt-3'>
            <span>Creator receives</span>
            <span className='font-medium'>{formattedBreakdown.netToCreator}</span>
          </div>
        )}

        {/* Show Creator Program benefit for non-members */}
        {!isCreatorProgram && creatorProgramBenefit && creatorProgramBenefit.savings > 0 && (
          <Alert className='border-yellow-200 bg-yellow-50'>
            <Crown className='h-4 w-4 text-yellow-600' />
            <AlertDescription className='text-sm'>
              <div className='font-medium text-yellow-800'>Join Creator Program and save!</div>
              <div className='text-yellow-700'>
                You could earn ${creatorProgramBenefit.savings.toFixed(2)} more (
                {creatorProgramBenefit.savingsPercentage.toFixed(1)}% additional earnings) with our
                15% platform fee vs 20% for regular users.
              </div>
            </AlertDescription>
          </Alert>
        )}

        {!isPlatformFee && (
          <Alert>
            <Info className='h-4 w-4' />
            <AlertDescription className='text-sm'>
              Platform fees help us maintain and improve the service. Processing fees are charged by
              our payment provider.
              {isCreatorProgram && ' As a Creator Program member, you enjoy reduced platform fees!'}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default FeeBreakdown;
