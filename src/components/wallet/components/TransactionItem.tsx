import React from 'react';
import { format } from 'date-fns';
import { Transaction, TransactionType } from '@/services/wallet/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownLeft, RefreshCcw, CreditCard } from 'lucide-react';

interface TransactionItemProps {
  transaction: Transaction;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({ transaction }) => {
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const getTypeLabel = (type: TransactionType) => {
    switch (type) {
      case 'deposit':
        return 'Deposit';
      case 'withdrawal':
        return 'Withdrawal';
      case 'transfer':
        return 'Transfer';
      case 'refund':
        return 'Refund';
      case 'platform_credit':
        return 'Platform Credit';
      case 'referral':
        return 'Referral';
      case 'referral_earning':
        return 'Referral Earning';
      case 'payment':
        return 'Payment';
      case 'sponsorship_earning':
        return 'Sponsorship';
      case 'fee':
        return 'Fee';
      case 'promotion':
        return 'Promotion';
      case 'credit':
        return 'Credit';
      default:
        return type;
    }
  };

  const getIcon = (type: TransactionType) => {
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
      return <ArrowDownLeft className='h-5 w-5 text-green-500' />;
    } else if (['withdrawal', 'transfer', 'fee'].includes(type)) {
      return <ArrowUpRight className='h-5 w-5 text-red-500' />;
    } else if (type === 'referral') {
      return <RefreshCcw className='h-5 w-5 text-blue-500' />;
    } else {
      return <CreditCard className='h-5 w-5 text-gray-500' />;
    }
  };

  return (
    <Card className='mb-4'>
      <CardContent className='p-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-4'>
            <div className='rounded-full p-2 bg-gray-100'>{getIcon(transaction.type)}</div>
            <div>
              <h3 className='font-medium'>{transaction.description}</h3>
              <p className='text-sm text-gray-500'>
                {typeof transaction.createdAt === 'string'
                  ? format(new Date(transaction.createdAt), 'MMM dd, yyyy')
                  : format(transaction.createdAt, 'MMM dd, yyyy')}
              </p>
            </div>
          </div>
          <div className='text-right'>
            <div
              className={`font-semibold ${['deposit', 'platform_credit', 'referral_earning', 'refund', 'credit', 'sponsorship_earning'].includes(transaction.type) ? 'text-green-600' : 'text-red-600'}`}
            >
              {[
                'deposit',
                'platform_credit',
                'referral_earning',
                'refund',
                'credit',
                'sponsorship_earning',
              ].includes(transaction.type)
                ? '+'
                : '-'}
              {formatCurrency(transaction.amount, transaction.currency)}
            </div>
            <Badge
              variant={
                transaction.status === 'completed'
                  ? 'default'
                  : transaction.status === 'pending'
                    ? 'outline'
                    : 'destructive'
              }
              className='mt-1'
            >
              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
