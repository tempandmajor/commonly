import React from 'react';
import {
  FormControl,
  FormDescription,
  FormField as BaseFormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UseFormReturn } from 'react-hook-form';

interface FormFieldProps {
  form: UseFormReturn<any>;
  name: string;
  label: string;
  placeholder?: string | undefined;
  description?: string | undefined;
  helpText?: string | undefined;
  tooltip?: string | undefined;
  type?: 'text' | undefined| 'email' | 'password' | 'number' | 'textarea' | 'select' | 'switch';
  required?: boolean | undefined;
  disabled?: boolean | undefined;
  className?: string | undefined;
  options?: { label: string | undefined; value: string }[];
  rows?: number;
  autoComplete?: string;
  autoFocus?: boolean;
  'aria-label'?: string;
  'aria-describedby'?: string;
  onChange?: (value: unknown) => void;
  icon?: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  form,
  name,
  label,
  placeholder,
  description,
  helpText,
  tooltip,
  type = 'text',
  required = false,
  disabled = false,
  className,
  options = [],
  rows = 4,
  autoComplete,
  autoFocus,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  onChange,
  icon,
}) => {
  const fieldId = `field-${name}`;
  const descriptionId = `${fieldId}-description`;
  const errorId = `${fieldId}-error`;

  return (
    <BaseFormField
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className={cn('space-y-2', className)}>
          <div className='flex items-center gap-2'>
            <FormLabel htmlFor={fieldId}>
              {label}
              {required && <span className='text-destructive ml-1'>*</span>}
            </FormLabel>
            {tooltip && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger type='button' className='inline-flex'>
                    <Info className='h-4 w-4 text-muted-foreground' />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className='max-w-xs'>{tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          <FormControl>
            {type === 'textarea' ? (
              <Textarea
                {...field}
                id={fieldId}
                placeholder={placeholder}
                disabled={disabled}
                rows={rows}
                aria-label={ariaLabel || label}
                aria-describedby={cn(
                  description && descriptionId,
                  fieldState.error && errorId,
                  ariaDescribedBy
                )}
                aria-required={required}
                aria-invalid={!!fieldState.error}
                onChange={e => {
                  field.onChange(e);
                  onChange?.((e.target as HTMLInputElement).value);
                }}
              />
            ) : type === 'select' ? (
              <Select
                value={field.value}
                onValueChange={value => {
                  field.onChange(value);
                  onChange?.(value);
                }}
                disabled={disabled}
              >
                <SelectTrigger
                  id={fieldId}
                  aria-label={ariaLabel || label}
                  aria-describedby={cn(
                    description && descriptionId,
                    fieldState.error && errorId,
                    ariaDescribedBy
                  )}
                  aria-required={required}
                  aria-invalid={!!fieldState.error}
                >
                  <SelectValue placeholder={placeholder || `Select ${label.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  {options.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : type === 'switch' ? (
              <div className='flex items-center space-x-2'>
                <Switch
                  id={fieldId}
                  checked={field.value}
                  onCheckedChange={checked => {
                    field.onChange(checked);
                    onChange?.(checked);
                  }}
                  disabled={disabled}
                  aria-label={ariaLabel || label}
                  aria-describedby={cn(
                    description && descriptionId,
                    fieldState.error && errorId,
                    ariaDescribedBy
                  )}
                  aria-required={required}
                  aria-invalid={!!fieldState.error}
                />
                {description && (
                  <label
                    htmlFor={fieldId}
                    className='text-sm text-muted-foreground cursor-pointer'
                    onClick={() => field.onChange(!field.value)}
                  >
                    {description}
                  </label>
                )}
              </div>
            ) : (
              <div className='relative'>
                {icon && (
                  <div className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'>
                    {icon}
                  </div>
                )}
                <Input
                  {...field}
                  id={fieldId}
                  type={type}
                  placeholder={placeholder}
                  disabled={disabled}
                  autoComplete={autoComplete}
                  autoFocus={autoFocus}
                  aria-label={ariaLabel || label}
                  aria-describedby={cn(
                    description && descriptionId,
                    fieldState.error && errorId,
                    ariaDescribedBy
                  )}
                  aria-required={required}
                  aria-invalid={!!fieldState.error}
                  onChange={e => {
                    const value = type === 'number' ? (e.target as HTMLInputElement).valueAsNumber : (e.target as HTMLInputElement).value;
                    field.onChange(value);
                    onChange?.(value);
                  }}
                  className={cn(icon && 'pl-10', field.value ? '' : 'text-muted-foreground')}
                />
              </div>
            )}
          </FormControl>

          {(description || helpText) && <FormDescription id={descriptionId}>{description || helpText}</FormDescription>}

          <FormMessage id={errorId} role='alert' />
        </FormItem>
      )}
    />
  );
};
