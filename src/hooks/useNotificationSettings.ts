import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { getUserPreferences, updateNotificationPreferences } from '@/services/user/api/preferences';

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
}

interface EmailNotificationSettings {
  newFollowers: boolean;
  eventUpdates: boolean;
  paymentConfirmations: boolean;
  marketing: boolean;
}

interface PushNotificationSettings {
  newFollowers: boolean;
  eventUpdates: boolean;
  paymentConfirmations: boolean;
  marketing: boolean;
}

interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  email: EmailNotificationSettings;
  push: PushNotificationSettings;
}

export const useNotificationSettings = () => {
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: false,
    smsNotifications: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Individual notification state
  const [emailNotifications, setEmailNotifications] = useState<EmailNotificationSettings>({
    newFollowers: true,
    eventUpdates: true,
    paymentConfirmations: true,
    marketing: false,
  });
  const [pushNotifications, setPushNotifications] = useState<PushNotificationSettings>({
    newFollowers: false,
    eventUpdates: true,
    paymentConfirmations: true,
    marketing: false,
  });

  const handleEmailNotificationChange = async (setting: string) => {
    const newSettings = {
          ...emailNotifications,
      [setting]: !emailNotifications[setting as keyof EmailNotificationSettings],
    };
    setEmailNotifications(newSettings);
    await updateSettings({
          ...settings,
      emailNotifications: Object.values(newSettings).some(Boolean),
    });
  };

  const handlePushNotificationChange = async (setting: string) => {
    const newSettings = {
          ...pushNotifications,
      [setting]: !pushNotifications[setting as keyof PushNotificationSettings],
    };
    setPushNotifications(newSettings);
    await updateSettings({
          ...settings,
      pushNotifications: Object.values(newSettings).some(Boolean),
    });
  };

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const prefs = await getUserPreferences(user.id);
        const n = (prefs?.notifications ?? {}) as Record<string, boolean>;

        setSettings({
          emailNotifications: Boolean(n.email),
          pushNotifications: Boolean(n.push),
          // sms not modeled in canonical schema; keep local only
          smsNotifications: false,
        });

        // Initialize nested UI state (not persisted granularly for now)
        setEmailNotifications({
          newFollowers: Boolean(n.newFollowers),
          eventUpdates: Boolean(n.eventReminders),
          paymentConfirmations: Boolean(n.paymentConfirmations),
          marketing: Boolean(n.promotions),
        });
        setPushNotifications({
          newFollowers: Boolean(n.push_newFollowers),
          eventUpdates: Boolean(n.eventReminders),
          paymentConfirmations: Boolean(n.push_paymentConfirmations),
          marketing: Boolean(n.push_marketing),
        });
      } catch (err) {
        setError(new Error('Failed to load notification settings'));
        toast.error('Failed to load notification settings');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const updateSettings = async (newSettings: NotificationSettings) => {
    try {
      setIsSaving(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Persist core booleans to centralized preferences
      const ok = await updateNotificationPreferences(user.id, {
        email: newSettings.emailNotifications,
        push: newSettings.pushNotifications,
        eventReminders: emailNotifications.eventUpdates || pushNotifications.eventUpdates,
        promotions: emailNotifications.marketing || pushNotifications.marketing,
        paymentConfirmations:
          emailNotifications.paymentConfirmations || pushNotifications.paymentConfirmations,
      } as any);
      if (!ok) throw new Error('Failed to update preferences');

      setSettings(newSettings);
      toast.success('Notification settings updated');
    } catch (err) {
      setError(new Error('Failed to update notification settings'));
      toast.error('Failed to update notification settings');
    } finally {
      setIsSaving(false);
    }
  };

  return {
    settings,
    isLoading,
    isSaving,
    error,
    emailNotifications,
    pushNotifications,
    handleEmailNotificationChange,
    handlePushNotificationChange,
    updateSettings,
  };
};
