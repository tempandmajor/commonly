import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { DollarSign } from 'lucide-react';

interface SubscriptionPricingProps {
  subscriptionInterval: 'monthly' | 'yearly';
  monthlyPrice: string;
  yearlyPrice: string;
  onIntervalChange: (interval: 'monthly' | 'yearly') => void;
  onMonthlyPriceChange: (price: string) => void;
  onYearlyPriceChange: (price: string) => void;
}

const SubscriptionPricing = ({
  subscriptionInterval,
  monthlyPrice,
  yearlyPrice,
  onIntervalChange,
  onMonthlyPriceChange,
  onYearlyPriceChange,
}: SubscriptionPricingProps) => {
  const yearlySavings = (parseFloat(monthlyPrice) * 12 - parseFloat(yearlyPrice)).toFixed(2);

  return (
    <div className='grid gap-4 md:grid-cols-2'>
      <div className='space-y-2'>
        <Label htmlFor='monthly-price'>Monthly Price ($)</Label>
        <div className='relative'>
          <DollarSign className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
          <Input
            id='monthly-price'
            type='number'
            min='0'
            step='0.01'
            className='pl-9'
            value={monthlyPrice}
            onChange={e => onMonthlyPriceChange((e.target as HTMLInputElement).value)}
          />
        </div>
      </div>

      <div className='space-y-2'>
        <Label htmlFor='yearly-price'>Yearly Price ($)</Label>
        <div className='relative'>
          <DollarSign className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
          <Input
            id='yearly-price'
            type='number'
            min='0'
            step='0.01'
            className='pl-9'
            value={yearlyPrice}
            onChange={e => onYearlyPriceChange((e.target as HTMLInputElement).value)}
          />
        </div>
        <div className='flex items-center space-x-2'>
          <Switch
            id='subscription-interval'
            checked={subscriptionInterval === 'yearly'}
            onCheckedChange={checked => onIntervalChange(checked ? 'yearly' : 'monthly')}
          />
          <Label htmlFor='subscription-interval'>Bill yearly (save ${yearlySavings})</Label>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPricing;
