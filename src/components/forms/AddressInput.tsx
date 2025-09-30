import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UseFormRegister, FieldErrors } from 'react-hook-form';

interface AddressInputProps {
  register: UseFormRegister<any>;
  errors: FieldErrors;
  prefix?: string | undefined;
  required?: boolean | undefined;
  defaultCountry?: string | undefined;
}

export const AddressInput: React.FC<AddressInputProps> = ({
  register,
  errors,
  prefix = '',
  required = true,
  defaultCountry = 'United States',
}) => {
  const fieldName = (name: string) => (prefix ? `${prefix}.${name}` : name);
  const getError = (name: string) => {
    const path = fieldName(name).split('.');
    let error: any = errors;
    for (const key of path) {
      error = error?.[key];
    }
    return error;
  };

  return (
    <div className='space-y-4'>
      <div className='space-y-2'>
        <Label htmlFor={fieldName('street')}>Street Address{required && '*'}</Label>
        <Input
          id={fieldName('street')}
          {...register(fieldName('street'))}
          placeholder='123 Main St'
        />
        {getError('street') && (
          <p className='text-sm text-destructive'>{getError('street').message}</p>
        )}
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <div className='space-y-2'>
          <Label htmlFor={fieldName('city')}>City{required && '*'}</Label>
          <Input id={fieldName('city')} {...register(fieldName('city'))} placeholder='New York' />
          {getError('city') && (
            <p className='text-sm text-destructive'>{getError('city').message}</p>
          )}
        </div>

        <div className='space-y-2'>
          <Label htmlFor={fieldName('state')}>State/Province{required && '*'}</Label>
          <Input id={fieldName('state')} {...register(fieldName('state'))} placeholder='NY' />
          {getError('state') && (
            <p className='text-sm text-destructive'>{getError('state').message}</p>
          )}
        </div>

        <div className='space-y-2'>
          <Label htmlFor={fieldName('zipCode')}>Zip/Postal Code{required && '*'}</Label>
          <Input
            id={fieldName('zipCode')}
          {...register(fieldName('zipCode'))}
            placeholder='10001'
          />
          {getError('zipCode') && (
            <p className='text-sm text-destructive'>{getError('zipCode').message}</p>
          )}
        </div>
      </div>

      <div className='space-y-2'>
        <Label htmlFor={fieldName('country')}>Country{required && '*'}</Label>
        <Input
          id={fieldName('country')}
          {...register(fieldName('country'))}
          defaultValue={defaultCountry}
          placeholder='United States'
        />
        {getError('country') && (
          <p className='text-sm text-destructive'>{getError('country').message}</p>
        )}
      </div>
    </div>
  );
};
