import { User } from '@/lib/types/user';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import EmailNotificationSettings from './notifications/EmailNotificationSettings';
import PushNotificationSettings from './notifications/PushNotificationSettings';

interface NotificationsSectionProps {
  user: User | null;
}

const NotificationsSection = ({ user }: NotificationsSectionProps) => {
  const {
    emailNotifications,
    pushNotifications,
    isLoading,
    error,
    handleEmailNotificationChange,
    handlePushNotificationChange,
  } = useNotificationSettings();

  return (
    <div className='space-y-6'>
      <h2 className='text-xl font-semibold tracking-tight'>Notification Settings</h2>

      <div className='space-y-8'>
        <EmailNotificationSettings
          emailNotifications={emailNotifications}
          onSettingChange={handleEmailNotificationChange}
          isLoading={isLoading}
          error={error}
        />

        <PushNotificationSettings
          pushNotifications={pushNotifications}
          onSettingChange={handlePushNotificationChange}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </div>
  );
};

export default NotificationsSection;
