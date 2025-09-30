import React, { Suspense, lazy } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { useEvent } from '@/hooks/useEvent';
import EventHeader from '@/components/events/EventHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Clock, Users, Trophy } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SEO } from '@/components/common/SEO';
import { Badge } from '@/components/ui/badge';
import type { Event as DetailedEvent, EventStatus } from '@/lib/types/event';

// Lazy load heavy components for better performance
const EventDetailsSection = lazy(() => import('@/components/events/EventDetailsSection'));
const SponsorshipSection = lazy(() => import('@/components/events/SponsorshipSection'));
const TourDatesDisplay = lazy(() => import('@/components/events/TourDatesDisplay'));

// Loading skeleton component for better UX
const EventDetailsSkeleton = () => (
  <div className='space-y-6'>
    {/* Header skeleton */}
    <div className='w-full h-72 bg-muted rounded-lg animate-pulse' />

    {/* Content skeleton */}
    <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
      <div className='md:col-span-2 space-y-6'>
        <Card>
          <CardContent className='p-6'>
            <Skeleton className='h-8 w-3/4 mb-4' />
            <Skeleton className='h-4 w-full mb-2' />
            <Skeleton className='h-4 w-5/6 mb-2' />
            <Skeleton className='h-4 w-4/5' />
          </CardContent>
        </Card>

        {/* Tabs skeleton */}
        <div className='space-y-4'>
          <div className='flex space-x-1'>
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className='h-10 w-20' />
            ))}
          </div>
          <Card>
            <CardContent className='p-6'>
              <Skeleton className='h-6 w-1/3 mb-4' />
              <div className='space-y-2'>
                <Skeleton className='h-4 w-full' />
                <Skeleton className='h-4 w-4/5' />
                <Skeleton className='h-4 w-3/4' />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sidebar skeleton */}
      <div>
        <Card>
          <CardContent className='p-6'>
            <Skeleton className='h-6 w-1/2 mb-4' />
            <Skeleton className='h-8 w-1/3 mb-4' />
            <Skeleton className='h-4 w-full mb-2' />
            <Skeleton className='h-2 w-full mb-4' />
            <Skeleton className='h-12 w-full' />
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);

