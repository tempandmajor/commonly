import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, MapPin, Clock } from 'lucide-react';
import { safeSupabaseQuery } from '@/utils/supabaseHelpers';
import { formatDistanceToNow } from 'date-fns';

interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  start_date: string;
  is_public: boolean;
  max_capacity: number;
  created_at: string;
  creator?: {
    name: string | undefined;
    avatar_url?: string | undefined;
  };
}

interface PaginatedCommunityListProps {
  pageSize?: number | undefined;
}

const PaginatedCommunityList: React.FC<PaginatedCommunityListProps> = ({ pageSize = 10 }) => {
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async (page = 0) => {
    try {
      if (page === 0) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const { data: eventsData, error } = await safeSupabaseQuery(
        supabase
          .from('events')
          .select(
            `
            id,
            title,
            description,
            location,
            start_date,
            is_public,
            max_capacity,
            created_at,
            users:creator_id (
              name,
              avatar_url
            )
          `
          )
          .eq('is_public', true)
          .order('created_at', { ascending: false })
          .range(page * pageSize, (page + 1) * pageSize - 1),
        []
      );

      if (error) {
        console.error('Error fetching events:', error);
        return;
      }

      // Transform data safely
      const formattedEvents: CommunityEvent[] = (eventsData || [])
        .filter((item: any) => item && typeof item === 'object' && !item.error)
        .map((event: any) => ({
          id: event.id || '',
          title: event.title || '',
          description: event.description || '',
          location: event.location || '',
          start_date: event.start_date || new Date().toISOString(),
          is_public: Boolean(event.is_public),
          max_capacity: Number(event.max_capacity) as number || 0,
          created_at: event.created_at || new Date().toISOString(),
          creator: event.users
            ? {
                name: event.users.name || 'Unknown',
                avatar_url: event.users.avatar_url || '',
              }
            : undefined,
        }));

      if (page === 0) {
        setEvents(formattedEvents);
      } else {
        setEvents(prev => [...prev, ...formattedEvents]);
      }

      setHasMore(formattedEvents.length === pageSize);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error in fetchEvents:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchEvents(currentPage + 1);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }) as string;
    } catch {
      return 'Date TBD';
    }
  };

  const getStatusBadge = (event: CommunityEvent) => {
    const eventDate = new Date(event.start_date);
    const now = new Date();

    if (eventDate < now) {
      return <Badge variant='secondary'>Past Event</Badge>;
    } else if (eventDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
      return <Badge variant='destructive'>Starting Soon</Badge>;
    } else {
      return <Badge variant='default'>Upcoming</Badge>;
    }
  };

  if (loading) {
    return (
      <div className='space-y-4'>
        <h2 className='text-2xl font-bold'>Community Events</h2>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className='animate-pulse'>
              <CardHeader>
                <div className='h-4 bg-gray-200 rounded w-3/4'></div>
                <div className='h-3 bg-gray-200 rounded w-1/2'></div>
              </CardHeader>
              <CardContent>
                <div className='space-y-2'>
                  <div className='h-3 bg-gray-200 rounded w-full'></div>
                  <div className='h-3 bg-gray-200 rounded w-2/3'></div>
                  <div className='h-6 bg-gray-200 rounded w-1/3 mt-4'></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h2 className='text-2xl font-bold'>Community Events</h2>
        <p className='text-gray-600'>{events.length} events found</p>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className='p-8 text-center'>
            <Calendar className='h-12 w-12 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-semibold mb-2'>No Community Events</h3>
            <p className='text-gray-600'>
              There are no public community events available at the moment. Check back later!
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {events.map(event => (
              <Card key={event.id} className='hover:shadow-md transition-shadow'>
                <CardHeader>
                  <div className='flex items-start justify-between'>
                    <CardTitle className='text-lg line-clamp-2'>{event.title}</CardTitle>
                    {getStatusBadge(event)}
                  </div>
                  <div className='flex items-center space-x-2 text-sm text-gray-600'>
                    <Clock className='h-4 w-4' />
                    <span>
                      Created {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <p className='text-sm text-gray-600 line-clamp-3'>
                    {event.description || 'No description provided'}
                  </p>

                  <div className='space-y-2'>
                    <div className='flex items-center space-x-2 text-sm'>
                      <Calendar className='h-4 w-4 text-blue-500' />
                      <span>{formatDate(event.start_date)}</span>
                    </div>

                    {event.location && (
                      <div className='flex items-center space-x-2 text-sm'>
                        <MapPin className='h-4 w-4 text-green-500' />
                        <span className='line-clamp-1'>{event.location}</span>
                      </div>
                    )}

                    {event.max_capacity > 0 && (
                      <div className='flex items-center space-x-2 text-sm'>
                        <Users className='h-4 w-4 text-purple-500' />
                        <span>Max {event.max_capacity} attendees</span>
                      </div>
                    )}
                  </div>

                  {event.creator && (
                    <div className='flex items-center space-x-2 text-xs text-gray-500 pt-2 border-t'>
                      <span>Organized by {event.creator.name}</span>
                    </div>
                  )}

                  <Button className='w-full mt-4' size='sm'>
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {hasMore && (
            <div className='flex justify-center pt-6'>
              <Button onClick={loadMore} disabled={loadingMore} variant='outline' size='lg'>
                {loadingMore ? 'Loading...' : 'Load More Events'}
              </Button>
            </div>
          )}

          {!hasMore && events.length > 0 && (
            <div className='text-center pt-6'>
              <p className='text-gray-600'>No more events to load</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PaginatedCommunityList;
