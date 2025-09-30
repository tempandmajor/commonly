import { useState } from 'react';
import { toast } from 'sonner';
import { ProfileData } from './types';

export function useProfileForm(userId?: string) {
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    username: '',
    bio: '',
    email: '',
    phoneNumber: '',
    isPrivate: false,
    isEligibleForSubscription: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
          ...prev,
      [name]: value,
    }));
  };

  const updateProfileData = async (data?: ProfileData) => {
    if (!userId) return;

    setIsSaving(true);
    const dataToUpdate = data || profileData;

    try {
      // Mock implementation since tables don't exist yet
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    profileData,
    isSaving,
    isUploading,
    handleProfileChange,
    updateProfileData,
    setProfileData,
  };
}
