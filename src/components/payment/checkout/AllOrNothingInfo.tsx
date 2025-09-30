import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Progress } from '@/components/ui/progress';

interface AllOrNothingInfoProps {
  deadline?: string | undefined;
  goalAmount?: number | undefined;
  currentAmount?: number | undefined;
}

const AllOrNothingInfo: React.FC<AllOrNothingInfoProps> = ({
  deadline,
  goalAmount,
  currentAmount = 0,
}) => {
  const formattedDeadline = deadline
    ? format(new Date(deadline), 'MMMM d, yyyy')
    : 'the campaign deadline';
  const percentComplete = goalAmount ? Math.round((currentAmount / goalAmount) * 100) : 0;
  const formattedGoal = goalAmount ? `$${goalAmount.toLocaleString()}` : 'its funding goal';
  const formattedCurrent = `$${currentAmount.toLocaleString()}`;
  const remaining = goalAmount
    ? `$${goalAmount - currentAmount}.toLocaleString()}`
    : 'unknown amount';

  return (
    <Alert variant='default' className='bg-muted mb-4'>
      <InfoIcon className='h-4 w-4' />
      <AlertTitle>All or Nothing Event</AlertTitle>
      <AlertDescription>
        <p>
          This is an all-or-nothing event. By supporting this event, you're making a pledge to
          purchase a ticket if the event reaches its funding goal of {formattedGoal} by{' '}
          {formattedDeadline}.
        </p>

        {goalAmount && (
          <div className='mt-2 mb-1'>
            <Progress value={percentComplete} className='h-2' indicatorColor='bg-green-600' />
            <div className='flex justify-between text-xs mt-1'>
              <span>Current: {formattedCurrent}</span>
              <span>{percentComplete}% of goal</span>
            </div>
          </div>
        )}

        <p className='mt-2'>
          Your payment method will be authorized but <strong>not charged</strong> until the event
          reaches its goal. If the goal isn't met by the deadline, your pledge will be automatically
          canceled and you won't be charged.
        </p>

        <p className='mt-2 text-sm font-medium'>
          {goalAmount
            ? `${remaining} still needed to fund this event`
            : 'Support this event today!'}
        </p>
      </AlertDescription>
    </Alert>
  );
};

export default AllOrNothingInfo;
