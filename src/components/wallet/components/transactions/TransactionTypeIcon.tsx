import { ArrowDownIcon, ArrowUpIcon, CreditCardIcon, RefreshCcwIcon } from 'lucide-react';
import { TransactionType } from '@/services/wallet/types';

interface TransactionTypeIconProps {
  type: TransactionType;
}

export const TransactionTypeIcon = ({ type }: TransactionTypeIconProps) => {
  if (
    [
      'deposit',
      'platform_credit',
      'referral_earning',
      'credit',
      'refund',
      'sponsorship_earning',
    ].includes(type)
  ) {
    return <ArrowDownIcon className='h-4 w-4 text-green-500' />;
  }

  if (['withdrawal', 'transfer', 'fee', 'payment'].includes(type)) {
    return <ArrowUpIcon className='h-4 w-4 text-red-500' />;
  }

  if (type === 'referral') {
    return <RefreshCcwIcon className='h-4 w-4 text-blue-500' />;
  }

  return <CreditCardIcon className='h-4 w-4 text-gray-500' />;
};
