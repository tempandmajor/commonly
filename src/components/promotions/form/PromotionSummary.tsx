import { AlertTriangle } from 'lucide-react';
import { PromotionSummaryProps } from './types';

export const PromotionSummary = ({
  estimatedReach,
  estimatedCost,
  budget,
}: PromotionSummaryProps) => {
  return (
    <div className='bg-muted/50 rounded-lg p-4 space-y-3'>
      <h4 className='font-medium'>Promotion Summary</h4>
      <div className='space-y-2'>
        <div className='flex justify-between text-sm'>
          <span className='text-muted-foreground'>Estimated Reach:</span>
          <span className='font-medium'>{estimatedReach.toLocaleString()} people</span>
        </div>
        <div className='flex justify-between text-sm'>
          <span className='text-muted-foreground'>Estimated Cost:</span>
          <span className='font-medium'>up to ${estimatedCost.toFixed(2)}</span>
        </div>
        <div className='flex justify-between text-sm'>
          <span className='text-muted-foreground'>Budget Cap:</span>
          <span className='font-medium'>${budget.toFixed(2)}</span>
        </div>
      </div>

      <div className='pt-2 flex items-start gap-2 text-xs text-muted-foreground'>
        <AlertTriangle className='h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0' />
        <p>
          You will be charged based on actual performance: $5 per 1,000 impressions and $0.50 per
          engagement (likes, comments, shares, RSVPs).
        </p>
      </div>
    </div>
  );
};
