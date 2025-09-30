import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Transaction, TransactionType } from '@/services/wallet/types';
import { DateRange } from 'react-day-picker';
import { DownloadIcon } from 'lucide-react';
import { TransactionFilters } from './components/transactions/TransactionFilters';
import { TransactionsTable } from './components/transactions/TransactionsTable';

interface TransactionsTabProps {
  transactions: Transaction[];
  isLoading: boolean;
  downloadTransactions: () => void;
  onFilterChange?: (filters: unknown) => void | undefined;
}

const TransactionsTab: React.FC<TransactionsTabProps> = ({
  transactions,
  isLoading,
  downloadTransactions,
  onFilterChange,
}) => {
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<string | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const handleFilterChange = () => {
    if (onFilterChange) {
      onFilterChange({
        type: filterType === 'all' ? undefined : filterType,
        status: filterStatus === 'all' ? undefined : filterStatus,
        search: searchQuery || undefined,
          ...(dateRange?.from && { startDate: dateRange.from.toISOString() }),
          ...(dateRange?.to && { endDate: dateRange.to.toISOString() }),
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          <TransactionFilters
            filterType={filterType}
            filterStatus={filterStatus}
            searchQuery={searchQuery}
            dateRange={dateRange}
            onFilterTypeChange={setFilterType}
            onFilterStatusChange={setFilterStatus}
            onSearchChange={setSearchQuery}
            onDateRangeChange={setDateRange}
            onApplyDateRange={handleFilterChange}
            handleFilterChange={handleFilterChange}
          />
        </div>

        <div className='mt-4 space-y-4'>
          {isLoading ? (
            <div className='flex justify-center p-8'>
              <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent' />
            </div>
          ) : transactions.length === 0 ? (
            <div className='text-center py-8'>
              <p className='text-muted-foreground'>No transactions found</p>
            </div>
          ) : (
            <TransactionsTable transactions={transactions} />
          )}

          <div className='flex justify-center mt-6'>
            <Button
              variant='outline'
              onClick={downloadTransactions}
              disabled={isLoading || transactions.length === 0}
            >
              <DownloadIcon className='mr-2 h-4 w-4' />
              Download Transactions
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

};

export default TransactionsTab;

