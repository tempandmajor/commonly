import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TransactionType } from '@/services/wallet/types';
import { CalendarIcon, Search } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface TransactionFiltersProps {
  filterType: TransactionType | 'all';
  filterStatus: string | 'all';
  searchQuery: string;
  dateRange: DateRange | undefined;
  onFilterTypeChange: (value: TransactionType | 'all') => void;
  onFilterStatusChange: (value: string | 'all') => void;
  onSearchChange: (value: string) => void;
  onDateRangeChange: (value: DateRange | undefined) => void;
  onApplyDateRange: () => void;
  handleFilterChange: () => void;
}

export const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  filterType,
  filterStatus,
  searchQuery,
  dateRange,
  onFilterTypeChange,
  onFilterStatusChange,
  onSearchChange,
  onDateRangeChange,
  onApplyDateRange,
  handleFilterChange,
}) => {
  return (
    <div className='space-y-4'>
      <div className='flex flex-col sm:flex-row items-start sm:items-center gap-2'>
        <div className='flex-1 w-full'>
          <div className='relative'>
            <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='Search transactions...'
              className='pl-8'
              value={searchQuery}
              onChange={e => onSearchChange((e.target as HTMLInputElement).value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  handleFilterChange();
                }
              }}
            />
          </div>
        </div>
        <div className='flex flex-wrap gap-2 mt-2 sm:mt-0'>
          <Select value={filterType} onValueChange={onFilterTypeChange}>
            <SelectTrigger className='w-[130px]'>
              <SelectValue placeholder='Filter by type' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All types</SelectItem>
              <SelectItem value='deposit'>Deposit</SelectItem>
              <SelectItem value='withdrawal'>Withdrawal</SelectItem>
              <SelectItem value='transfer'>Transfer</SelectItem>
              <SelectItem value='refund'>Refund</SelectItem>
              <SelectItem value='platform_credit'>Platform Credit</SelectItem>
              <SelectItem value='referral'>Referral</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={onFilterStatusChange}>
            <SelectTrigger className='w-[130px]'>
              <SelectValue placeholder='Filter by status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All statuses</SelectItem>
              <SelectItem value='completed'>Completed</SelectItem>
              <SelectItem value='pending'>Pending</SelectItem>
              <SelectItem value='failed'>Failed</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant='outline' className='justify-start text-left w-[150px]'>
                <CalendarIcon className='mr-2 h-4 w-4' />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'MMM d')} -&nbsp;
                      {format(dateRange.to, 'MMM d')}
                    </>
                  ) : (
                    format(dateRange.from, 'MMM d')
                  )
                ) : (
                  <span>Date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-auto p-0' align='start'>
              <Calendar
                initialFocus
                mode='range'
                {...(dateRange?.from && { defaultMonth: dateRange.from })}
                selected={dateRange}
                onSelect={onDateRangeChange}
                numberOfMonths={2}
              />
              <div className='border-t p-3 flex justify-end'>
                <Button
                  size='sm'
                  onClick={onApplyDateRange}
                  disabled={!dateRange?.from}
                  className={cn('ml-auto', !dateRange?.from && 'opacity-50 cursor-not-allowed')}
                >
                  Apply Date Range
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className='flex justify-end'>
        <Button onClick={handleFilterChange}>Apply Filters</Button>
      </div>
    </div>
  );
};

export default TransactionFilters;