const EventDetails: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { event, loading, error } = useEvent(eventId || '');
  const { user } = useAuth();

  // Convert user to the format expected by EventDetailsSection
  const currentUser: { id: string | undefined; name: string; avatar?: string | undefined } | null = user
    ? {
        id: user.id as string | undefined,
        name: (user.user_metadata?.full_name || user.email?.split('@')[0] || 'User') as string,
        avatar: user.user_metadata?.avatar_url as string | undefined,
      }
    : null;

  // Generate dynamic meta tags for social sharing
  const generateSEOData = (event: any) => {
    const title = `${event.title} - Event on Commonly`;
    const description = event.description
      ? `${event.description.substring(0, 150)}${event.description.length > 150 ? '...' : ''}`
      : `Join us for ${event.title}. Get your tickets now on Commonly.`;

    const eventImage =
      event.image_url ||
      event.bannerImage ||
      '/lovable-uploads/542900f1-cca8-40b9-bdb9-dafcfe4a592e.png';

    // Schema.org structured data for events
    const schemaData = {
      '@type': 'Event',
      name: event.title,
      description: event.description || description,
      startDate: event.start_date,
      endDate: event.end_date,
      location: event.location
        ? {
            '@type': 'Place',
            name: event.location,
            address: event.location,
          }
        : undefined,
      image: eventImage,
      organizer: {
        '@type': 'Organization',
        name: 'Commonly',
        url: window.location.origin,
      },
      offers: event.price
        ? {
            '@type': 'Offer',
            price: event.price,
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
            url: window.location.href,
          }
        : undefined,
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: event.location
        ? 'https://schema.org/OfflineEventAttendanceMode'
        : 'https://schema.org/OnlineEventAttendanceMode',
    };

    return { title, description, image: eventImage, schemaData };
  };

  if (loading) {
    return (
      <>
        <SEO
          title='Loading Event...'
          description='Loading event details'
          image='/lovable-uploads/542900f1-cca8-40b9-bdb9-dafcfe4a592e.png'
          type='event'
          canonicalUrl={window.location.href}
          schemaData={{
            '@type': 'Event',
            name: 'Loading Event...',
            description: 'Loading event details',
            startDate: new Date().toISOString(),
            endDate: new Date().toISOString(),
            location: 'Location TBD',
            image: '/lovable-uploads/542900f1-cca8-40b9-bdb9-dafcfe4a592e.png',
            organizer: {
              '@type': 'Organization',
              name: 'Commonly',
              url: window.location.origin,
            },
            eventStatus: 'https://schema.org/EventScheduled',
            eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
          }}
        />
        <div className='container mx-auto px-4 py-8'>
          <EventDetailsSkeleton />
        </div>
      </>
    );
  }

  if (error || !event) {
    return (
      <>
        <div className='container mx-auto px-4 py-8'>
          <Alert>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>
              {error ||
                'Event not found. It may have been removed or you may not have permission to view it.'}
            </AlertDescription>
          </Alert>
        </div>
      </>
    );
  }

  const seoData = generateSEOData(event);

  // Calculate campaign status
  const now = new Date();
  const eventAny = event as any;
  const campaignDeadline = eventAny.campaignDeadline ? new Date(eventAny.campaignDeadline) : null;
  const isDeadlinePassed = campaignDeadline && campaignDeadline < now;
  const goalReached = (eventAny.currentAmount || 0) >= (eventAny.targetAmount || 0);
  const daysRemaining = campaignDeadline
    ? Math.max(0, Math.ceil((campaignDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : null;

  // Convert the database event to the detailed event interface expected by components
  const formattedEvent: DetailedEvent = {
    id: event.id,
    title: event.title,
    description: event.description || '',
    shortDescription: eventAny.short_description || event.description?.substring(0, 200) || '',
    startDate: eventAny.start_date || new Date().toISOString(),
    endDate: eventAny.end_date || new Date().toISOString(),
    location: event.location || 'Location TBD',
    status: (event.status || 'active') as EventStatus,
    category: eventAny.category,
    type: eventAny.type,
    enhancedType: eventAny.enhanced_type,
    organizer: {
      id: eventAny.creator_id || '',
      name: eventAny.organizer_name || 'Event Organizer',
    },
    organizerId: eventAny.creator_id,
    bannerImage: event.image_url || eventAny.banner_image,
    capacity: eventAny.max_capacity || eventAny.capacity,
    attendeeCount: eventAny.attendees_count || 0,
    isFree: eventAny.is_free || (!eventAny.price && !eventAny.targetAmount),
    price: eventAny.price || 0,
    currentAmount: eventAny.currentAmount || eventAny.current_amount || 0,
    targetAmount: eventAny.targetAmount || eventAny.target_amount || 0,
    isAllOrNothing: eventAny.isAllOrNothing || eventAny.is_all_or_nothing || false,

    // Campaign and deadline info
    campaignDeadline: eventAny.campaignDeadline || eventAny.campaign_deadline,
    pledgeDeadline: eventAny.pledgeDeadline || eventAny.pledge_deadline,
    campaignDuration: eventAny.campaign_duration,
    isDeadlinePassed: isDeadlinePassed || false,
    goalReached: goalReached || false,
    daysRemaining,

    // Sponsorship
    sponsorshipEnabled: eventAny.sponsorship_enabled || false,
    sponsorshipTiers: eventAny.sponsorshipTiers || eventAny.sponsorship_tiers || [],

    // Referral system
    referral_enabled: eventAny.referral_enabled || false,
    referral_commission_amount: eventAny.referral_commission_amount || 0,
    referral_commission_type: eventAny.referral_commission_type || 'fixed',
    referral_terms: eventAny.referral_terms,

    // Tour details
    tourDetails: eventAny.tour_details as any,
    tourDates: eventAny.tour_dates || [],

    // Virtual event details
    virtualEventDetails: eventAny.virtual_event_details,

    // Other fields
    images: eventAny.images || [],
    tags: eventAny.tags || [],
    isPrivate: eventAny.is_private || eventAny.is_public === false,
    requiresApproval: eventAny.requires_approval || false,
    ageRestriction: eventAny.age_restriction,
    createdAt: eventAny.created_at,
    updatedAt: eventAny.updated_at,
    maxTicketsPerPurchase: eventAny.max_tickets_per_purchase || 4,
    availableTickets: eventAny.available_tickets || eventAny.max_capacity,
    reservedTickets: eventAny.reserved_tickets || 0,
    ticketsSold: eventAny.tickets_sold || 0,
    pledges: eventAny.pledges || 0,
    totalPledged: eventAny.currentAmount || eventAny.current_amount || 0,
    fundingGoal: eventAny.targetAmount || eventAny.target_amount || 0,
    fundingStatus: goalReached ? 'funded' : isDeadlinePassed ? 'failed' : 'in_progress',

    // Ticket settings
    ticketSettings: eventAny.ticket_settings || {
      earlyBirdEnabled: false,
      groupDiscountEnabled: false,
      refundPolicy: 'partial',
      refundDeadlineDays: 7,
    },
  };

  return (
    <>
      {/* Dynamic SEO meta tags for social sharing */}
      <SEO
        title={seoData.title}
        description={seoData.description}
        image={seoData.image}
        type='event'
        canonicalUrl={window.location.href}
        schemaData={seoData.schemaData}
      />

      {/* Layout wrapper removed; router-level guards handle auth/layout */}
      {/* Event Header with Hero Image */}
      <EventHeader event={formattedEvent} />

      <div className='container mx-auto px-4 py-8'>
        <div className='max-w-7xl mx-auto'>
          {/* Campaign Status Banner */}
          {formattedEvent.isAllOrNothing && (
            <div className='mb-6'>
              <Alert
                className={`border-2 ${
                  goalReached
                    ? 'border-primary bg-secondary'
                    : isDeadlinePassed
                      ? 'border-destructive bg-destructive/10'
                      : 'border-border bg-secondary'
                }`}
              >
                <Clock className='h-4 w-4' />
                <AlertDescription className='flex items-center justify-between'>
                  <div>
                    {goalReached ? (
                      <span className='font-medium text-primary'>
                        🎉 Funding goal reached! This event is confirmed.
                      </span>
                    ) : isDeadlinePassed ? (
                      <span className='font-medium text-destructive'>
                        ⏰ Campaign deadline has passed. Event was not funded.
                      </span>
                    ) : (
                      <span className='font-medium text-primary'>
                        🎯 All-or-Nothing Campaign: {daysRemaining} days remaining to reach funding
                        goal
                      </span>
                    )}
                  </div>
                  {!goalReached && !isDeadlinePassed && (
                    <Badge variant='outline' className='ml-4'>
                      <Clock className='h-3 w-3 mr-1' />
                      {daysRemaining} days left
                    </Badge>
                  )}
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Event Type and Category Badges */}
          <div className='flex flex-wrap gap-2 mb-6'>
            {formattedEvent.category && (
              <Badge variant='secondary'>{String(formattedEvent.category)}</Badge>
            )}
            {formattedEvent.enhancedType && (
              <Badge variant='outline'>{String(formattedEvent.enhancedType)}</Badge>
            )}
            {formattedEvent.type === 'Tour' && (
              <Badge variant='secondary'>
                <Users className='h-3 w-3 mr-1' />
                Tour Event
              </Badge>
            )}
            {formattedEvent.sponsorshipEnabled && (
              <Badge variant='secondary'>
                <Trophy className='h-3 w-3 mr-1' />
                Sponsorship Available
              </Badge>
            )}
            {formattedEvent.referral_enabled && (
              <Badge variant='secondary'>💰 Referral Program</Badge>
            )}
          </div>

          {/* Tour Dates Display */}
          {formattedEvent.type === 'Tour' &&
            formattedEvent.tourDetails &&
            (formattedEvent.tourDetails as any)?.tourDates &&
            (formattedEvent.tourDetails as any)?.tourDates.length > 0 && (
              <div className='mb-8'>
                <Suspense
                  fallback={
                    <Card>
                      <CardContent className='p-6'>
                        <Skeleton className='h-6 w-1/3 mb-4' />
                        <div className='space-y-2'>
                          {[1, 2, 3].map(i => (
                            <Skeleton key={i} className='h-16 w-full' />
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  }
                >
                  <TourDatesDisplay
                    tourDetails={formattedEvent.tourDetails as any}
                  />
                </Suspense>
              </div>
            )}

          {/* Main Event Details */}
          <Suspense fallback={<EventDetailsSkeleton />}>
            <EventDetailsSection
              event={formattedEvent}
              {...(currentUser && { currentUser })}
            />
          </Suspense>

          {/* Sponsorship Section */}
          {formattedEvent.sponsorshipEnabled &&
            formattedEvent.sponsorshipTiers &&
            formattedEvent.sponsorshipTiers.length > 0 && (
              <div className='mt-8'>
                <Suspense
                  fallback={
                    <Card>
                      <CardContent className='p-6'>
                        <Skeleton className='h-6 w-1/3 mb-4' />
                        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                          {[1, 2, 3].map(i => (
                            <Card key={i}>
                              <CardContent className='p-4'>
                                <Skeleton className='h-6 w-2/3 mb-2' />
                                <Skeleton className='h-4 w-1/2 mb-4' />
                                <Skeleton className='h-10 w-full' />
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  }
                >
                  <SponsorshipSection event={formattedEvent} />
                </Suspense>
              </div>
            )}
        </div>
      </div>
    </>
  );
};

export default EventDetails;
