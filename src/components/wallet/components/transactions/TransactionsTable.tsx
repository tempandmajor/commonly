import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { Transaction, TransactionType } from '@/services/wallet/types';
import { TransactionTypeIcon } from './TransactionTypeIcon';
import { TransactionStatusBadge } from './TransactionStatusBadge';

interface TransactionsTableProps {
  transactions: Transaction[];
}

export const TransactionsTable: React.FC<TransactionsTableProps> = ({ transactions }) => {
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const getTypeLabel = (type: TransactionType): string => {
    switch (type) {
      case 'deposit':
        return 'Deposit';
      case 'withdrawal':
        return 'Withdrawal';
      case 'transfer':
        return 'Transfer';
      case 'refund':
        return 'Refund';
      case 'payment':
        return 'Payment';
      case 'fee':
        return 'Fee';
      case 'promotion':
        return 'Promotion';
      case 'credit':
        return 'Credit';
      case 'platform_credit':
        return 'Platform Credit';
      case 'referral':
        return 'Referral';
      case 'referral_earning':
        return 'Referral Earning';
      case 'sponsorship_earning':
        return 'Sponsorship';
      default:
        return type;
    }
  };

  return (
    <div className='overflow-x-auto'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map(transaction => (
            <TableRow key={transaction.id}>
              <TableCell>
                {typeof transaction.createdAt === 'string'
                  ? format(new Date(transaction.createdAt), 'MMM dd, yyyy')
                  : format(transaction.createdAt, 'MMM dd, yyyy')}
              </TableCell>
              <TableCell>{transaction.description}</TableCell>
              <TableCell>
                <div className='flex items-center space-x-2'>
                  <TransactionTypeIcon type={transaction.type} />
                  <span>{getTypeLabel(transaction.type)}</span>
                </div>
              </TableCell>
              <TableCell
                className={
                  [
                    'deposit',
                    'platform_credit',
                    'referral_earning',
                    'refund',
                    'credit',
                    'sponsorship_earning',
                  ].includes(transaction.type)
                    ? 'text-green-600'
                    : 'text-red-600'
                }
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
              </TableCell>
              <TableCell>
                <TransactionStatusBadge status={transaction.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
