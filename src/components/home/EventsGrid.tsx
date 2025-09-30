import { Event } from '@/lib/types/event';
import EventCard from '@/components/ui/EventCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, RefreshCw } from 'lucide-react';

interface EventsGridProps {
  events: Event[];
  viewMode: 'grid' | 'list';
  loading: boolean;
  initialLoading?: boolean | undefined;
  hasMore: boolean;
  loadMore: () => void;
  initialLoadComplete?: boolean | undefined;
  error?: string | undefined| null;
  onRetry?: () => void | undefined;
}

const EventsGrid = ({
  events,
  viewMode,
  loading,
  initialLoading = false,
  hasMore,
  loadMore,
  initialLoadComplete = false,
  error,
  onRetry,
}: EventsGridProps) => {
  // Initial loading state with skeletons (first load only)
  if (initialLoading || (loading && events.length === 0)) {
    return (
      <div
        className={
          viewMode === 'grid' ? 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3' : 'flex flex-col gap-6'
        }
      >
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Skeleton key={i} className='h-[400px] rounded-lg' />
        ))}
      </div>
    );
  }

  // Error state
  if (error && onRetry) {
    return (
      <div className='py-12 text-center'>
        <h3 className='text-xl font-medium mb-2'>Error Loading Events</h3>
        <p className='text-muted-foreground mb-4'>{error}</p>
        <Button variant='outline' onClick={onRetry} className='flex items-center gap-2'>
          <RefreshCw className='h-4 w-4' />
          Try Again
        </Button>
      </div>
    );
  }

  // No events state
  if (initialLoadComplete && events.length === 0) {
    return (
      <div className='py-12 text-center'>
        <h3 className='text-xl font-medium mb-2'>No events found</h3>
        <p className='text-muted-foreground'>Try changing your filters or check back later</p>
      </div>
    );
  }

  return (
    <>
      <div
        className={
          viewMode === 'grid' ? 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3' : 'flex flex-col gap-6'
        }
      >
        {events.map(event => (
          <EventCard key={event.id} event={event} featured={viewMode === 'list'} />
        ))}
      </div>

      {/* Loading more indicator - only show when loading additional events */}
      {loading && events.length > 0 && (
        <div className='mt-8 flex justify-center'>
          <div className='flex items-center justify-center'>
            <Loader2 className='h-8 w-8 animate-spin text-primary mr-2' />
            <span>Loading more events...</span>
          </div>
        </div>
      )}

      {/* Load more button - only show when we definitely have more events to load */}
      {!loading && hasMore && initialLoadComplete && (
        <div className='mt-8 flex justify-center'>
          <Button onClick={loadMore} variant='outline'>
            Load More Events
          </Button>
        </div>
      )}
    </>
  );
};

export default EventsGrid;
