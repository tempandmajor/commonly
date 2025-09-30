import { FormFieldWrapper } from '@/components/shared/form-fields/FormFieldWrapper';
import { UseFormReturn } from 'react-hook-form';
import { EventFormValues } from '@/lib/validations/eventValidation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import LocationInput from '@/components/location/LocationInput';

interface EventSettingsProps {
  form: UseFormReturn<EventFormValues>;
}

export const EventSettings = ({ form }: EventSettingsProps) => {
  // Parse input to number on change
  const handleTargetAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = (e.target as HTMLInputElement).value;
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      form.setValue('targetAmount', numValue, { shouldValidate: true });
    } else {
      form.setValue('targetAmount', 0, { shouldValidate: true });
    }
  };

  // Handle location change
  const handleLocationChange = (location: string) => {
    form.setValue('location', location, { shouldValidate: true });
  };

  return (
    <div className='space-y-4'>
      <FormFieldWrapper form={form} name='location' label='Location'>
        <LocationInput
          value={form.watch('location')}
          onChange={handleLocationChange}
          placeholder='Event location'
        />
      </FormFieldWrapper>

      <FormFieldWrapper form={form} name='targetAmount' label='Target Amount'>
        <Input type='number' placeholder='Target amount' onChange={handleTargetAmountChange} />
      </FormFieldWrapper>

      <div className='space-y-2'>
        <div className='flex items-center justify-between'>
          <div className='space-y-0.5'>
            <Label htmlFor='private-event'>Private Event</Label>
            <p className='text-sm text-muted-foreground'>
              Only invited users can see and join this event
            </p>
          </div>
          <FormFieldWrapper form={form} name='isPrivate' label=''>
            <Switch id='private-event' />
          </FormFieldWrapper>
        </div>
      </div>
    </div>
  );
};
