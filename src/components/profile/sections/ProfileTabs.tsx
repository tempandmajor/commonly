import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Event } from '@/lib/types/event';
import { TabsLayout } from '../tabs/TabsLayout';
import { AppUser } from '@/types/user';

interface ProfileTabsProps {
  user: AppUser;
  isOwnProfile: boolean;
  username: string;
  onEditProfile?: () => void | undefined;
}

export const ProfileTabs = ({ user, isOwnProfile, username, onEditProfile }: ProfileTabsProps) => {
  const [createdEvents, setCreatedEvents] = useState<Event[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(true);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!user?.id) return;

      setIsLoadingEvents(true);
      try {
        // Fetch events created by the user
        const { data: createdEventsData, error: createdError } = await supabase
          .from('events')
          .select('*')
          .eq('creator_id', user.id)
          .order('start_date', { ascending: true });

        if (createdError) {
        } else {
          setCreatedEvents(createdEventsData || []);
        }

        // Fetch events the user is attending (through event registrations)
        const { data: registrations, error: registrationsError } = await supabase
          .from('event_attendees')
          .select(
            `
            *,
            event:events(*)
          `
          )
          .eq('user_id', user.id)
          .gt('events.start_date', new Date().toISOString())
          .order('events.start_date', { ascending: true });

        if (registrationsError) {
        } else {
          // Extract the events from the registrations
          const attending = registrations?.map(reg => reg.event) || [];
          setUpcomingEvents(attending as Event[]);
        }

        // Check if user is subscribed to any plans
        const { data: subscription, error: subscriptionError } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();

        if (subscriptionError && subscriptionError.code !== 'PGRST116') {
          // PGRST116 is not found
        } else {
          setIsSubscribed(!!subscription);
        }
      } catch (_error) {
        // Error handling silently ignored
      } finally {
        setIsLoadingEvents(false);
      }
    };

    fetchEvents();
  }, [user?.id]);

  return (
    <TabsLayout
      user={user}
      isOwnProfile={isOwnProfile}
      username={username}
      createdEvents={createdEvents}
      upcomingEvents={upcomingEvents}
      isSubscribed={isSubscribed}
      isEligibleForSubscription={user.isEligibleForSubscription || false}
      hasStore={user.hasStore || false}
      onSubscribe={() => {}}
      isLoadingEvents={isLoadingEvents}
      onEditProfile={onEditProfile}
    />
  );
};
