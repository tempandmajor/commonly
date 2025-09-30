import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface EmailNotificationSettingsProps {
  emailNotifications: {
    newFollowers: boolean;
    eventUpdates: boolean;
    paymentConfirmations: boolean;
    marketing: boolean;
  };
  onSettingChange: (setting: string) => void;
  isLoading: boolean;
  error: Error | null;
}

const EmailNotificationSettings = ({
  emailNotifications,
  onSettingChange,
  isLoading,
  error,
}: EmailNotificationSettingsProps) => {
  return (
    <div className='space-y-4'>
      <h3 className='text-lg font-medium'>Email Notifications</h3>

      {error && (
        <div className='p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md'>
          {error.message}
        </div>
      )}

      <div className='space-y-3'>
        <div className='flex items-center justify-between'>
          <Label htmlFor='email-followers' className='flex-1'>
            New followers
          </Label>
          <Switch
            id='email-followers'
            checked={emailNotifications.newFollowers}
            onCheckedChange={() => onSettingChange('newFollowers')}
            disabled={isLoading}
          />
        </div>

        <div className='flex items-center justify-between'>
          <Label htmlFor='email-events' className='flex-1'>
            Event updates
          </Label>
          <Switch
            id='email-events'
            checked={emailNotifications.eventUpdates}
            onCheckedChange={() => onSettingChange('eventUpdates')}
            disabled={isLoading}
          />
        </div>

        <div className='flex items-center justify-between'>
          <Label htmlFor='email-payments' className='flex-1'>
            Payment confirmations
          </Label>
          <Switch
            id='email-payments'
            checked={emailNotifications.paymentConfirmations}
            onCheckedChange={() => onSettingChange('paymentConfirmations')}
            disabled={isLoading}
          />
        </div>

        <div className='flex items-center justify-between'>
          <Label htmlFor='email-marketing' className='flex-1'>
            Marketing updates
          </Label>
          <Switch
            id='email-marketing'
            checked={emailNotifications.marketing}
            onCheckedChange={() => onSettingChange('marketing')}
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default EmailNotificationSettings;
