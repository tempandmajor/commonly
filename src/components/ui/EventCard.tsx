import React, { useState, useRef, useEffect } from 'react';
import { formatDate } from '@/utils/dates';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Event } from '@/lib/types/event';
import { MapPin, Users, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface EventCardProps {
  event: Event;
  onClick?: () => void | undefined;
  featured?: boolean | undefined;
  className?: string | undefined;
}

const EventCard = ({ event, onClick, featured, className }: EventCardProps) => {
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before the card comes into view
        threshold: 0.1,
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/events/${event.id}`);
    }
  };

  // Default values for missing data
  const imageUrl = event.bannerImage || event.images?.[0]; // undefined if no image available
  const price = event.price || 0;
  const attendeeCount = event.attendeeCount || 0;
  const category = event.category || 'General';

  return (
    <Card
      ref={cardRef}
      className={cn(
        'group cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1',
        'overflow-hidden bg-white',
        className
      )}
      onClick={handleClick}
    >
      {/* Image Section */}
      <div className='relative h-48 overflow-hidden bg-gray-100'>
        {isInView ? (
          <>
            {imageUrl ? (
              <img
                ref={imgRef}
                src={imageUrl}
                alt={event.title}
                className={cn(
                  'w-full h-full object-cover transition-all duration-300',
                  'group-hover:scale-105',
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                )}
                loading='lazy'
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                  setImageError(true);
                  setImageLoaded(true);
                }}
              />
            ) : (
              <div className='w-full h-full bg-gray-200 flex items-center justify-center'>
                <span className='text-gray-400 text-sm'>No Image</span>
              </div>
            )}

            {/* Loading placeholder */}
            {!imageLoaded && (
              <div className='absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse flex items-center justify-center'>
                <div className='text-gray-500 text-sm'>Loading...</div>
              </div>
            )}
          </>
        ) : (
          // Placeholder while not in view
          <div className='w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse' />
        )}

        {featured && <Badge className='absolute top-2 right-2 bg-yellow-500'>Featured</Badge>}
        {event.status && event.status === 'completed' && (
          <Badge variant='secondary' className='absolute top-2 left-2'>
            Completed
          </Badge>
        )}
        {event.fundingStatus && event.fundingStatus === 'failed' && (
          <Badge variant='destructive' className='absolute top-2 left-2'>
            Funding Failed
          </Badge>
        )}
      </div>

      <CardContent className='p-4 space-y-3'>
        {/* Category */}
        <div className='flex items-center justify-between'>
          <Badge variant='secondary' className='text-xs'>
            {category}
          </Badge>
          {event.isFree ? (
            <Badge variant='outline' className='text-xs'>
              Free
            </Badge>
          ) : (
            <div className='flex items-center text-sm font-semibold'>
              <DollarSign className='w-3 h-3' />
              {price.toFixed(2)}
            </div>
          )}
        </div>

        {/* Title and Description */}
        <div>
          <h3 className='font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors'>
            {event.title}
          </h3>
          {event.shortDescription && (
            <p className='text-sm text-muted-foreground line-clamp-2 mt-1'>
              {event.shortDescription}
            </p>
          )}
        </div>

        {/* Event Details */}
        <div className='space-y-2 text-sm text-muted-foreground'>
          {/* Date */}
          <div className='flex items-center gap-2'>
            <Calendar className='w-4 h-4' />
            <span>{formatDate(event.startDate)}</span>
          </div>

          {/* Location */}
          {event.location && (
            <div className='flex items-center gap-2'>
              <MapPin className='w-4 h-4' />
              <span className='line-clamp-1'>{event.location}</span>
            </div>
          )}

          {/* Attendees */}
          {attendeeCount > 0 && (
            <div className='flex items-center gap-2'>
              <Users className='w-4 h-4' />
              <span>{attendeeCount} attending</span>
            </div>
          )}
        </div>

        {/* Funding Progress for All-or-Nothing */}
        {event.isAllOrNothing && event.targetAmount && (
          <div className='pt-2 border-t'>
            <div className='flex justify-between text-xs mb-1'>
              <span className='text-muted-foreground'>Funding Progress</span>
              <span className='font-medium'>
                {(((event.currentAmount || 0) / event.targetAmount) * 100).toFixed(0)}%
              </span>
            </div>
            <div className='w-full bg-gray-200 rounded-full h-2'>
              <div
                className='bg-primary rounded-full h-2 transition-all duration-300'
                style={{
                  width: `${Math.min(((event.currentAmount || 0) / event.targetAmount) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Organizer */}
        {event.organizer && (
          <div className='pt-2 border-t'>
            <p className='text-xs text-muted-foreground'>
              Hosted by <span className='font-medium text-foreground'>{event.organizer.name}</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EventCard;
