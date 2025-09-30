import { Event } from '@/lib/types';
import { Button } from '@/components/ui/button';
import EventCard from '@/components/ui/EventCard';
import { Clock, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UpcomingEventsTabProps {
  events: Event[];
  isOwnProfile: boolean;
  username: string;
}

const UpcomingEventsTab = ({ events, isOwnProfile, username }: UpcomingEventsTabProps) => {
  const navigate = useNavigate();

  if (events.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-12 text-center'>
        <div className='h-16 w-16 flex items-center justify-center rounded-full bg-muted'>
          <Clock className='h-8 w-8 text-muted-foreground' />
        </div>
        <h3 className='mt-4 text-lg font-medium'>No upcoming events</h3>
        <p className='mt-2 text-muted-foreground'>
          {isOwnProfile
            ? "You're not attending any upcoming events."
            : `${username} is not attending any upcoming events.`}
        </p>
        {isOwnProfile && (
          <Button className='mt-6' onClick={() => navigate('/explore')}>
            <PlusCircle className='mr-2 h-4 w-4' />
            Explore Events
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className='grid gap-6 md:grid-cols-2'>
      {events.map(event => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
};

export default UpcomingEventsTab;
