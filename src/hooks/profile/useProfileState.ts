import { UseProfileStateProps } from './types';
import { useProfileData } from './useProfileData';
import { useFollowActions } from './useFollowActions';
import { useProfileActions } from './useProfileActions';
import { useProfileForm } from './useProfileForm';
import { User as AuthUser } from '@/types/auth';

export interface ProfileStateReturn {
  isLoading: boolean;
  userData: AuthUser | null;
  userPosts: unknown[];
  isFollowing: boolean;
  followersCount: number;
  followingCount: number;
  showSubscriptionSetup: boolean;
  isPrivateProfile: boolean;
  isSubscribed: boolean;
  handleFollowToggle: () => void;
  handleMessageClick: () => void; // Updated to match type definition
  handleSubscribeClick: () => void;
  handlePrivacyToggle: () => void;
  profileData: unknown;
  isSaving: boolean;
  handleProfileChange: (data: unknown) => void;
  updateProfileData: (data?: unknown) => Promise<void> | undefined;
  isUploading: boolean;
  error: unknown;
  isOffline: boolean;
  retry: () => void;
}

export function useProfileState({ userId }: UseProfileStateProps = {}): ProfileStateReturn {
  const {
    isLoading,
    userData: rawUserData,
    userPosts,
    followersCount,
    followingCount,
    error,
    isOffline,
    retry,
  } = useProfileData(userId);

  // Convert User from lib/types/user to User from types/auth
  const userData = rawUserData as AuthUser | null;

  const { isFollowing, handleFollowToggle } = useFollowActions(userId);

  const {
    isPrivateProfile,
    showSubscriptionSetup,
    isSubscribed,
    handleMessageClick,
    handleSubscribeClick,
    handlePrivacyToggle,
  } = useProfileActions(userId);

  const { profileData, isSaving, isUploading, handleProfileChange, updateProfileData } =
    useProfileForm(userId);

  return {
    isLoading,
    userData,
    userPosts,
    isFollowing,
    followersCount,
    followingCount,
    showSubscriptionSetup,
    isPrivateProfile,
    isSubscribed,
    handleFollowToggle,
    handleMessageClick,
    handleSubscribeClick,
    handlePrivacyToggle,
    profileData,
    isSaving,
    handleProfileChange,
    updateProfileData,
    isUploading,
    error,
    isOffline,
    retry,
  };
}
