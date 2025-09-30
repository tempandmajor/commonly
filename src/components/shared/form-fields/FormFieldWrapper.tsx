import React from 'react';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { UseFormReturn } from 'react-hook-form';

interface FormFieldWrapperProps {
  form: UseFormReturn<any>;
  name: string;
  label?: string | undefined;
  description?: string | undefined;
  children: React.ReactNode;
  required?: boolean | undefined; // Added required prop
}

export const FormFieldWrapper = ({
  form,
  name,
  label,
  description,
  children,
  required, // Include required in props
}: FormFieldWrapperProps) => {
  if (!form.control) {
    return null;
  }

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          {label && (
            <FormLabel>
              {label}
              {required && <span className='text-destructive ml-1'>*</span>}
            </FormLabel>
          )}
          <FormControl>
            {React.isValidElement(children) ? React.cloneElement(children, { ...field }) : children}
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
