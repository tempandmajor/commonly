import React from 'react';
import { Input } from '@/components/ui/input';
import { FormItem, FormLabel, FormControl, FormDescription } from '@/components/ui/form';

interface EmailFieldProps {
  email: string;
}

const EmailField: React.FC<EmailFieldProps> = ({ email }) => {
  return (
    <FormItem className='space-y-2'>
      <FormLabel htmlFor='email'>Email</FormLabel>
      <FormControl>
        <Input id='email' name='email' type='email' value={email} disabled aria-readonly='true' />
      </FormControl>
      <FormDescription>
        Email address cannot be changed directly. Contact support for assistance.
      </FormDescription>
    </FormItem>
  );
};

export default EmailField;
