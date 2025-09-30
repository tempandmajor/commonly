import { Card, CardContent } from '@/components/ui/card';
import { Coins } from 'lucide-react';

interface PlatformCreditOptionProps {
  balance: number;
  amount: number;
}

const PlatformCreditOption = ({ balance, amount }: PlatformCreditOptionProps) => {
  const remainingBalance = balance - amount;

  return (
    <Card className='border-blue-200 bg-blue-50'>
      <CardContent className='p-4'>
        <div className='flex items-center gap-2 mb-2'>
          <Coins className='h-4 w-4 text-blue-600' />
          <span className='font-medium text-blue-900'>Using Platform Credits</span>
        </div>
        <div className='space-y-1 text-sm'>
          <div className='flex justify-between'>
            <span>Current Balance:</span>
            <span>${balance.toFixed(2)}</span>
          </div>
          <div className='flex justify-between'>
            <span>Purchase Amount:</span>
            <span>-${amount.toFixed(2)}</span>
          </div>
          <div className='flex justify-between font-medium border-t pt-1'>
            <span>Remaining Balance:</span>
            <span>${remainingBalance.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlatformCreditOption;
