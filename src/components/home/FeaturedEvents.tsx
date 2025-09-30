import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EventCard from '@/components/ui/EventCard';
import { getEvents } from '@/services/event/queries';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { useSupabase } from '@/contexts/SupabaseContext';
import { Event } from '@/lib/types/event';
import { createLogger } from '@/utils/logger';
import { Alert, AlertDescription } from '@/components/ui/alert';

const logger = createLogger('FeaturedEvents');

const FeaturedEvents = () => {
  const { isInitialized } = useSupabase();

  const {
    data: eventsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['featuredEvents'],
    queryFn: () => getEvents(6),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: isInitialized,
  });

  // Ensure events is always an array
  const events: Event[] = Array.isArray(eventsData) ? eventsData : [];

  // Handle errors
  useEffect(() => {
    if (error) {
      logger.error('Error fetching featured events:', error);
      toast.error('Unable to load featured events. Please try again later.');
    }
  }, [error]);

  if (isLoading || !isInitialized) {
    return (
      <section className='py-12 md:py-16'>
        <div className='container px-4 md:px-6'>
          <div className='flex flex-col gap-8'>
            <div className='flex items-center justify-between'>
              <div>
                <h2 className='text-2xl font-bold md:text-3xl'>Featured Events</h2>
                <p className='text-sm text-muted-foreground mt-1'>
                  Discover handpicked events in your area
                </p>
              </div>
              <Button variant='ghost' size='sm' className='group gap-1' asChild>
                <Link to='/explore'>
                  View all
                  <ArrowRight className='h-4 w-4 transition-transform group-hover:translate-x-1' />
                </Link>
              </Button>
            </div>

            <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
              {[...Array(6)].map((_, i) => (
                <div key={i} className='space-y-4'>
                  <Skeleton className='h-48 w-full' />
                  <div className='space-y-2'>
                    <Skeleton className='h-4 w-3/4' />
                    <Skeleton className='h-4 w-1/2' />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className='py-12 md:py-16'>
        <div className='container px-4 md:px-6'>
          <Alert className='max-w-md mx-auto'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>
              Unable to load featured events. Please check your connection and try again.
            </AlertDescription>
          </Alert>
        </div>
      </section>
    );
  }

  if (events.length === 0) {
    return null;
  }

  return (
    <section className='py-12 md:py-16'>
      <div className='container px-4 md:px-6'>
        <div className='flex flex-col gap-8'>
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='text-2xl font-bold md:text-3xl'>Featured Events</h2>
              <p className='text-sm text-muted-foreground mt-1'>
                Discover handpicked events in your area
              </p>
            </div>
            <Button variant='ghost' size='sm' className='group gap-1' asChild>
              <Link to='/explore'>
                View all
                <ArrowRight className='h-4 w-4 transition-transform group-hover:translate-x-1' />
              </Link>
            </Button>
          </div>

          <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
            {events.slice(0, 6).map(event => (
              <EventCard key={event.id} event={event} featured={true} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedEvents;
