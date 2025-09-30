import { memo } from 'react';
import { Event } from '@/lib/types/event';
import EventCard from '@/components/ui/EventCard';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface EventGridProps {
  events: Event[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

// Use memo to prevent unnecessary re-renders
const EventCardMemo = memo(({ event }: { event: Event }) => (
  <div className='transition-all duration-300 animate-fade-in hover:scale-[1.01]'>
    <EventCard event={event} />
  </div>
));

EventCardMemo.displayName = 'EventCardMemo';

const EventGrid = ({ events, loading, hasMore, onLoadMore }: EventGridProps) => {
  // Only show loading state on initial load, not when filtering to empty results
  if (loading && events.length === 0) {
    return (
      <div className='my-16 flex flex-col items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
        <p className='mt-4 text-muted-foreground'>Loading events...</p>
      </div>
    );
  }

  // Show no events found message when not loading and events array is empty
  if (!loading && events.length === 0) {
    return (
      <div className='my-16 text-center'>
        <h3 className='text-lg font-medium'>No events found</h3>
        <p className='mt-2 text-muted-foreground'>Try adjusting your filters or search query.</p>
      </div>
    );
  }

  return (
    <>
      <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
        {events.map(event => (
          <EventCardMemo key={event.id} event={event} />
        ))}
      </div>

      {hasMore && (
        <div className='mt-12 flex justify-center'>
          <Button variant='outline' onClick={onLoadMore} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Loading...
              </>
            ) : (
              'Load More Events'
            )}
          </Button>
        </div>
      )}
    </>
  );
};

// Use memo for the whole component to prevent unnecessary re-renders
export default memo(EventGrid);
