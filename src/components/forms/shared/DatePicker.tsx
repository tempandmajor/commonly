import React from 'react';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DatePickerProps {
  value?: Date | undefined;
  onChange: (date: Date | undefined) => void;
  placeholder?: string | undefined;
  disabled?: boolean | undefined;
  className?: string | undefined;
  minDate?: Date | undefined;
  maxDate?: Date | undefined;
  showTime?: boolean | undefined;
  dateFormat?: string | undefined;
  timeFormat?: string | undefined;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Pick a date',
  disabled = false,
  className,
  minDate,
  maxDate,
  showTime = false,
  dateFormat = 'PPP',
  timeFormat = 'p',
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const handleDateSelect = (date: Date | undefined) => {
    if (!showTime) {
      onChange(date);
      setIsOpen(false);
    } else if (date) {
      // Preserve existing time when selecting a new date
      const newDate = new Date(date);
      if (value) {
        newDate.setHours(value.getHours());
        newDate.setMinutes(value.getMinutes());
      }
      onChange(newDate);
    }
  };

  const handleTimeChange = (type: 'hour' | 'minute', value: string) => {
    const currentDate = value || new Date();
    const newDate = new Date(currentDate);

    if (type === 'hour') {
      newDate.setHours(parseInt(value));
    } else {
      newDate.setMinutes(parseInt(value));
    }

    onChange(newDate);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className='mr-2 h-4 w-4' />
          {value ? (
            showTime ? (
              format(value, `${dateFormat} ${timeFormat}`)
            ) : (
              format(value, dateFormat)
            )
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0' align='start'>
        <Calendar
          mode='single'
          selected={value}
          onSelect={handleDateSelect}
          initialFocus
          disabled={date => {
            if (minDate && date < minDate) return true;
            if (maxDate && date > maxDate) return true;
            return false;
          }}
        />
        {showTime && (
          <div className='p-3 border-t'>
            <div className='flex items-center gap-2'>
              <div className='flex-1'>
                <label className='text-xs text-muted-foreground'>Hour</label>
                <Select
                  value={value ? value.getHours().toString() : undefined}
                  onValueChange={val => handleTimeChange('hour', val)}
                >
                  <SelectTrigger className='h-8'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {hours.map(hour => (
                      <SelectItem key={hour} value={hour.toString()}>
                        {hour.toString().padStart(2, '0')}
                      </SelectItem>
                    ))}
                  </SelectContent>

                </Select>
              </div>
              <div className='flex-1'>
                <label className='text-xs text-muted-foreground'>Minute</label>
                <Select
                  value={value ? value.getMinutes().toString() : undefined}
                  onValueChange={val => handleTimeChange('minute', val)}
                >
                  <SelectTrigger className='h-8'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {minutes.map(minute => (
                      <SelectItem key={minute} value={minute.toString()}>
                        {minute.toString().padStart(2, '0')}
                      </SelectItem>
                    ))}
                  </SelectContent>

                </Select>
              </div>

            </div>

          </div>
        )}

      </PopoverContent>

    </Popover>

  );

};
