import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UseFormRegister, FieldErrors } from 'react-hook-form';

interface PriceInputProps {
  register: UseFormRegister<any>;
  errors: FieldErrors;
  name: string;
  label?: string | undefined;
  required?: boolean | undefined;
  currency?: string | undefined;
  min?: number | undefined;
  step?: number | undefined;
  placeholder?: string | undefined;
  description?: string | undefined;
}

export const PriceInput: React.FC<PriceInputProps> = ({
  register,
  errors,
  name,
  label = 'Price',
  required = true,
  currency = '$',
  min = 0,
  step = 0.01,
  placeholder = '0.00',
  description,
}) => {
  const error = errors[name];
  const getErrorMessage = (error: unknown): string | null => {
    if (!error) return null;
    if (typeof error === 'string') return error;
    if (typeof error === 'object' && 'message' in error) {
      return typeof error.message === 'string' ? error.message : null;
    }
    return null;
  };

  const errorMessage = getErrorMessage(error);

  return (
    <div className='space-y-2'>
      <Label htmlFor={name}>
        {label}
        {required && '*'}
      </Label>
      <div className='relative'>
        <span className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'>
          {currency}
        </span>
        <Input
          id={name}
          type='number'
          min={min}
          step={step}
          placeholder={placeholder}
          className='pl-8'
          {...register(name, {
            valueAsNumber: true,
            required: required ? `${label} is required` : false,
            min: {
              value: min,
              message: `${label} must be at least ${currency}${min}`,
            },
          })}
        />
      </div>
      {description && <p className='text-sm text-muted-foreground'>{description}</p>}
      {errorMessage && <p className='text-sm text-destructive'>{errorMessage}</p>}
    </div>
  );
};

// Currency formatter utility
export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Parse currency string to number
export const parseCurrency = (value: string): number => {
  // Remove currency symbols and commas
  const cleanValue = value.replace(/[^0-9.-]+/g, '');
  return parseFloat(cleanValue) || 0;
};
