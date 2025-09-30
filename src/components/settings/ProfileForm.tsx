import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { WifiOff } from 'lucide-react';
import { User } from '@/types/auth';
import { useProfileState } from '@/hooks/profile/useProfileState';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form } from '@/components/ui/form';
import UsernameField from './form-fields/UsernameField';
import EmailField from './form-fields/EmailField';
import FormActions from './form-fields/FormActions';
import { useProfileFormValidation } from '@/hooks/settings/useProfileFormValidation';

interface ProfileFormProps {
  user: User | null;
  isAuthenticated: boolean;
}

const ProfileForm = ({ user, isAuthenticated }: ProfileFormProps) => {
  // Initialize react-hook-form
  const form = useForm({
    defaultValues: {
      name: '',
      username: '',
      email: '',
    },
  });

  // Initialize useProfileState with the user's ID if available
  const { profileData, isSaving, handleProfileChange, updateProfileData, isOffline } =
    useProfileState(user ? { userId: user.id } : {});

  // Initialize form validation hooks
  const { usernameError, isCheckingUsername, validateUsername, setUsernameError } =
    useProfileFormValidation({
      ...(user && { currentUsername: user.username }),
      isOffline,
    });

  // Track if form has changes

  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // Track changes compared to original user data
    if (user) {
      const hasNameChange = profileData.name !== user.name;
      const hasUsernameChange = profileData.username !== user.username;
      setHasChanges(hasNameChange || hasUsernameChange);
    }

  }, [profileData, user]);

  useEffect(() => {
    // Update form values when user data is available
    if (user) {
      form.reset({
        name: user.name || '',
        username: user.username || '',
        email: user.email || '',
      });
    }
  }, [user, form]);

  // Update form data when profileData changes
  useEffect(() => {
    form.setValue('name', profileData.name || '');
    form.setValue('username', profileData.username || '');
    form.setValue('email', profileData.email || '');
  }, [profileData, form]);

  const handleUsernameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    handleProfileChange(e);

    const username = (e.target as HTMLInputElement).value;
    if (username !== user.username) {
      await validateUsername(username);
    } else {
      setUsernameError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isOffline) {
      toast.error('Cannot update profile while offline');
      return;
    }

    // Validate username if it changed
    if (profileData.username && profileData.username !== user.username) {
      const isValid = await validateUsername(profileData.username);
      if (!isValid) return;
    }

    try {
      // Pass the profile data to the update function
      await updateProfileData(profileData);
      setHasChanges(false);
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className='w-full space-y-6'>
        {isOffline && (
          <Alert variant='destructive' className='bg-amber-50 text-amber-800 border-amber-300'>
            <WifiOff className='h-4 w-4' />
            <AlertDescription>
              You are currently offline. Profile changes will not be saved until you're back online.
            </AlertDescription>
          </Alert>
        )}

        <div className='space-y-2'>
          <label
            htmlFor='name'
            className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
          >
            Full Name
          </label>
          <input
            id='name'
            name='name'
            value={profileData.name || ''}
            onChange={handleProfileChange}
            placeholder='Your full name'
            aria-required='true'
            className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm'
          />
        </div>

        <UsernameField
          username={profileData.username || ''}
          onChange={handleUsernameChange}
          error={usernameError}
          isChecking={isCheckingUsername}
          isDisabled={isOffline}
        />

        <EmailField email={profileData.email || ''} />

        <FormActions
          isSaving={isSaving}
          isDisabled={
            !isAuthenticated || isCheckingUsername || !!usernameError || isOffline || !hasChanges
          }
        />
      </form>
    </Form>
  );

};

export default ProfileForm;
