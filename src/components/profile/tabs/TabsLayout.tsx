import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { User } from '@/lib/types';
import { Event } from '@/lib/types/event';
import { PodcastsTab } from './PodcastsTab';
import EventsTab from './EventsTab';
import StoreTab from './StoreTab';
import SubscriptionTab from './SubscriptionTab';
import AboutTab from './AboutTab';
import ActivityTab from './ActivityTab';
import CommunitiesTab from './CommunitiesTab';
import CreatorProgramDashboard from '@/components/creator/CreatorProgramDashboard';
import { AppUser } from '@/types/user';

interface TabsLayoutProps {
  userId?: string | undefined;
  isOwnProfile: boolean;
  username?: string | undefined;
  createdEvents?: Event[] | undefined;
  upcomingEvents?: Event[] | undefined;
  user?: User | undefined;
  isSubscribed?: boolean | undefined;
  isEligibleForSubscription?: boolean | undefined;
  hasStore?: boolean | undefined;
  onSubscribe?: () => void | undefined;
  isLoadingEvents?: boolean | undefined;
  onEditProfile?: () => void | undefined;
}

export const TabsLayout = ({
  userId,
  isOwnProfile,
  username = 'User',
  createdEvents = [],
  upcomingEvents = [],
  user,
  isSubscribed = false,
  isEligibleForSubscription = false,
  hasStore = false,
  onSubscribe,
  isLoadingEvents = false,
  onEditProfile,
}: TabsLayoutProps) => {
  const [activeTab, setActiveTab] = useState('about');

  // Convert User to AppUser for compatibility
  const appUser: AppUser = user
    ? {
          ...user,
        created_at: user.created_at || new Date().toISOString(),
        updated_at: user.updated_at || new Date().toISOString(),
        isEligibleForSubscription,
        hasStore,
      }
    : {
        id: userId || '',
        email: '',
        name: username,
        username: username,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        isEligibleForSubscription,
        hasStore,
      };

  // Calculate number of tabs to determine grid layout
  // Base tabs: About, Events, Activity, Communities, Podcasts, Store = 6
  // Optional: Creator Program (owner only), Subscription (eligible only)
  const baseTabs = 6;
  const optionalTabs = (isOwnProfile ? 1 : 0) + (isEligibleForSubscription ? 1 : 0);
  const totalTabs = baseTabs + optionalTabs;

  // Grid layout based on total tabs
  const getGridCols = (count: number) => {
    if (count <= 4) return 'grid-cols-4';
    if (count <= 5) return 'grid-cols-5';
    if (count <= 6) return 'grid-cols-6';
    if (count <= 7) return 'grid-cols-7';
    return 'grid-cols-8';
  };

  return (
    <div className='space-y-6'>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={`grid w-full ${getGridCols(totalTabs)}`}>
          <TabsTrigger value='about'>About</TabsTrigger>

          <TabsTrigger value='events' className='flex items-center gap-2'>
            Events
            <Badge variant='secondary' className='text-xs'>
              {createdEvents.length + upcomingEvents.length}
            </Badge>
          </TabsTrigger>

          <TabsTrigger value='activity'>Activity</TabsTrigger>

          <TabsTrigger value='communities'>Communities</TabsTrigger>

          <TabsTrigger value='podcasts'>Podcasts</TabsTrigger>

          {/* Creator Program tab - only visible to profile owner */}
          {isOwnProfile && (
            <TabsTrigger value='creator-program' className='flex items-center gap-2'>
              Creator Program
            </TabsTrigger>
          )}

          {isEligibleForSubscription && (
            <TabsTrigger value='subscription'>Subscription</TabsTrigger>
          )}

          <TabsTrigger value='store' className='flex items-center gap-2'>
            Store
            {hasStore && (
              <Badge variant='secondary' className='text-xs'>
                Active
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value='about' className='mt-6'>
          <AboutTab user={appUser} isOwnProfile={isOwnProfile} onEditProfile={onEditProfile} />
        </TabsContent>

        <TabsContent value='events' className='mt-6'>
          <EventsTab
            createdEvents={createdEvents}
            upcomingEvents={upcomingEvents}
            isOwnProfile={isOwnProfile}
            username={username}
            isLoading={isLoadingEvents}
          />
        </TabsContent>

        <TabsContent value='activity' className='mt-6'>
          <ActivityTab
            userId={userId || user?.id || ''}
            isOwnProfile={isOwnProfile}
            username={username}
          />
        </TabsContent>

        <TabsContent value='communities' className='mt-6'>
          <CommunitiesTab
            userId={userId || user?.id || ''}
            isOwnProfile={isOwnProfile}
            username={username}
          />
        </TabsContent>

        <TabsContent value='podcasts' className='mt-6'>
          <PodcastsTab
            userId={userId || user?.id || ''}
            isOwnProfile={isOwnProfile}
            username={username}
            user={user}
          />
        </TabsContent>

        {/* Creator Program content - only visible to profile owner */}
        {isOwnProfile && (
          <TabsContent value='creator-program' className='mt-6'>
            <CreatorProgramDashboard />
          </TabsContent>
        )}

        {isEligibleForSubscription && (
          <TabsContent value='subscription' className='mt-6'>
            <SubscriptionTab
              user={appUser}
              isOwnProfile={isOwnProfile}
              isSubscribed={isSubscribed}
              onSubscribe={onSubscribe || (() => {})}
            />
          </TabsContent>
        )}

        <TabsContent value='store' className='mt-6'>
          <StoreTab
            userId={userId || user?.id || ''}
            isOwnProfile={isOwnProfile}
            username={username}
            hasStore={hasStore}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
