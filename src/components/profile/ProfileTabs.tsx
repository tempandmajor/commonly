import { User } from '@/lib/types';
import { Event } from '@/lib/types/event';
import { TabsLayout } from './tabs/TabsLayout';

interface ProfileTabsProps {
  createdEvents: Event[];
  upcomingEvents: Event[];
  isOwnProfile: boolean;
  user: User;
  isSubscribed: boolean;
  username: string;
  isEligibleForSubscription: boolean;
  hasStore: boolean;
  onSubscribe: () => void;
  isLoadingEvents?: boolean | undefined;
}

const ProfileTabs = ({
  createdEvents,
  upcomingEvents,
  isOwnProfile,
  user,
  isSubscribed,
  username,
  isEligibleForSubscription,
  hasStore,
  onSubscribe,
  isLoadingEvents = false,
}: ProfileTabsProps) => {
  return (
    <TabsLayout
      createdEvents={createdEvents}
      upcomingEvents={upcomingEvents}
      isOwnProfile={isOwnProfile}
      user={user}
      isSubscribed={isSubscribed}
      username={username}
      isEligibleForSubscription={isEligibleForSubscription}
      hasStore={hasStore}
      onSubscribe={onSubscribe}
      isLoadingEvents={isLoadingEvents}
    />
  );
};

export default ProfileTabs;
