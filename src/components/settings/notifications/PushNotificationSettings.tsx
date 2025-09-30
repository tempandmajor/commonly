import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface PushNotificationSettingsProps {
  pushNotifications: {
    newFollowers: boolean;
    eventUpdates: boolean;
    paymentConfirmations: boolean;
    marketing: boolean;
  };
  onSettingChange: (setting: string) => void;
  isLoading: boolean;
  error: Error | null;
}

const PushNotificationSettings = ({
  pushNotifications,
  onSettingChange,
  isLoading,
  error,
}: PushNotificationSettingsProps) => {
  return (
    <div className='space-y-4'>
      <h3 className='text-lg font-medium'>Push Notifications</h3>

      {error && (
        <div className='p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md'>
          {error.message}
        </div>
      )}

      <div className='space-y-3'>
        <div className='flex items-center justify-between'>
          <Label htmlFor='push-followers' className='flex-1'>
            New followers
          </Label>
          <Switch
            id='push-followers'
            checked={pushNotifications.newFollowers}
            onCheckedChange={() => onSettingChange('newFollowers')}
            disabled={isLoading}
          />
        </div>

        <div className='flex items-center justify-between'>
          <Label htmlFor='push-events' className='flex-1'>
            Event updates
          </Label>
          <Switch
            id='push-events'
            checked={pushNotifications.eventUpdates}
            onCheckedChange={() => onSettingChange('eventUpdates')}
            disabled={isLoading}
          />
        </div>

        <div className='flex items-center justify-between'>
          <Label htmlFor='push-payments' className='flex-1'>
            Payment confirmations
          </Label>
          <Switch
            id='push-payments'
            checked={pushNotifications.paymentConfirmations}
            onCheckedChange={() => onSettingChange('paymentConfirmations')}
            disabled={isLoading}
          />
        </div>

        <div className='flex items-center justify-between'>
          <Label htmlFor='push-marketing' className='flex-1'>
            Marketing updates
          </Label>
          <Switch
            id='push-marketing'
            checked={pushNotifications.marketing}
            onCheckedChange={() => onSettingChange('marketing')}
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default PushNotificationSettings;
