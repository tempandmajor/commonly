import React, { useState } from 'react';
import { Event } from '@/lib/types/event';
import { useAuth } from '@/providers/AuthProvider';
import PurchaseTicketButton from '../payment/PurchaseTicketButton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import EventTicketsManager from '../tickets/EventTicketsManager';
import EventSupporters from './EventSupporters';
import { Button } from '@/components/ui/button';
import { Trash2, Bookmark, BookmarkCheck, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { deleteEvent } from '@/services/event/mutations';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import GoogleMap from '../location/GoogleMap';

import CommentsSection from '../comments/CommentsSection';
import ReferralLinkButton from '../referrals/ReferralLinkButton';
import SocialSharePopover from '../share/SocialSharePopover';

import { useRecordsByField, useCreateRecord, useDeleteRecord } from '@/services/database';

interface EventDetailsSectionProps {
  event: Event;
  currentUser?: {
    id: string | undefined;
    name: string;
    avatar?: string | undefined;
  };
}

const EventDetailsSection = ({ event, currentUser }: EventDetailsSectionProps) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('details');
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOrganizer = user && event.organizerId === user.id;
  const canDelete = isOrganizer && (event.currentAmount || 0) < (event.targetAmount || 0);

  // Extract coordinates from event
  const hasCoordinates = event.coordinates && event.coordinates.lat && event.coordinates.lng;

  const handleDeleteEvent = async () => {
    if (!isOrganizer) return;

    setIsDeleting(true);
    try {
      const success = await deleteEvent(event.id);
      if (success) {
        toast.success('Event deleted successfully');
        navigate('/explore');
      } else {
        toast.error('Failed to delete event');
      }
    } catch (error) {
      toast.error('An error occurred while deleting the event');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        <div className='md:col-span-2 space-y-6'>
          <Card>
            <CardContent className='p-6'>
              <div className='flex justify-between items-start'>
                <h2 className='text-2xl font-bold mb-4'>{event.title}</h2>
                {canDelete && (
                  <Button
                    variant='destructive'
                    size='sm'
                    onClick={() => setShowDeleteDialog(true)}
                    className='flex items-center gap-1'
                  >
                    <Trash2 className='h-4 w-4' />
                    Delete
                  </Button>
                )}
              </div>
              <p className='text-muted-foreground whitespace-pre-wrap'>{event.description}</p>
            </CardContent>
          </Card>

          <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
            <TabsList className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5'>
              <TabsTrigger value='details'>Details</TabsTrigger>
              <TabsTrigger value='location'>Location</TabsTrigger>
              <TabsTrigger value='supporters'>Supporters</TabsTrigger>
              <TabsTrigger value='discussion'>Discussion</TabsTrigger>
              {isOrganizer && <TabsTrigger value='tickets'>Manage Tickets</TabsTrigger>}
            </TabsList>

            <TabsContent value='details' className='mt-4'>
              <Card>
                <CardContent className='p-6'>
                  <h3 className='text-lg font-medium mb-4'>Event Details</h3>
                  <div className='space-y-4'>
                    <div>
                      <p className='font-medium'>Date & Time</p>
                      <p className='text-muted-foreground'>
                        {new Date(event.startDate).toLocaleDateString()} -{' '}
                        {new Date(event.endDate).toLocaleDateString()}
                      </p>
                    </div>

                    <div>
                      <p className='font-medium'>Type</p>
                      <p className='text-muted-foreground'>{event.type || 'In-Person Event'}</p>
                    </div>

                    <div>
                      <p className='font-medium'>Category</p>
                      <p className='text-muted-foreground'>{event.category || 'General Event'}</p>
                    </div>

                    <div>
                      <p className='font-medium'>Organized by</p>
                      <p className='text-muted-foreground'>
                        {event.organizer?.name || 'Unknown Organizer'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value='location' className='mt-4'>
              <Card>
                <CardContent className='p-6'>
                  <h3 className='text-lg font-medium mb-4'>Location</h3>
                  <p className='text-muted-foreground mb-4'>{event.location}</p>

                  {hasCoordinates ? (
                    <GoogleMap
                      latitude={event.coordinates.lat || 0}
                      longitude={event.coordinates.lng || 0}
                      title={event.title}
                      height='400px'
                      className='rounded-md shadow-sm border border-border'
                    />
                  ) : (
                    <div className='bg-muted h-48 rounded-md flex items-center justify-center'>
                      <p className='text-muted-foreground'>Map coordinates not available</p>
                    </div>
                  )}

                  {hasCoordinates && (
                    <div className='mt-4 flex justify-end'>
                      <Button variant='outline' size='sm' asChild>
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${event.coordinates.lat || 0},${event.coordinates.lng || 0}`}
                          target='_blank'
                          rel='noopener noreferrer'
                        >
                          Get Directions
                        </a>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value='supporters' className='mt-4'>
              <EventSupporters eventId={event.id} isOrganizer={!!isOrganizer} />
            </TabsContent>

            <TabsContent value='discussion' className='mt-4'>
              <CommentsSection
                entityType='event'
                entityId={event.id}
                currentUser={currentUser}
                allowComments={true}
                allowReviews={false}
                totalCount={0}
                initialComments={[]}
              />
            </TabsContent>

            {isOrganizer && (
              <TabsContent value='tickets' className='mt-4'>
                <EventTicketsManager eventId={event.id} isOrganizer={isOrganizer} />
              </TabsContent>
            )}
          </Tabs>
        </div>

        <div>
          <Card>
            <CardContent className='p-6'>
              <h3 className='text-lg font-medium mb-4'>Ticket Information</h3>

              {/* Action Buttons */}
              <div className='flex gap-2 mb-4'>
                <SaveEventButton eventId={event.id} className='flex-1' />
                <SocialSharePopover
                  url={window.location.href}
                  title={event.title}
                  description={event.shortDescription || event.description}
                  trigger={
                    <Button variant='outline' size='sm' className='flex-1'>
                      <Share2 className='h-4 w-4 mr-2' />
                      Share
                    </Button>
                  }
                />
              </div>

              {/* Referral Button - Only show if event has referral program enabled */}
              {event.referral_enabled && (
                <div className='mb-4'>
                  <ReferralLinkButton
                    eventId={event.id}
                    eventTitle={event.title}
                    eventPrice={event.price || 0}
                    commissionAmount={event.referral_commission_amount || 0}
                    commissionType={
                      (event.referral_commission_type as 'fixed' | 'percentage') || 'fixed'
                    }
                    requiresApproval={false} // Can be added as a field later
                    maxReferrers={undefined} // Can be added as a field later
                    className='w-full'
                  />
                </div>
              )}

              <div className='space-y-4'>
                <div>
                  <p className='font-medium'>Price</p>
                  <p className='text-2xl font-bold'>
                    {event.isFree ? 'Free' : `$${event.price || 0}.toFixed(2)}`}
                  </p>
                </div>

                {event.capacity && (
                  <div>
                    <p className='font-medium'>Capacity</p>
                    <p className='text-muted-foreground'>
                      {event.attendeeCount || 0} / {event.capacity} tickets sold
                    </p>
                    <div className='w-full bg-muted rounded-full h-2.5 mt-2'>
                      <div
                        className='bg-primary h-2.5 rounded-full'
                        style={{
                          width: `${Math.min(100, ((event.attendeeCount || 0) / event.capacity) * 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                )}

                {event.isAllOrNothing && (
                  <div className='mb-2'>
                    <p className='font-medium'>Funding Progress</p>
                    <p className='text-muted-foreground'>
                      ${event.currentAmount || 0} of ${event.targetAmount || 0} goal
                    </p>
                    <div className='w-full bg-muted rounded-full h-2.5 mt-2'>
                      <div
                        className='bg-black h-2.5 rounded-full'
                        style={{
                          width: `${Math.min(100, ((event.currentAmount || 0) / (event.targetAmount || 1)) * 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                )}

                <div>
                  {!isOrganizer && (
                    <>
                      <PurchaseTicketButton
                        eventId={event.id}
                        eventTitle={event.title}
                        eventDescription={event.shortDescription || event.description || ''}
                        ticketPrice={event.price || 0}
                        allOrNothing={event.isAllOrNothing}
                        deadline={event.pledgeDeadline?.toString()}
                        goalReached={(event.currentAmount || 0) >= (event.targetAmount || 0)}
                        className='w-full mt-4'
                        availableTickets={event.availableTickets}
                        totalTickets={event.capacity}
                        goalAmount={event.targetAmount}
                        currentAmount={event.currentAmount}
                      />

                      {event.isAllOrNothing && (
                        <p className='text-xs text-muted-foreground mt-2 italic'>
                          You'll only be charged if this event reaches its funding goal
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Event Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEvent}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Save Event Button Component
const SaveEventButton: React.FC<{ eventId: string; className?: string }> = ({
  eventId,
  className,
}) => {
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    // savedEvent query will automatically run when user or eventId changes
  }, [user, eventId]);

  // Use the database hook to query saved event status
  const { data: savedEvent } = useRecordsByField('saved_events', 'user_id', user.id);

  // Update saved status whenever the query result changes
  React.useEffect(() => {
    if (savedEvent && savedEvent.length > 0) {
      setIsSaved(true);
    } else {
      setIsSaved(false);
    }
  }, [savedEvent]);

  // Hook for creating saved event records
  const { createRecord } = useCreateRecord('saved_events', {
    onSuccess: () => {
      setIsSaved(true);
      toast.success('Event saved successfully');
    },
    onError: () => toast.error('Failed to save event'),
  });

  // Hook for deleting saved event records
  const { deleteRecord } = useDeleteRecord('saved_events', {
    onSuccess: () => {
      setIsSaved(false);
      toast.success('Event removed from saved events');
    },
    onError: () => toast.error('Failed to remove saved event'),
  });

  const toggleSave = async () => {
    if (!user) {
      toast.error('Please sign in to save events');
      return;
    }

    setIsLoading(true);
    try {
      if (isSaved && savedEvent && savedEvent.length > 0) {
        // Remove from saved events
        await deleteRecord(savedEvent[0].id);
      } else {
        // Add to saved events
        await createRecord({
          user_id: user.id,
          event_id: eventId,
        });
      }
    } catch (_error) {
      // Error handling silently ignored
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant='outline'
      size='sm'
      onClick={toggleSave}
      disabled={isLoading}
      className={className}
    >
      {isSaved ? <BookmarkCheck className='h-4 w-4 mr-2' /> : <Bookmark className='h-4 w-4 mr-2' />}
      {isSaved ? 'Saved' : 'Save'}
    </Button>
  );
};

export default EventDetailsSection;
