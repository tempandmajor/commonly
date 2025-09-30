import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Music,
  Ticket,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { TourDetails, TourDate } from '@/lib/types/event';

interface TourDatesDisplayProps {
  tourDetails: TourDetails;
  onBookTicket?: (tourDate: TourDate) => void | undefined;
}

export const TourDatesDisplay: React.FC<TourDatesDisplayProps> = ({
  tourDetails,
  onBookTicket,
}) => {
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'available':
        return 'bg-gray-600';
      case 'sold-out':
        return 'bg-black';
      case 'cancelled':
        return 'bg-gray-400';
      case 'postponed':
        return 'bg-gray-500';
      default:
        return 'bg-gray-300';
    }
  };

  const getStatusLabel = (status: TourDate['status']) => {
    switch (status) {
      case 'on_sale':
        return 'On Sale';
      case 'sold_out':
        return 'Sold Out';
      case 'cancelled':
        return 'Cancelled';
      case 'completed':
        return 'Completed';
      default:
        return 'Scheduled';
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }) as string;
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const toggleExpanded = (dateId: string) => {
    setExpandedDate(expandedDate === dateId ? null : dateId);
  };

  const upcomingDates = tourDetails.tourDates.filter(
    date =>
      new Date(date.date) >= new Date() &&
      date.status !== 'cancelled' &&
      date.status !== 'completed'
  );

  const pastDates = tourDetails.tourDates.filter(
    date => new Date(date.date) < new Date() || date.status === 'completed'
  );

  return (
    <div className='space-y-6'>
      {/* Tour Overview */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='flex items-center gap-2'>
                <Music className='h-5 w-5' />
                {tourDetails.tourName}
              </CardTitle>
              <CardDescription>
                {tourDetails.tourType.charAt(0).toUpperCase() + tourDetails.tourType.slice(1)} Tour
                • {tourDetails.tourDates.length} Dates
              </CardDescription>
            </div>
            <div className='flex items-center gap-2'>
              {tourDetails.merchandiseAvailable && (
                <Badge variant='secondary'>Merch Available</Badge>
              )}
              {tourDetails.vipPackagesAvailable && <Badge variant='secondary'>VIP Packages</Badge>}
            </div>
          </div>
        </CardHeader>
        {tourDetails.tourDescription && (
          <CardContent>
            <p className='text-muted-foreground'>{tourDetails.tourDescription}</p>
          </CardContent>
        )}
      </Card>

      {/* Upcoming Dates */}
      {upcomingDates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Dates ({upcomingDates.length})</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {upcomingDates.map(tourDate => {
              const isExpanded = expandedDate === tourDate.id;

              return (
                <Card
                  key={tourDate.id}
                  className={`transition-all ${isExpanded ? 'ring-2 ring-primary' : ''}`}
                >
                  <CardContent className='p-4'>
                    {/* Compact View */}
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-4 flex-1'>
                        <div className='text-center'>
                          <div className='text-2xl font-bold'>
                            {new Date(tourDate.date).getDate()}
                          </div>
                          <div className='text-xs text-muted-foreground'>
                            {new Date(tourDate.date).toLocaleDateString('en-US', {
                              month: 'short',
                            }) as string}
                          </div>
                        </div>

                        <div className='flex-1'>
                          <div className='font-medium'>{tourDate.venue.name}</div>
                          <div className='text-sm text-muted-foreground'>
                            {tourDate.venue.city}, {tourDate.venue.state}
                          </div>
                          <div className='flex items-center gap-2 mt-1'>
                            <Clock className='h-3 w-3 text-muted-foreground' />
                            <span className='text-xs'>{formatTime(tourDate.startTime)}</span>
                            {tourDate.endTime && (
                              <>
                                <span className='text-xs'>-</span>
                                <span className='text-xs'>{formatTime(tourDate.endTime)}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className='flex items-center gap-2'>
                          <Badge className={`${getStatusColor(tourDate.status)} text-white`}>
                            {getStatusLabel(tourDate.status)}
                          </Badge>
                          {tourDate.ticketPrice && (
                            <Badge variant='outline'>${tourDate.ticketPrice}</Badge>
                          )}
                        </div>
                      </div>

                      <div className='flex items-center gap-2 ml-4'>
                        {tourDate.status === 'on_sale' && onBookTicket && (
                          <Button size='sm' onClick={() => onBookTicket(tourDate)}>
                            <Ticket className='h-4 w-4 mr-2' />
                            Get Tickets
                          </Button>
                        )}
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => toggleExpanded(tourDate.id)}
                        >
                          {isExpanded ? (
                            <ChevronUp className='h-4 w-4' />
                          ) : (
                            <ChevronDown className='h-4 w-4' />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Expanded View */}
                    {isExpanded && (
                      <>
                        <Separator className='my-4' />
                        <div className='space-y-4'>
                          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                            <div>
                              <h4 className='font-medium mb-2 flex items-center gap-2'>
                                <Calendar className='h-4 w-4' />
                                Event Details
                              </h4>
                              <div className='space-y-2 text-sm'>
                                <div>
                                  <span className='font-medium'>Date:</span>{' '}
                                  {formatDate(tourDate.date)}
                                </div>
                                <div>
                                  <span className='font-medium'>Time:</span>{' '}
                                  {formatTime(tourDate.startTime)}
                                  {tourDate.endTime && ` - ${formatTime(tourDate.endTime)}`}
                                </div>
                                {tourDate.capacity && (
                                  <div className='flex items-center gap-2'>
                                    <Users className='h-3 w-3' />
                                    <span className='font-medium'>Capacity:</span>{' '}
                                    {tourDate.capacity.toLocaleString()}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div>
                              <h4 className='font-medium mb-2 flex items-center gap-2'>
                                <MapPin className='h-4 w-4' />
                                Venue Information
                              </h4>
                              <div className='space-y-1 text-sm'>
                                <div className='font-medium'>{tourDate.venue.name}</div>
                                <div>{tourDate.venue.address}</div>
                                <div>
                                  {tourDate.venue.city}, {tourDate.venue.state}{' '}
                                  {tourDate.venue.country}
                                </div>
                              </div>
                            </div>
                          </div>

                          {tourDate.specialNotes && (
                            <div>
                              <h4 className='font-medium mb-2'>Special Notes</h4>
                              <p className='text-sm text-muted-foreground'>
                                {tourDate.specialNotes}
                              </p>
                            </div>
                          )}

                          {tourDate.status === 'on_sale' && tourDate.ticketPrice && (
                            <div className='p-3 bg-primary/5 border border-primary/20 rounded-lg'>
                              <div className='flex items-center justify-between'>
                                <div>
                                  <div className='font-medium'>Tickets Available</div>
                                  <div className='text-sm text-muted-foreground'>
                                    Starting at ${tourDate.ticketPrice}
                                  </div>
                                </div>
                                {onBookTicket && (
                                  <Button onClick={() => onBookTicket(tourDate)}>
                                    <Ticket className='h-4 w-4 mr-2' />
                                    Buy Tickets
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Past Dates */}
      {pastDates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Past Dates ({pastDates.length})</CardTitle>
          </CardHeader>
          <CardContent className='space-y-2'>
            {pastDates.map(tourDate => (
              <div
                key={tourDate.id}
                className='flex items-center justify-between p-3 bg-muted/50 rounded-lg'
              >
                <div className='flex items-center gap-4'>
                  <div className='text-center'>
                    <div className='text-lg font-bold text-muted-foreground'>
                      {new Date(tourDate.date).getDate()}
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      {new Date(tourDate.date).toLocaleDateString('en-US', { month: 'short' }) as string}
                    </div>
                  </div>
                  <div>
                    <div className='font-medium text-muted-foreground'>{tourDate.venue.name}</div>
                    <div className='text-sm text-muted-foreground'>
                      {tourDate.venue.city}, {tourDate.venue.state}
                    </div>
                  </div>
                </div>
                <Badge variant='secondary'>{getStatusLabel(tourDate.status)}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Tour Manager Contact */}
      {tourDetails.tourManager && (
        <Card>
          <CardHeader>
            <CardTitle>Tour Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              <div>
                <span className='font-medium'>Tour Manager:</span> {tourDetails.tourManager.name}
              </div>
              <div>
                <span className='font-medium'>Email:</span>
                <a
                  href={`mailto:${tourDetails.tourManager.email}`}
                  className='ml-2 text-primary hover:underline'
                >
                  {tourDetails.tourManager.email}
                </a>
              </div>
              {tourDetails.tourManager.phone && (
                <div>
                  <span className='font-medium'>Phone:</span>
                  <a
                    href={`tel:${tourDetails.tourManager.phone}`}
                    className='ml-2 text-primary hover:underline'
                  >
                    {tourDetails.tourManager.phone}
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TourDatesDisplay;
