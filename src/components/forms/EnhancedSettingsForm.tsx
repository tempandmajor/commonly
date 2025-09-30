'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useKeyboardShortcuts, createSaveShortcut } from '@/hooks/useKeyboardShortcuts';
import {
  FormField,
  FormSection,
  SearchSelect,
  SearchSelectOption,
} from '@/components/forms/shared';
import {
  settingsSchema,
  settingsDefaults,
  SettingsValues,
} from '@/lib/validations/settingsValidation';
import {
  User,
  Shield,
  Bell,
  Settings,
  Eye,
  Lock,
  Mail,
  Globe,
  Save,
  RefreshCw,
  Moon,
  Sun,
  Monitor,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedSettingsFormProps {
  onSave?: (category: string, data: unknown) => Promise<void> | undefined;
  onResetSection?: (category: string, section: string) => Promise<void> | undefined;
  defaultValues?: Partial<SettingsValues> | undefined;
  activeTab?: string | undefined;
  showUnsavedChanges?: boolean | undefined;
  className?: string | undefined;
}

export const EnhancedSettingsForm: React.FC<EnhancedSettingsFormProps> = ({
  onSave,
  defaultValues = {},
  activeTab = 'account',
  className,
}) => {
  const { toast } = useToast();
  const [currentTab, setCurrentTab] = useState(activeTab);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
          ...settingsDefaults,
          ...defaultValues,
    },
  });

  // Keyboard shortcuts
  useKeyboardShortcuts([createSaveShortcut(() => handleSave(currentTab))]);

  const handleSave = async (categoryId: string) => {
    setIsSubmitting(true);

    try {
      const formData = form.getValues();
      const categoryData = formData[categoryId as keyof SettingsValues];

      if (onSave) {
        await onSave(categoryId, categoryData);
      }

      toast({
        title: 'Settings saved',
        description: `Your ${categoryId} settings have been updated successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Failed to save settings',
        description: 'Please try again or contact support.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const themeOptions: SearchSelectOption[] = [
    {
      value: 'light',
      label: 'Light',
      icon: <Sun className='w-4 h-4' />,
      description: 'Light theme',
    },
    { value: 'dark', label: 'Dark', icon: <Moon className='w-4 h-4' />, description: 'Dark theme' },
    {
      value: 'system',
      label: 'System',
      icon: <Monitor className='w-4 h-4' />,
      description: 'Follow system theme',
    },
  ];

  const languageOptions: SearchSelectOption[] = [
    { value: 'en', label: 'English', icon: <Globe className='w-4 h-4' /> },
  ];

  const renderAccountTab = () => (
    <div className='space-y-6'>
      <FormSection title='Profile Information' icon={<User className='w-4 h-4' />}>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <FormField
            form={form}
            name='account.profile.firstName'
            label='First Name'
            placeholder='Your first name'
            required
          />
          <FormField
            form={form}
            name='account.profile.lastName'
            label='Last Name'
            placeholder='Your last name'
            required
          />
        </div>

        <FormField
          form={form}
          name='account.profile.displayName'
          label='Display Name'
          placeholder='How others see your name'
          required
        />

        <FormField
          form={form}
          name='account.profile.bio'
          label='Bio'
          placeholder='Tell others about yourself...'
          type='textarea'
        />
      </FormSection>

      <FormSection title='Contact & Security' icon={<Lock className='w-4 h-4' />}>
        <FormField
          form={form}
          name='account.email.primary'
          label='Primary Email'
          placeholder='your@email.com'
          type='email'
          required
          icon={<Mail className='w-4 h-4' />}
        />

        <Alert>
          <Lock className='w-4 h-4' />
          <AlertDescription>
            Two-factor authentication adds an extra layer of security to your account.
          </AlertDescription>
        </Alert>
      </FormSection>
    </div>
  );

  const renderPrivacyTab = () => (
    <div className='space-y-6'>
      <FormSection title='Profile Privacy' icon={<Eye className='w-4 h-4' />}>
        <div className='space-y-4'>
          <div>
            <label className='text-sm font-medium mb-2 block'>Profile Visibility</label>
            <SearchSelect
              options={[
                { value: 'public', label: 'Public', description: 'Anyone can see your profile' },
                {
                  value: 'private',
                  label: 'Private',
                  description: 'Only you can see your profile',
                },
                {
                  value: 'friends',
                  label: 'Friends Only',
                  description: 'Only friends can see your profile',
                },
              ]}
              value='public'
              onChange={() => {}}
              placeholder='Select visibility'
            />
          </div>
        </div>
      </FormSection>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className='space-y-6'>
      <FormSection title='Email Notifications' icon={<Mail className='w-4 h-4' />}>
        <div className='space-y-4'>
          <div className='flex items-center space-x-3'>
            <input
              type='checkbox'
              id='email-notifications'
          {...form.register('notifications.email.enabled')}
            />
            <label htmlFor='email-notifications' className='text-sm font-medium'>
              Enable email notifications
            </label>
          </div>
        </div>
      </FormSection>
    </div>
  );

  const renderPreferencesTab = () => (
    <div className='space-y-6'>
      <FormSection title='Display Settings' icon={<Settings className='w-4 h-4' />}>
        <div className='space-y-4'>
          <div>
            <label className='text-sm font-medium mb-2 block'>Theme</label>
            <SearchSelect
              options={themeOptions}
              value='system'
              onChange={() => {}}
              placeholder='Select theme'
            />
          </div>

          <div>
            <label className='text-sm font-medium mb-2 block'>Language</label>
            <SearchSelect
              options={languageOptions}
              value='en'
              onChange={() => {}}
              placeholder='Select language'
            />
          </div>
        </div>
      </FormSection>
    </div>
  );

  return (
    <Card className={cn('w-full max-w-4xl mx-auto', className)}>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Settings className='w-5 h-5' />
          Settings
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Tabs value={currentTab} onValueChange={setCurrentTab} className='space-y-6'>
          <TabsList className='grid w-full grid-cols-4'>
            <TabsTrigger value='account' className='flex items-center gap-2'>
              <User className='w-4 h-4' />
              Account
            </TabsTrigger>
            <TabsTrigger value='privacy' className='flex items-center gap-2'>
              <Shield className='w-4 h-4' />
              Privacy
            </TabsTrigger>
            <TabsTrigger value='notifications' className='flex items-center gap-2'>
              <Bell className='w-4 h-4' />
              Notifications
            </TabsTrigger>
            <TabsTrigger value='preferences' className='flex items-center gap-2'>
              <Settings className='w-4 h-4' />
              Preferences
            </TabsTrigger>
          </TabsList>

          <form className='space-y-6'>
            <TabsContent value='account' className='space-y-6'>
              {renderAccountTab()}
            </TabsContent>

            <TabsContent value='privacy' className='space-y-6'>
              {renderPrivacyTab()}
            </TabsContent>

            <TabsContent value='notifications' className='space-y-6'>
              {renderNotificationsTab()}
            </TabsContent>

            <TabsContent value='preferences' className='space-y-6'>
              {renderPreferencesTab()}
            </TabsContent>

            <Separator />

            <div className='flex justify-between'>
              <Button
                type='button'
                variant='outline'
                onClick={() => form.reset()}
                disabled={isSubmitting}
              >
                <RefreshCw className='w-4 h-4 mr-2' />
                Reset
              </Button>

              <Button type='button' onClick={() => handleSave(currentTab)} disabled={isSubmitting}>
                <Save className='w-4 h-4 mr-2' />
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default EnhancedSettingsForm;
