import React, { useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { User } from '@/types/auth';
import AvatarUploader from './AvatarUploader';
import CoverPhotoUploader from './CoverPhotoUploader';
import ProfileForm from './ProfileForm';

interface ProfileSectionProps {
  user: User | null;
  coverImageUrl?: string | undefined; // Add cover image URL as a prop
}

const ProfileSection = ({ user, coverImageUrl: initialCoverImageUrl }: ProfileSectionProps) => {
  const { isAuthenticated, updateUserData } = useAuth();
  const [updatedUser, setUpdatedUser] = useState(user);
  // Initialize with the actual cover image URL from props
  const [coverImageUrl, setCoverImageUrl] = useState<string>(initialCoverImageUrl || '');

  const handleAvatarUpdate = (newAvatarUrl: string) => {
    if (user) {
      const updatedUserData = {
          ...user,
        profilePicture: newAvatarUrl,
        avatar_url: newAvatarUrl,
      };
      setUpdatedUser(updatedUserData);

      if (updateUserData) {
        updateUserData(updatedUserData);
      }
    }
  };

  const handleCoverUpdate = (newCoverUrl: string) => {
    setCoverImageUrl(newCoverUrl);

    // Update the user data to sync with parent component
    if (user && updateUserData) {
      const updatedUserData = {
          ...user,
        cover_image_url: newCoverUrl,
      };
      updateUserData(updatedUserData);
    }
  };

  return (
    <div className='space-y-6'>
      <CoverPhotoUploader
        user={updatedUser || user}
        coverImageUrl={coverImageUrl}
        onCoverUpdate={handleCoverUpdate}
      />

      <div className='flex flex-col items-center gap-6 md:flex-row md:items-start'>
        <AvatarUploader user={updatedUser || user} onAvatarUpdate={handleAvatarUpdate} />
        <ProfileForm user={updatedUser || user} isAuthenticated={isAuthenticated} />
      </div>
    </div>
  );
};

export default ProfileSection;
