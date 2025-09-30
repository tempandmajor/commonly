import React from 'react';
import { Input } from '@/components/ui/input';
import { FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';

interface UsernameFieldProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error: string | null;
  isChecking: boolean;
  isDisabled: boolean;
}

const UsernameField: React.FC<UsernameFieldProps> = ({
  value,
  onChange,
  error,
  isChecking,
  isDisabled,
}) => {
  return (
    <FormItem className='space-y-2'>
      <FormLabel htmlFor='username'>Username</FormLabel>
      <FormControl>
        <div className='relative'>
          <Input
            id='username'
            name='username'
            value={value}
            onChange={onChange}
            placeholder='Choose a username'
            disabled={isChecking || isDisabled}
            aria-describedby={error ? 'username-error' : undefined}
            aria-invalid={!!error}
          />
          {isChecking && (
            <div className='absolute right-3 top-1/2 -translate-y-1/2'>
              <Loader2 className='h-4 w-4 animate-spin' />
            </div>
          )}
        </div>
      </FormControl>

      {error && <FormMessage id='username-error'>{error}</FormMessage>}

      {isChecking && (
        <p className='text-xs text-muted-foreground'>Checking username availability...</p>
      )}
    </FormItem>
  );
};

export default UsernameField;
