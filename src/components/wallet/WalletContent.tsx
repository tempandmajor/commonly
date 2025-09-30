import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';

interface Transaction {
  id: string;
  amount_in_cents: number;
  description: string;
  transaction_type: string;
  created_at: string;
  status: string;
}

interface WalletContentProps {
  balance: number;
  transactions: Transaction[];
  isLoading?: boolean | undefined;
}

const WalletContent: React.FC<WalletContentProps> = ({
  balance,
  transactions,
  isLoading = false,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-2'>
        <Wallet className='h-6 w-6' />
        <h2 className='text-2xl font-bold'>Wallet</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Balance</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className='h-10 w-32' />
          ) : (
            <div className='text-3xl font-bold'>{formatCurrency(balance)}</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <div className='rounded-lg border'>
          {isLoading ? (
            <div className='p-4 space-y-3'>
              <Skeleton className='h-12 w-full' />
              <Skeleton className='h-12 w-full' />
              <Skeleton className='h-12 w-full' />
            </div>
          ) : transactions.length === 0 ? (
            <p className='p-4 text-center text-gray-500'>No transactions to display</p>
          ) : (
            <div className='space-y-4'>
              {transactions.map(transaction => (
                <div
                  key={transaction.id}
                  className='flex items-center justify-between p-4 border-b last:border-b-0'
                >
                  <div className='flex items-center gap-3'>
                    {transaction.transaction_type === 'credit' ||
                    transaction.transaction_type === 'deposit' ? (
                      <TrendingUp className='h-5 w-5 text-green-500' />
                    ) : (
                      <TrendingDown className='h-5 w-5 text-red-500' />
                    )}
                    <div>
                      <p className='font-medium'>{transaction.description}</p>
                      <p className='text-sm text-gray-500'>
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-3'>
                    <span
                      className={`font-semibold ${['credit', 'deposit'].includes(transaction.transaction_type) ? 'text-green-500' : 'text-red-500'}`}
                    >
                      {['credit', 'deposit'].includes(transaction.transaction_type) ? '+' : '-'}{' '}
                      {formatCurrency(transaction.amount_in_cents / 100)}
                    </span>
                    <Badge
                      variant={
                        transaction.status === 'completed'
                          ? 'outline'
                          : transaction.status === 'pending'
                            ? 'secondary'
                            : 'destructive'
                      }
                    >
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default WalletContent;
