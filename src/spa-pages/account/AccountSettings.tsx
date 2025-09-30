import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Settings as SettingsIcon,
  Bell,
  Globe,
  Moon,
  Sun,
  Monitor,
  Save,
  CheckCircle,
  Clock,
  History,
  AlertTriangle,
  Download,
  Upload,
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  updateNotificationPreferences,
  updatePrivacyPreferences,
  updateUserPreferences,
} from '@/services/user/api/preferences';
import { useUserPreferences } from '@/services/user/hooks/useUser';
import { debounce } from 'lodash';

interface SettingsState {
  // Notification settings
  emailNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
  eventReminders: boolean;
  productUpdates: boolean;
  messageNotifications: boolean;
  commentNotifications: boolean;

  // Privacy settings
  profileVisibility: 'public' | 'private' | 'friends';
  showEmail: boolean;
  showLocation: boolean;
  allowMessagesFromStrangers: boolean;
  showOnlineStatus: boolean;
  indexProfile: boolean;

  // App preferences
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
}

interface ChangeRecord {
  setting: string;
  oldValue: any;
  newValue: any;
  timestamp: string;
}

const AccountSettings = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'notifications';

  const [settings, setSettings] = useState<SettingsState>({
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    eventReminders: true,
    productUpdates: true,
    messageNotifications: true,
    commentNotifications: true,
    profileVisibility: 'public',
    showEmail: false,
    showLocation: true,
    allowMessagesFromStrangers: true,
    showOnlineStatus: true,
    indexProfile: true,
    theme: 'system',
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [changeHistory, setChangeHistory] = useState<ChangeRecord[]>([]);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  const { data: prefs, isLoading: prefsLoading } = useUserPreferences(user?.id);

  // Auto-save debounced function
  const debouncedSave = useCallback(
    debounce(async (newSettings: SettingsState, changedSetting?: string, oldValue?: any) => {
      if (!user) return;

      try {
        setSaving(true);

        // Update different preference categories
        const privacyPayload = {
          isPrivate: newSettings.profileVisibility !== 'public',
          showEmail: newSettings.showEmail,
          showLocation: newSettings.showLocation,
          allowMessagesFromStrangers: newSettings.allowMessagesFromStrangers,
          showOnlineStatus: newSettings.showOnlineStatus,
          indexProfile: newSettings.indexProfile,
        };

        const notificationsPayload = {
          email: newSettings.emailNotifications,
          push: newSettings.pushNotifications,
          eventReminders: newSettings.eventReminders,
          promotions: newSettings.marketingEmails,
          productUpdates: newSettings.productUpdates,
          messages: newSettings.messageNotifications,
          comments: newSettings.commentNotifications,
        };

        const appPrefsPayload = {
          theme: newSettings.theme,
          language: newSettings.language,
          timezone: newSettings.timezone,
          dateFormat: newSettings.dateFormat,
          timeFormat: newSettings.timeFormat,
        };

        // Execute updates in parallel
        const [privacyOk, notifOk, generalOk] = await Promise.all([
          updatePrivacyPreferences(user.id, privacyPayload),
          updateNotificationPreferences(user.id, notificationsPayload),
          updateUserPreferences(user.id, appPrefsPayload),
        ]);

        if (!privacyOk || !notifOk || !generalOk) {
          throw new Error('Failed to update preferences');
        }

        setLastSaved(new Date());
        setUnsavedChanges(false);

        // Add to change history if specific setting changed
        if (changedSetting && oldValue !== undefined) {
          const changeRecord: ChangeRecord = {
            setting: changedSetting,
            oldValue,
            newValue: (newSettings as any)[changedSetting],
            timestamp: new Date().toISOString(),
          };
          setChangeHistory(prev => [changeRecord, ...prev.slice(0, 9)]); // Keep last 10 changes
        }

        // Show subtle success indicator
        toast.success('Settings saved automatically', { duration: 2000 });
      } catch (error) {
        toast.error('Failed to save settings');
      } finally {
        setSaving(false);
      }
    }, 1500),
    [user]
  );

  // Load initial settings
  useEffect(() => {
    if (!user || prefsLoading || !prefs) return;

    const privacy = prefs.privacy || {};
    const notifications = prefs.notifications || {};

    setSettings({
      emailNotifications: Boolean(notifications.email),
      pushNotifications: Boolean(notifications.push),
      marketingEmails: Boolean(notifications.promotions),
      eventReminders: Boolean(notifications.eventReminders),
      productUpdates: Boolean(notifications.productUpdates),
      messageNotifications: Boolean(notifications.messages),
      commentNotifications: Boolean(notifications.comments),
      profileVisibility: privacy.isPrivate ? 'private' : 'public',
      showEmail: privacy.showEmail ?? false,
      showLocation: privacy.showLocation ?? true,
      allowMessagesFromStrangers: privacy.allowMessagesFromStrangers ?? true,
      showOnlineStatus: privacy.showOnlineStatus ?? true,
      indexProfile: privacy.indexProfile ?? true,
      theme: prefs.theme || 'system',
      language: prefs.language || 'en',
      timezone: prefs.timezone || 'UTC',
      dateFormat: prefs.dateFormat || 'MM/DD/YYYY',
      timeFormat: prefs.timeFormat || '12h',
    });

    setLoading(false);
  }, [user, prefs, prefsLoading]);

  // Handle setting changes with auto-save
  const updateSetting = (key: keyof SettingsState, value: any) => {
    const oldValue = settings[key];
    const newSettings = { ...settings, [key]: value };

    setSettings(newSettings);
    setUnsavedChanges(true);

    // Trigger auto-save
    debouncedSave(newSettings, key, oldValue);
  };

  const exportSettings = async () => {
    try {
      const exportData = {
        settings,
        changeHistory,
        exportedAt: new Date().toISOString(),
        version: '1.0',
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `commonly-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Settings exported successfully');
    } catch (error) {
      toast.error('Failed to export settings');
    }
  };

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
  ];

  const timezoneOptions = [
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'Eastern Time' },
    { value: 'America/Chicago', label: 'Central Time' },
    { value: 'America/Denver', label: 'Mountain Time' },
    { value: 'America/Los_Angeles', label: 'Pacific Time' },
    { value: 'Europe/London', label: 'London' },
    { value: 'Europe/Paris', label: 'Paris' },
    { value: 'Asia/Tokyo', label: 'Tokyo' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account preferences and app behavior
        </p>
      </div>

      {/* Auto-save Status */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {saving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                  <span className="text-green-800 font-medium">Saving...</span>
                </>
              ) : unsavedChanges ? (
                <>
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span className="text-amber-800 font-medium">Changes pending save...</span>
                </>
              ) : lastSaved ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-green-800 font-medium">
                    Auto-saved at {lastSaved.toLocaleTimeString()}
                  </span>
                </>
              ) : (
                <>
                  <SettingsIcon className="h-4 w-4 text-gray-600" />
                  <span className="text-gray-800 font-medium">Settings ready</span>
                </>
              )}
            </div>
            <Badge variant="secondary">Auto-save enabled</Badge>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Privacy
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            Preferences
          </TabsTrigger>
        </TabsList>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how and when you want to be notified about activity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications on your device
                    </p>
                  </div>
                  <Switch
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) => updateSetting('pushNotifications', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Event Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Get reminded about upcoming events you're attending
                    </p>
                  </div>
                  <Switch
                    checked={settings.eventReminders}
                    onCheckedChange={(checked) => updateSetting('eventReminders', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Message Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when you receive new messages
                    </p>
                  </div>
                  <Switch
                    checked={settings.messageNotifications}
                    onCheckedChange={(checked) => updateSetting('messageNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Comment Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when someone comments on your content
                    </p>
                  </div>
                  <Switch
                    checked={settings.commentNotifications}
                    onCheckedChange={(checked) => updateSetting('commentNotifications', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Marketing Emails</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive promotional and marketing emails
                    </p>
                  </div>
                  <Switch
                    checked={settings.marketingEmails}
                    onCheckedChange={(checked) => updateSetting('marketingEmails', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Product Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about new features and updates
                    </p>
                  </div>
                  <Switch
                    checked={settings.productUpdates}
                    onCheckedChange={(checked) => updateSetting('productUpdates', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>
                Control who can see your information and interact with you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base">Profile Visibility</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Control who can see your profile and information
                </p>
                <Select
                  value={settings.profileVisibility}
                  onValueChange={(value: 'public' | 'private' | 'friends') =>
                    updateSetting('profileVisibility', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public - Anyone can see</SelectItem>
                    <SelectItem value="friends">Friends Only</SelectItem>
                    <SelectItem value="private">Private - Only me</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Show Email Address</Label>
                    <p className="text-sm text-muted-foreground">
                      Display your email on your public profile
                    </p>
                  </div>
                  <Switch
                    checked={settings.showEmail}
                    onCheckedChange={(checked) => updateSetting('showEmail', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Show Location</Label>
                    <p className="text-sm text-muted-foreground">
                      Display your location on your profile
                    </p>
                  </div>
                  <Switch
                    checked={settings.showLocation}
                    onCheckedChange={(checked) => updateSetting('showLocation', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Show Online Status</Label>
                    <p className="text-sm text-muted-foreground">
                      Let others see when you're online
                    </p>
                  </div>
                  <Switch
                    checked={settings.showOnlineStatus}
                    onCheckedChange={(checked) => updateSetting('showOnlineStatus', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Allow Messages from Strangers</Label>
                    <p className="text-sm text-muted-foreground">
                      Let people you don't follow message you
                    </p>
                  </div>
                  <Switch
                    checked={settings.allowMessagesFromStrangers}
                    onCheckedChange={(checked) => updateSetting('allowMessagesFromStrangers', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Search Engine Indexing</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow search engines to index your profile
                    </p>
                  </div>
                  <Switch
                    checked={settings.indexProfile}
                    onCheckedChange={(checked) => updateSetting('indexProfile', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>App Preferences</CardTitle>
              <CardDescription>
                Customize how the app looks and behaves for you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <Label className="text-base">Theme</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Choose your preferred color scheme
                  </p>
                  <Select
                    value={settings.theme}
                    onValueChange={(value: 'light' | 'dark' | 'system') =>
                      updateSetting('theme', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {themeOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {option.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-base">Language</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Choose your preferred language
                  </p>
                  <Select
                    value={settings.language}
                    onValueChange={(value) => updateSetting('language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languageOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-base">Timezone</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Your local timezone for events and scheduling
                  </p>
                  <Select
                    value={settings.timezone}
                    onValueChange={(value) => updateSetting('timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timezoneOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-base">Time Format</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    How times are displayed throughout the app
                  </p>
                  <Select
                    value={settings.timeFormat}
                    onValueChange={(value: '12h' | '24h') => updateSetting('timeFormat', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12h">12-hour (2:30 PM)</SelectItem>
                      <SelectItem value="24h">24-hour (14:30)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Change History */}
          {changeHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Recent Changes
                </CardTitle>
                <CardDescription>
                  Track of your recent setting modifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {changeHistory.slice(0, 5).map((change, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div>
                        <span className="font-medium">{change.setting}</span>
                        <span className="text-muted-foreground mx-2">changed from</span>
                        <code className="bg-gray-100 px-1 rounded text-xs">
                          {String(change.oldValue) as string}
                        </code>
                        <span className="text-muted-foreground mx-2">to</span>
                        <code className="bg-gray-100 px-1 rounded text-xs">
                          {String(change.newValue) as string}
                        </code>
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {new Date(change.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Export Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Export Settings</CardTitle>
              <CardDescription>
                Download a backup of all your settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={exportSettings} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AccountSettings;