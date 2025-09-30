import { UseFormReturn } from 'react-hook-form';
import { EventFormValues } from '@/lib/validations/eventValidation';
import { FormField } from '@/components/ui/form';
import { FormFieldWrapper } from '@/components/shared/form-fields/FormFieldWrapper';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { EventType } from '@/lib/types/event';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface VirtualEventSettingsProps {
  form: UseFormReturn<EventFormValues>;
}

export const VirtualEventSettings = ({ form }: VirtualEventSettingsProps) => {
  const eventType = form.watch('type');

  // Check if event type is virtual event
  if (eventType !== EventType.VirtualEvent) {
    return null;
  }

  return (
    <div className='space-y-6'>
      <h3 className='text-lg font-semibold'>Virtual Event Settings</h3>

      <Alert className='bg-blue-50 border-blue-200'>
        <Info className='h-4 w-4' />
        <AlertDescription>
          Virtual events use our integrated livestreaming platform powered by LiveKit. You can
          schedule streams, interact with attendees, and even record your event for later viewing.
        </AlertDescription>
      </Alert>

      <div className='grid gap-4 md:grid-cols-2'>
        <FormField
          control={form.control}
          name='virtualEventDetails.platform'
          render={({ field }) => (
            <FormFieldWrapper form={form} name='virtualEventDetails.platform' label='Platform'>
              <Input placeholder='e.g., Live Stream, Webinar' {...field} />
            </FormFieldWrapper>
          )}
        />

        <FormField
          control={form.control}
          name='virtualEventDetails.url'
          render={({ field }) => (
            <FormFieldWrapper
              form={form}
              name='virtualEventDetails.url'
              label='External URL (Optional)'
            >
              <Input placeholder='External streaming URL if not using our platform' {...field} />
            </FormFieldWrapper>
          )}
        />
      </div>

      <Separator className='my-4' />

      <h4 className='text-md font-medium'>Stream Schedule</h4>

      <div className='grid gap-4 md:grid-cols-2'>
        <FormField
          control={form.control}
          name='virtualEventDetails.streamSchedule.startTime'
          render={({ field }) => (
            <FormFieldWrapper
              form={form}
              name='virtualEventDetails.streamSchedule.startTime'
              label='Stream Start Time'
              description='When will your livestream begin'
            >
              <DateTimePicker
                date={field.value ? new Date(field.value) : undefined}
                setDate={date => field.onChange(date)}
              />
            </FormFieldWrapper>
          )}
        />

        <FormField
          control={form.control}
          name='virtualEventDetails.streamSchedule.estimatedDuration'
          render={({ field }) => (
            <FormFieldWrapper
              form={form}
              name='virtualEventDetails.streamSchedule.estimatedDuration'
              label='Estimated Duration (minutes)'
            >
              <Input type='number' min='15' placeholder='e.g., 60' {...field} />
            </FormFieldWrapper>
          )}
        />
      </div>

      <div className='grid gap-4 md:grid-cols-2'>
        <FormField
          control={form.control}
          name='virtualEventDetails.streamSchedule.isRecurring'
          render={({ field }) => (
            <FormFieldWrapper
              form={form}
              name='virtualEventDetails.streamSchedule.isRecurring'
              label='Recurring Stream'
            >
              <div className='flex items-center space-x-2 pt-2'>
                <Checkbox id='isRecurring' checked={field.value} onCheckedChange={field.onChange} />
                <label htmlFor='isRecurring' className='text-sm font-medium'>
                  This is a recurring stream
                </label>
              </div>
            </FormFieldWrapper>
          )}
        />

        {form.watch('virtualEventDetails.streamSchedule.isRecurring') && (
          <FormField
            control={form.control}
            name='virtualEventDetails.streamSchedule.recurrencePattern'
            render={({ field }) => (
              <FormFieldWrapper
                form={form}
                name='virtualEventDetails.streamSchedule.recurrencePattern'
                label='Recurrence Pattern'
              >
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder='Select pattern' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='daily'>Daily</SelectItem>
                    <SelectItem value='weekly'>Weekly</SelectItem>
                    <SelectItem value='monthly'>Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </FormFieldWrapper>
            )}
          />
        )}
      </div>

      <Separator className='my-4' />

      <h4 className='text-md font-medium'>Stream Configuration</h4>

      <div className='grid gap-4 md:grid-cols-2'>
        <FormField
          control={form.control}
          name='virtualEventDetails.streamConfiguration.quality'
          render={({ field }) => (
            <FormFieldWrapper
              form={form}
              name='virtualEventDetails.streamConfiguration.quality'
              label='Stream Quality'
            >
              <Select value={field.value} onValueChange={field.onChange} defaultValue='standard'>
                <SelectTrigger>
                  <SelectValue placeholder='Select quality' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='low'>Low (480p)</SelectItem>
                  <SelectItem value='standard'>Standard (720p)</SelectItem>
                  <SelectItem value='high'>High (1080p)</SelectItem>
                </SelectContent>
              </Select>
            </FormFieldWrapper>
          )}
        />

        <FormField
          control={form.control}
          name='virtualEventDetails.streamConfiguration.recordingEnabled'
          render={({ field }) => (
            <FormFieldWrapper
              form={form}
              name='virtualEventDetails.streamConfiguration.recordingEnabled'
              label='Recording'
            >
              <div className='flex items-center space-x-2 pt-2'>
                <Checkbox
                  id='recordingEnabled'
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <label htmlFor='recordingEnabled' className='text-sm font-medium'>
                  Record stream for replay
                </label>
              </div>
            </FormFieldWrapper>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name='virtualEventDetails.hostInstructions'
        render={({ field }) => (
          <FormFieldWrapper
            form={form}
            name='virtualEventDetails.hostInstructions'
            label='Host Instructions'
          >
            <Textarea
              placeholder='Instructions for the host (private)'
              className='min-h-[100px]'
              {...field}
            />
          </FormFieldWrapper>
        )}
      />

      <FormField
        control={form.control}
        name='virtualEventDetails.attendeeInstructions'
        render={({ field }) => (
          <FormFieldWrapper
            form={form}
            name='virtualEventDetails.attendeeInstructions'
            label='Attendee Instructions'
          >
            <Textarea
              placeholder='Instructions for attendees (will be visible to ticket holders)'
              className='min-h-[100px]'
              {...field}
            />
          </FormFieldWrapper>
        )}
      />
    </div>
  );
};
