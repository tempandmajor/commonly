import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
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

interface DateTimePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  className?: string | undefined;
}

export function DateTimePicker({ date, setDate, className }: DateTimePickerProps) {
  const [selectedDateTime, setSelectedDateTime] = useState<Date | undefined>(date);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  useEffect(() => {
    setSelectedDateTime(date);
  }, [date]);

  const handleSelect = (selected: Date | undefined) => {
    if (selected) {
      const currentDate = selectedDateTime || new Date();
      const newDateTime = new Date(selected);
      newDateTime.setHours(currentDate.getHours());
      newDateTime.setMinutes(currentDate.getMinutes());

      setSelectedDateTime(newDateTime);
      setDate(newDateTime);
    }
  };

  const handleTimeChange = (timeString: string, type: 'hour' | 'minute') => {
    if (!selectedDateTime && !date) {
      const now = new Date();
      setSelectedDateTime(now);
      setDate(now);
      return;
    }

    const currentDateTime = selectedDateTime || date || new Date();
    const newDateTime = new Date(currentDateTime);

    const timeValue = parseInt(timeString, 10);

    if (type === 'hour') {
      newDateTime.setHours(timeValue);
    } else if (type === 'minute') {
      newDateTime.setMinutes(timeValue);
    }

    setSelectedDateTime(newDateTime);
    setDate(newDateTime);
  };

  const hours = Array.from({ length: 24 }, (_, i) => ({
    value: i.toString(),
    label: i.toString().padStart(2, '0'),
  }));

  const minutes = Array.from({ length: 60 }, (_, i) => ({
    value: i.toString(),
    label: i.toString().padStart(2, '0'),
  }));

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={'outline'}
            className={cn(
              'w-full justify-start text-left font-normal',
              !date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className='mr-2 h-4 w-4' />
            {date ? format(date, 'PPP p') : <span>Pick a date and time</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-auto p-0' align='start'>
          <Calendar
            mode='single'
            selected={selectedDateTime}
            onSelect={handleSelect}
            initialFocus
          />
          <div className='border-t border-border p-3'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <Clock className='h-4 w-4 text-muted-foreground' />
                <span className='text-sm font-medium'>Time:</span>
              </div>
              <div className='flex items-center space-x-2'>
                <Select
                  value={selectedDateTime ? selectedDateTime.getHours().toString() : ''}
                  onValueChange={value => handleTimeChange(value, 'hour')}
                >
                  <SelectTrigger className='w-16'>
                    <SelectValue placeholder='Hour' />
                  </SelectTrigger>
                  <SelectContent>
                    {hours.map(hour => (
                      <SelectItem key={hour.value} value={hour.value}>
                        {hour.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className='text-sm'>:</span>
                <Select
                  value={selectedDateTime ? selectedDateTime.getMinutes().toString() : ''}
                  onValueChange={value => handleTimeChange(value, 'minute')}
                >
                  <SelectTrigger className='w-16'>
                    <SelectValue placeholder='Min' />
                  </SelectTrigger>
                  <SelectContent>
                    {minutes.map(minute => (
                      <SelectItem key={minute.value} value={minute.value}>
                        {minute.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className='w-full mt-3' onClick={() => setIsCalendarOpen(false)}>
              Confirm
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
