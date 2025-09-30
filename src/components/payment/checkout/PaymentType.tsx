import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CreditCard, Coins } from 'lucide-react';

interface PaymentTypeSelectProps {
  paymentMethod: 'stripe' | 'platform-credit';
  setPaymentMethod: (method: 'stripe' | 'platform-credit') => void;
  canUsePlatformCredit: boolean;
  platformCreditBalance: number;
}

const PaymentType = ({
  paymentMethod,
  setPaymentMethod,
  canUsePlatformCredit,
  platformCreditBalance,
}: PaymentTypeSelectProps) => {
  return (
    <div className='space-y-3'>
      <Label className='text-base font-medium'>Payment Method</Label>
      <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className='space-y-2'>
        <div className='flex items-center space-x-2 p-3 border rounded-lg'>
          <RadioGroupItem value='stripe' id='stripe' />
          <Label htmlFor='stripe' className='flex items-center gap-2 cursor-pointer flex-1'>
            <CreditCard className='h-4 w-4' />
            Credit/Debit Card
          </Label>
        </div>

        {canUsePlatformCredit && (
          <div className='flex items-center space-x-2 p-3 border rounded-lg'>
            <RadioGroupItem value='platform-credit' id='platform-credit' />
            <Label
              htmlFor='platform-credit'
              className='flex items-center gap-2 cursor-pointer flex-1'
            >
              <Coins className='h-4 w-4' />
              Platform Credits (${platformCreditBalance.toFixed(2)} available)
            </Label>
          </div>
        )}
      </RadioGroup>
    </div>
  );
};

export default PaymentType;
