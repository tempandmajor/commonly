import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, SearchSelect, DatePicker } from '@/components/forms/shared';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { EventFormValues } from '@/lib/validations/eventValidation';

interface CampaignSettingsProps {
  form: UseFormReturn<EventFormValues>;
}

type CampaignDuration = '15' | '30' | '45' | '60' | '90';

const CampaignSettings: React.FC<CampaignSettingsProps> = ({ form }) => {
  const campaignDurationOptions = [
    { value: '15' as const, label: '15 Days', description: 'Quick campaign for urgent events' },
    {
      value: '30' as const,
      label: '30 Days',
      description: 'Standard campaign duration (recommended)',
    },
    { value: '45' as const, label: '45 Days', description: 'Extended campaign for larger events' },
    { value: '60' as const, label: '60 Days', description: 'Long campaign for major events' },
    { value: '90' as const, label: '90 Days', description: 'Maximum campaign duration' },
  ];

  const handleDurationChange = (duration: CampaignDuration) => {
    const days = parseInt(duration);
    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + days);
    form.setValue('campaignSettings.deadlineDate', deadlineDate);
  };

  return (
    <div className='space-y-6'>
      <Alert className='bg-blue-50 border-blue-200'>
        <Info className='h-4 w-4' />
        <AlertDescription>
          <strong>All-or-Nothing Funding:</strong> Your event uses crowdfunding where attendees
          reserve tickets but are only charged if you reach your funding goal before the deadline.
          If the goal isn't reached, all reservations are cancelled and no one is charged.
        </AlertDescription>
      </Alert>

      <FormField
        form={form}
        name='targetAmount'
        label='Funding Goal'
        type='number'
        placeholder='0.00'
        description='Total amount needed to make your event happen'
        required
      />

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div>
          <label className='text-sm font-medium mb-2 block'>
            Campaign Duration <span className='text-destructive'>*</span>
          </label>
          <SearchSelect
            options={campaignDurationOptions}
            value={form.watch('campaignSettings.duration')}
            onChange={value => {
              const typedValue = value as CampaignDuration;
              form.setValue('campaignSettings.duration', typedValue);
              handleDurationChange(typedValue);
            }}
            placeholder='Select campaign duration'
          />
          {form.formState.errors.campaignSettings?.duration && (
            <p className='text-sm text-destructive mt-1'>
              {form.formState.errors.campaignSettings.duration.message}
            </p>
          )}
        </div>

        <div>
          <label className='text-sm font-medium mb-2 block'>
            Campaign Deadline <span className='text-destructive'>*</span>
          </label>
          <DatePicker
            value={form.watch('campaignSettings.deadlineDate')}
            onChange={date => form.setValue('campaignSettings.deadlineDate', date!)}
            placeholder='Campaign ends on...'
            minDate={new Date()}
            maxDate={form.watch('startDate') || undefined}
            disabled
          />
          <p className='text-xs text-muted-foreground mt-1'>
            Automatically calculated based on duration
          </p>
          {form.formState.errors.campaignSettings?.deadlineDate && (
            <p className='text-sm text-destructive mt-1'>
              {form.formState.errors.campaignSettings.deadlineDate.message}
            </p>
          )}
        </div>
      </div>

      {form.watch('campaignSettings.duration') && form.watch('targetAmount') && (
        <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
          <h4 className='font-medium text-green-800 mb-2'>Campaign Summary</h4>
          <div className='text-sm text-green-700 space-y-1'>
            <p>• Goal: ${form.watch('targetAmount')?.toLocaleString()}</p>
            <p>• Duration: {form.watch('campaignSettings.duration')} days</p>
            <p>• Deadline: {form.watch('campaignSettings.deadlineDate')?.toLocaleDateString()}</p>
            <p>• Attendees are only charged if goal is reached by deadline</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignSettings;
