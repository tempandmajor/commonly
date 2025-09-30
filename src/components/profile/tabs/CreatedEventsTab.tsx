import React, { memo } from 'react';
import { Event } from '@/lib/types';
import { Button } from '@/components/ui/button';
import EventCard from '@/components/ui/EventCard';
import { CalendarDays, PlusCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CreatedEventsTabProps {
  events: Event[];
  isOwnProfile: boolean;
  username: string;
  isLoading?: boolean | undefined;
}

const CreatedEventsTab = ({
  events,
  isOwnProfile,
  username,
  isLoading = false,
}: CreatedEventsTabProps) => {
  const navigate = useNavigate();

  // if (isLoading) {
  //   return (
  //     <div className="flex flex-col items-center justify-center py-12">
  //       <Loader2 className="h-8 w-8 animate-spin text-primary" />
  //       <p className="mt-4 text-muted-foreground">Loading events...</p>
  //     </div>
  //   );
  // }

  if (events.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-12 text-center'>
        <div className='h-16 w-16 flex items-center justify-center rounded-full bg-muted'>
          <CalendarDays className='h-8 w-8 text-muted-foreground' />
        </div>
        <h3 className='mt-4 text-lg font-medium'>No events created yet</h3>
        <p className='mt-2 text-muted-foreground'>
          {isOwnProfile
            ? "You haven't created any events yet."
            : `${username} hasn't created any events yet.`}
        </p>
        {isOwnProfile && (
          <Button className='mt-6' onClick={() => navigate('/create-event')}>
            <PlusCircle className='mr-2 h-4 w-4' />
            Create Event
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='grid gap-6 md:grid-cols-2'>
        {events.map(event => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>

      {isOwnProfile && (
        <div className='mt-8 flex justify-center'>
          <Button onClick={() => navigate('/create-event')} className='gap-2'>
            <PlusCircle className='h-4 w-4' />
            Create Another Event
          </Button>
        </div>
      )}
    </div>
  );
};

// Memoize the component to optimize performance
export default memo(CreatedEventsTab);
