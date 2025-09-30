import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye, Users, Shield, Download, Trash2 } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';

type ProfileVisibility = 'public' | 'private' | 'friends';
type MessageSettings = 'everyone' | 'friends' | 'nobody';

const PrivacySection = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profileVisibility, setProfileVisibility] = useState<ProfileVisibility>('public');
  const [allowMessages, setAllowMessages] = useState<MessageSettings>('everyone');
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [allowTagging, setAllowTagging] = useState(true);
  const [analyticsOptOut, setAnalyticsOptOut] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchPrivacySettings();
    }
  }, [user?.id]);

  const fetchPrivacySettings = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      // Use database instead of mock data
      // ... existing code ...
    } catch (error) {
      toast.error('Failed to load privacy settings');
    } finally {
      setLoading(false);
    }
  };

  const updatePrivacySetting = async (setting: string, value: unknown) => {
    if (!user?.id) return;

    try {
      // ... existing code ...
    } catch (error) {
      toast.error('Failed to update privacy setting');
    }
  };

  const handleProfileVisibilityChange = (value: ProfileVisibility) => {
    setProfileVisibility(value);
    updatePrivacySetting('profileVisibility', value);
  };

  const handleMessageSettingsChange = (value: MessageSettings) => {
    setAllowMessages(value);
    updatePrivacySetting('allowMessages', value);
  };

  const handleOnlineStatusToggle = (enabled: boolean) => {
    setShowOnlineStatus(enabled);
    updatePrivacySetting('showOnlineStatus', enabled);
  };

  const handleTaggingToggle = (enabled: boolean) => {
    setAllowTagging(enabled);
    updatePrivacySetting('allowTagging', enabled);
  };

  const handleAnalyticsToggle = (optOut: boolean) => {
    setAnalyticsOptOut(optOut);
    updatePrivacySetting('analyticsOptOut', optOut);
  };

  const handleDataExport = async () => {
    try {
      toast.info("Data export request submitted. You'll receive an email when ready.");
      // In a real app, this would trigger a data export process
    } catch (error) {
      toast.error('Failed to request data export');
    }
  };

  const handleDataDeletion = async () => {
    try {
      toast.info('Account deletion request submitted. Please check your email for confirmation.');
      // In a real app, this would initiate account deletion process
    } catch (error) {
      toast.error('Failed to request account deletion');
    }
  };

  if (loading) {
    return (
      <div className='space-y-6'>
        <Card>
          <CardContent className='p-6'>
            <div className='animate-pulse space-y-4'>
              <div className='h-4 bg-gray-200 rounded w-1/4' />
              <div className='h-3 bg-gray-200 rounded w-1/2' />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Eye className='h-5 w-5' />
            Profile Visibility
          </CardTitle>
          <CardDescription>Control who can see your profile and content</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <Label>Who can see your profile</Label>
            <Select value={profileVisibility} onValueChange={handleProfileVisibilityChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='public'>Everyone</SelectItem>
                <SelectItem value='friends'>Friends only</SelectItem>
                <SelectItem value='private'>Only me</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Users className='h-5 w-5' />
            Communication Settings
          </CardTitle>
          <CardDescription>Manage how others can interact with you</CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='space-y-2'>
            <Label>Who can send you messages</Label>
            <Select value={allowMessages} onValueChange={handleMessageSettingsChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='everyone'>Everyone</SelectItem>
                <SelectItem value='friends'>Friends only</SelectItem>
                <SelectItem value='nobody'>Nobody</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='flex items-center justify-between'>
            <div className='space-y-1'>
              <Label htmlFor='online-status'>Show online status</Label>
              <p className='text-sm text-muted-foreground'>Let others see when you're online</p>
            </div>
            <Switch
              id='online-status'
              checked={showOnlineStatus}
              onCheckedChange={handleOnlineStatusToggle}
            />
          </div>

          <div className='flex items-center justify-between'>
            <div className='space-y-1'>
              <Label htmlFor='tagging'>Allow tagging</Label>
              <p className='text-sm text-muted-foreground'>
                Let others tag you in posts and comments
              </p>
            </div>
            <Switch id='tagging' checked={allowTagging} onCheckedChange={handleTaggingToggle} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Shield className='h-5 w-5' />
            Data & Analytics
          </CardTitle>
          <CardDescription>
            Control how your data is used for analytics and improvements
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div className='space-y-1'>
              <Label htmlFor='analytics'>Opt out of analytics</Label>
              <p className='text-sm text-muted-foreground'>
                Prevent your usage data from being collected for analytics
              </p>
            </div>
            <Switch
              id='analytics'
              checked={analyticsOptOut}
              onCheckedChange={handleAnalyticsToggle}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Export or delete your account data</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center justify-between p-4 border rounded-lg'>
            <div className='space-y-1'>
              <p className='font-medium'>Export your data</p>
              <p className='text-sm text-muted-foreground'>Download a copy of all your data</p>
            </div>
            <Button variant='outline' onClick={handleDataExport}>
              <Download className='h-4 w-4 mr-2' />
              Export
            </Button>
          </div>

          <div className='flex items-center justify-between p-4 border rounded-lg border-red-200'>
            <div className='space-y-1'>
              <p className='font-medium text-red-900'>Delete your account</p>
              <p className='text-sm text-red-600'>Permanently delete your account and all data</p>
            </div>
            <Button variant='destructive' onClick={handleDataDeletion}>
              <Trash2 className='h-4 w-4 mr-2' />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacySection;
