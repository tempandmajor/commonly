import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Transaction } from '@/services/wallet/types';
import { format } from 'date-fns';
import { Coins } from 'lucide-react';
import { TransactionTypeIcon } from './components/transactions/TransactionTypeIcon';
import { TransactionStatusBadge } from './components/transactions/TransactionStatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/utils/currency';

interface PlatformCreditTabProps {
  formattedBalance: {
    totalBalance: string;
    availableBalance: string;
    pendingBalance: string;
    platformCredit: string;
    referralEarnings: string;
  };
  platformCreditTxs: Transaction[];
}

const PlatformCreditTab: React.FC<PlatformCreditTabProps> = ({
  formattedBalance,
  platformCreditTxs,
}) => {
  if (!platformCreditTxs) {
    return <Skeleton className='w-full h-64' />;
  }

  return (
    <div className='space-y-6'>
      <Card className='bg-gradient-to-r from-violet-500 to-purple-500 text-white'>
        <CardHeader className='pb-2'>
          <CardTitle className='text-2xl font-bold'>Platform Credit</CardTitle>
          <CardDescription className='text-violet-100'>
            Credits earned on the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='text-4xl font-bold'>{formattedBalance.platformCredit}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center'>
            <Coins className='mr-2 h-5 w-5' />
            Credit History
          </CardTitle>
          <CardDescription>Your platform credit history</CardDescription>
        </CardHeader>
        <CardContent>
          {platformCreditTxs.length === 0 ? (
            <div className='text-center py-6 text-muted-foreground'>No platform credits found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {platformCreditTxs.map(tx => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      {typeof tx.createdAt === 'string'
                        ? format(new Date(tx.createdAt), 'MMM dd, yyyy')
                        : format(tx.createdAt, 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>{tx.description}</TableCell>
                    <TableCell className='flex items-center'>
                      <TransactionTypeIcon type={tx.type} />
                      <span className='ml-1'>{formatCurrency(tx.amount, tx.currency)}</span>
                    </TableCell>
                    <TableCell>
                      <TransactionStatusBadge status={tx.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PlatformCreditTab;
