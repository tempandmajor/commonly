import React, { useEffect, useState } from 'react';
import { User } from '@/lib/types/user';
import { AppUser } from '@/types/user';
import { Event } from '@/lib/types/event';
import ProfileHeader from './sections/ProfileHeader';
import { TabsLayout } from './tabs/TabsLayout';
import { RetryError } from '@/components/ui/retry-error';
import ProfileAnalytics from '@/components/analytics/ProfileAnalytics';
import { useProfileState } from '@/hooks/profile/useProfileState';

export interface UserProfileProps {
  user: User;
  createdEvents: Event[];
  upcomingEvents: Event[];
  isOwnProfile: boolean;
  followers: unknown[];
  following: unknown[];
  isLoadingEvents: boolean;
  eventsError: string | null;
  onRetryEvents: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({
  user,
  createdEvents,
  upcomingEvents,
  isOwnProfile,
  followers,
  following,
  isLoadingEvents,
  eventsError,
  onRetryEvents,
}) => {
  const {
    isFollowing,
    handleFollowToggle,
    handleMessageClick,
    handleSubscribeClick,
    isPrivateProfile,
    isSubscribed,
    showSubscriptionSetup,
  } = useProfileState({ userId: user.id });

  // Convert User to AppUser for compatibility - ensure updated_at is provided
  const appUser: AppUser = {
          ...user,
    created_at: user.created_at || new Date().toISOString(),
    updated_at: user.updated_at || new Date().toISOString(),
  };

  return (
    <ProfileAnalytics userId={user.id}>
      <div className='space-y-8'>
        <ProfileHeader
          user={appUser}
          isOwnProfile={isOwnProfile}
          isFollowing={isFollowing}
          followersCount={followers?.followersCount || 0}
          followingCount={following?.followingCount || 0}
          onFollowToggle={handleFollowToggle}
          onMessageClick={handleMessageClick}
        />

        {eventsError && (
          <RetryError title='Failed to load events' message={eventsError} onRetry={onRetryEvents} />
        )}

        <TabsLayout
          createdEvents={createdEvents}
          upcomingEvents={upcomingEvents}
          isOwnProfile={isOwnProfile}
          user={appUser}
          isSubscribed={isSubscribed}
          username={user.username || user.id}
          isEligibleForSubscription={user.isEligibleForSubscription || false}
          hasStore={user.hasStore || false}
          onSubscribe={handleSubscribeClick}
          isLoadingEvents={isLoadingEvents}
        />
      </div>
    </ProfileAnalytics>
  );
};

export default UserProfile;
