import { UseFormReturn } from 'react-hook-form';
import { PromotionFormValues } from './types';
import { FormFieldWrapper } from '@/components/shared/form-fields/FormFieldWrapper';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, DollarSign } from 'lucide-react';

interface BudgetSchedulingProps {
  form: UseFormReturn<PromotionFormValues>;
  isLoading: boolean;
}

export const BudgetScheduling = ({ form, isLoading }: BudgetSchedulingProps) => {
  const startDate = form.watch('startDate');
  const endDate = form.watch('endDate');

  const getStartDateValue = () => {
    if (startDate instanceof Date) return startDate;
    if (typeof startDate === 'string') return new Date(startDate);
    return new Date();
  };

  const getEndDateValue = () => {
    if (!endDate) return undefined;
    if (endDate instanceof Date) return endDate;
    if (typeof endDate === 'string') return new Date(endDate);
    return undefined;
  };

  return (
    <div className='space-y-2'>
      <h3 className='text-lg font-medium'>Budget & Scheduling</h3>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <FormFieldWrapper
          form={form}
          name='budget'
          label='Total Budget'
          description='Your maximum campaign spend'
        >
          <div className='flex items-center'>
            <DollarSign className='h-4 w-4 text-muted-foreground mr-2' />
            <Input type='number' min={5} max={10000} step={5} disabled={isLoading} />
          </div>
        </FormFieldWrapper>

        <FormFieldWrapper
          form={form}
          name='dailyBudgetLimit'
          label='Daily Budget Limit (Optional)'
          description='Cap your daily spending'
        >
          <div className='flex items-center'>
            <DollarSign className='h-4 w-4 text-muted-foreground mr-2' />
            <Input type='number' min={1} placeholder='Optional' disabled={isLoading} />
          </div>
        </FormFieldWrapper>

        <FormFieldWrapper form={form} name='startDate' label='Start Date'>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant='outline'
                className='w-full pl-3 text-left font-normal'
                disabled={isLoading}
              >
                {startDate ? format(getStartDateValue(), 'PPP') : <span>Pick a date</span>}
                <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-auto p-0' align='start'>
              <Calendar
                mode='single'
                selected={getStartDateValue()}
                onSelect={date => form.setValue('startDate', date || new Date())}
                disabled={date => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </FormFieldWrapper>

        <FormFieldWrapper form={form} name='endDate' label='End Date (Optional)'>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant='outline'
                className='w-full pl-3 text-left font-normal'
                disabled={isLoading}
              >
                {endDate ? (
                  format(getEndDateValue() || new Date(), 'PPP')
                ) : (
                  <span>No end date (continuous)</span>
                )}
                <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-auto p-0' align='start'>
              <Calendar
                mode='single'
                selected={getEndDateValue()}
                onSelect={date => form.setValue('endDate', date)}
                disabled={date => {
                  const startValue = getStartDateValue();
                  return date < new Date() || (startValue && date < startValue);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </FormFieldWrapper>
      </div>
    </div>
  );
};
