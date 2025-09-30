import { FormFieldWrapper } from '@/components/shared/form-fields/FormFieldWrapper';
import { UseFormReturn } from 'react-hook-form';
import { EventFormValues } from '@/lib/validations/eventValidation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from 'lucide-react';
import { FormField } from '@/components/ui/form';

interface EventDateTimeProps {
  form: UseFormReturn<EventFormValues>;
}

export const EventDateTime = ({ form }: EventDateTimeProps) => {
  const handleDurationChange = (duration: string) => {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + parseInt(duration));

    form.setValue('startDate', startDate, { shouldValidate: true });
    form.setValue('endDate', endDate, { shouldValidate: true });
  };

  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-4'>
        <Calendar className='h-4 w-4 text-muted-foreground' />
        <span className='text-sm font-medium'>Pre-Sale Duration</span>
      </div>

      <FormField
        control={form.control}
        name='campaignDuration'
        render={({ field }) => (
          <FormFieldWrapper
            form={form}
            name='campaignDuration'
            label='How long should your pre-sale run?'
            description='Select the duration for your pre-sale event tickets'
          >
            <Select
              onValueChange={value => {
                field.onChange(value);
                handleDurationChange(value);
              }}
              defaultValue={field.value}
              value={field.value}
            >
              <SelectTrigger>
                <SelectValue placeholder='Select pre-sale duration' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='30'>30 days</SelectItem>
                <SelectItem value='60'>60 days</SelectItem>
              </SelectContent>
            </Select>
          </FormFieldWrapper>
        )}
      />

      <div className='mt-4 rounded-lg border p-4 bg-muted/50'>
        <h4 className='font-medium mb-2'>Important Pre-Sale Information</h4>
        <ul className='text-sm text-muted-foreground space-y-2'>
          <li>• Your pre-sale must reach its goal within the selected timeframe</li>
          <li>• Maximum pre-sale duration is 60 days</li>
          <li>• Once started, the duration cannot be modified</li>
          <li>• Ticket purchasers are only charged if the pre-sale reaches its goal</li>
        </ul>
      </div>
    </div>
  );
};
