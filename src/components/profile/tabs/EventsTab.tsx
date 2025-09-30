import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Event } from '@/lib/types';
import CreatedEventsTab from './CreatedEventsTab';
import UpcomingEventsTab from './UpcomingEventsTab';
import { Badge } from '@/components/ui/badge';

interface EventsTabProps {
  createdEvents: Event[];
  upcomingEvents: Event[];
  isOwnProfile: boolean;
  username: string;
  isLoading?: boolean | undefined;
}

const EventsTab: React.FC<EventsTabProps> = ({
  createdEvents,
  upcomingEvents,
  isOwnProfile,
  username,
  isLoading = false,
}) => {
  const [activeTab, setActiveTab] = useState('created');

  return (
    <div className='space-y-6'>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className='grid w-full grid-cols-2'>
          <TabsTrigger value='created' className='flex items-center gap-2'>
            Created Events
            <Badge variant='secondary' className='text-xs'>
              {createdEvents.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value='attending' className='flex items-center gap-2'>
            Attending
            <Badge variant='secondary' className='text-xs'>
              {upcomingEvents.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value='created' className='mt-6'>
          <CreatedEventsTab
            events={createdEvents}
            isOwnProfile={isOwnProfile}
            username={username}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value='attending' className='mt-6'>
          <UpcomingEventsTab
            events={upcomingEvents}
            isOwnProfile={isOwnProfile}
            username={username}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EventsTab;
