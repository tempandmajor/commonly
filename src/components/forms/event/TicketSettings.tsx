import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { FormFieldWrapper } from '@/components/shared/form-fields/FormFieldWrapper';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface TicketSettingsProps {
  form: UseFormReturn<any>;
}

export const TicketSettings = ({ form }: TicketSettingsProps) => {
  const isFree = form.watch('isFree');

  // Handle price change to ensure it's stored as a number
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = (e.target as HTMLInputElement).value;
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue)) {
      form.setValue('price', numericValue);
    } else {
      form.setValue('price', 0);
    }
  };

  return (
    <div className='space-y-4'>
      <h3 className='text-lg font-medium'>Ticket Settings</h3>

      <div className='flex items-center space-x-2'>
        <Switch
          id='free-event'
          checked={isFree}
          onCheckedChange={checked => form.setValue('isFree', checked)}
        />
        <Label htmlFor='free-event'>This is a free event</Label>
      </div>

      {!isFree && (
        <FormFieldWrapper form={form} name='price' label='Ticket Price ($)'>
          <Input
            type='number'
            min='0'
            step='0.01'
            placeholder='0.00'
            onChange={handlePriceChange}
          />
        </FormFieldWrapper>
      )}

      <FormFieldWrapper
        form={form}
        name='capacity'
        label='Maximum Capacity'
        description='Leave blank for unlimited tickets'
      >
        <Input type='number' min='1' placeholder='100' />
      </FormFieldWrapper>

      <FormFieldWrapper
        form={form}
        name='maxTicketsPerPurchase'
        label='Maximum Tickets Per Purchase'
        description='Limit how many tickets one person can buy'
      >
        <Input type='number' min='1' placeholder='10' />
      </FormFieldWrapper>
    </div>
  );
};
