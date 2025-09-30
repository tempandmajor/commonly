import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DateRangePickerProps {
  className?: string | undefined;
  value: DateRange | undefined;
  onChange: (dateRange: DateRange | undefined) => void;
  placeholder?: string | undefined;
  disabled?: boolean | undefined;
  onApply?: () => void | undefined;
}

export function DateRangePicker({
  className,
  value,
  onChange,
  placeholder = 'Select date range',
  disabled = false,
  onApply,
}: DateRangePickerProps) {
  return (
    <div className={cn('grid gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id='date'
            variant={'outline'}
            className={cn(
              'w-full justify-start text-left font-normal',
              !value?.from && 'text-muted-foreground'
            )}
            disabled={disabled}
          >
            <CalendarIcon className='mr-2 h-4 w-4' />
            {value?.from ? (
              value.to ? (
                <>
                  {format(value.from, 'LLL dd, y')} - {format(value.to, 'LLL dd, y')}
                </>
              ) : (
                format(value.from, 'LLL dd, y')
              )
            ) : (
              placeholder
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-auto p-0' align='start'>
          <div className='space-y-2 p-2'>
            <Calendar
              initialFocus
              mode='range'
              {...(value?.from && { defaultMonth: value.from })}
              selected={value}
              onSelect={onChange}
              numberOfMonths={2}
              className={cn('p-3 pointer-events-auto')}
            />
            {onApply && (
              <div className='flex justify-end px-2'>
                <Button size='sm' onClick={onApply}>
                  Apply
                </Button>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
