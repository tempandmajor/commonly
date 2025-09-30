import { DollarSign, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/utils/currency';

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  date: Date;
}

interface PlatformCreditProps {
  platformCredit: number;
  transactions: Transaction[];
  customAmount: string;
  processingCredit: boolean;
  onCustomAmountChange: (amount: string) => void;
  onAddCredit: (amount: number | string) => void;
}

const PlatformCredit = ({
  platformCredit,
  transactions,
  customAmount,
  processingCredit,
  onCustomAmountChange,
  onAddCredit,
}: PlatformCreditProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Credit</CardTitle>
        <CardDescription>Manage your platform credit balance</CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='rounded-md border p-6 text-center'>
          <p className='text-sm text-muted-foreground'>Available Balance</p>
          <p className='text-4xl font-bold mt-2'>{formatCurrency(platformCredit)}</p>
        </div>

        <div className='space-y-4'>
          <h3 className='text-lg font-medium'>Recent Transactions</h3>
          {transactions.length > 0 ? (
            <div className='space-y-2'>
              {transactions.map(tx => (
                <div
                  key={tx.id}
                  className='rounded-md border p-3 flex justify-between items-center'
                >
                  <div className='flex items-center'>
                    <div
                      className={`${tx.type === 'credit' ? 'bg-green-100' : 'bg-amber-100'} p-2 rounded-full mr-3`}
                    >
                      <DollarSign
                        className={`h-4 w-4 ${tx.type === 'credit' ? 'text-green-600' : 'text-amber-600'}`}
                      />
                    </div>
                    <div>
                      <p className='font-medium'>{tx.description}</p>
                      <p className='text-xs text-muted-foreground'>
                        <Clock className='inline h-3 w-3 mr-1' />
                        {tx.date.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p
                    className={
                      tx.type === 'credit'
                        ? 'text-green-600 font-medium'
                        : 'text-amber-600 font-medium'
                    }
                  >
                    {tx.type === 'credit' ? '+' : '-'}
                    {formatCurrency(tx.amount)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className='rounded-md border border-dashed p-6 text-center'>
              <p className='text-muted-foreground'>No transactions yet</p>
            </div>
          )}
        </div>

        <div className='space-y-2'>
          <h3 className='text-lg font-medium'>Add Credit</h3>
          <div className='flex flex-wrap gap-2'>
            {[10, 25, 50, 100].map(amount => (
              <Button
                key={amount}
                variant='outline'
                size='lg'
                className='flex-1'
                onClick={() => onAddCredit(amount)}
                disabled={processingCredit}
              >
                {formatCurrency(amount)}
              </Button>
            ))}
          </div>
          <div className='flex items-end gap-2 mt-4'>
            <div className='flex-1'>
              <Label htmlFor='custom-amount'>Custom Amount</Label>
              <div className='flex items-center mt-1'>
                <span className='bg-muted px-3 py-2 rounded-l-md border-y border-l'>$</span>
                <Input
                  id='custom-amount'
                  type='text'
                  placeholder='0.00'
                  className='rounded-l-none'
                  value={customAmount}
                  onChange={e => onCustomAmountChange((e.target as HTMLInputElement).value)}
                />
              </div>
            </div>
            <Button
              className='mb-px'
              onClick={() => onAddCredit(customAmount)}
              disabled={processingCredit}
            >
              {processingCredit ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Processing...
                </>
              ) : (
                'Add Credit'
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlatformCredit;
