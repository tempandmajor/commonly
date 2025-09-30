import { FormFieldWrapper } from '@/components/shared/form-fields/FormFieldWrapper';
import { UseFormReturn } from 'react-hook-form';
import { EventFormValues } from '@/lib/validations/eventValidation';
import { EventType, EventCategory } from '@/lib/types/event';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormField } from '@/components/ui/form';

interface EventTypeCategoryProps {
  form: UseFormReturn<EventFormValues>;
}

export const EventTypeCategory = ({ form }: EventTypeCategoryProps) => {
  return (
    <div className='space-y-4'>
      <FormField
        control={form.control}
        name='category'
        render={({ field }) => (
          <FormFieldWrapper form={form} name='category' label='Category'>
            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
              <SelectTrigger>
                <SelectValue placeholder='Select a category' />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EventCategory).map(([key, value]) => (
                  <SelectItem key={key} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormFieldWrapper>
        )}
      />

      <FormField
        control={form.control}
        name='type'
        render={({ field }) => (
          <FormFieldWrapper form={form} name='type' label='Type'>
            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
              <SelectTrigger>
                <SelectValue placeholder='Select a type' />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EventType).map(([key, value]) => (
                  <SelectItem key={key} value={value}>
                    {key}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormFieldWrapper>
        )}
      />
    </div>
  );
};
