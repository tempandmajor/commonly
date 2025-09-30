import { Video, Shield } from 'lucide-react';
import { Event, EventType } from '@/lib/types/event';
import { CalendarIcon, MapPinIcon, ClockIcon, UserIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatTimestamp } from '@/utils/dates';
import OptimizedImage from '@/components/common/OptimizedImage';

interface EventHeaderProps {
  event: Event;
}

const EventHeader = ({ event }: EventHeaderProps) => {
  const isVirtualEvent = event.type === EventType.VirtualEvent || !!event.virtualEventDetails;
  const hasSponsors = event.sponsorshipTiers?.some(
    tier => tier.sponsors && tier.sponsors.length > 0
  );

  const formatDate = (date?: Date | string | any) => {
    return formatTimestamp(date);
  };

  const formatTime = (date?: Date | string | any) => {
    return formatTimestamp(date);
  };

  // Default placeholder image URL
  const defaultImage = '/placeholder.svg';
  const fallbackImage =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1920' height='480' viewBox='0 0 1920 480'%3E%3Crect width='1920' height='480' fill='%23f3f4f6'/%3E%3Ctext x='960' y='240' text-anchor='middle' dominant-baseline='middle' font-family='system-ui' font-size='24' fill='%236b7280'%3EEvent Image%3C/text%3E%3C/svg%3E";

  // Use banner image if available and not empty, otherwise use fallback
  const eventImage =
    event.bannerImage && event.bannerImage.trim() !== '' ? event.bannerImage : defaultImage;

  // Count total sponsors across all tiers
  let totalSponsors = 0;
  event.sponsorshipTiers?.forEach(tier => {
    if (tier.sponsors) {
      totalSponsors += tier.sponsors.length;
    }
  });

  return (
    <div className='w-full h-72 relative overflow-hidden'>
      {/* Background Image with optimization */}
      <div className='absolute inset-0'>
        <OptimizedImage
          src={eventImage}
          alt={`${event.title} banner`}
          className='w-full h-full'
          width={1920}
          height={480}
          priority={true} // Above the fold, load immediately
          placeholder={fallbackImage}
        />

        {/* Gradient overlay for text readability */}
        <div className='absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent' />
      </div>

      {/* Content overlay */}
      <div className='relative z-10 h-full flex items-end'>
        <div className='container pb-8 text-white w-full'>
          <div className='flex flex-wrap gap-2 mb-2'>
            {isVirtualEvent && (
              <Badge className='bg-black hover:bg-gray-800 text-white border-0'>
                <Video className='h-3 w-3 mr-1' />
                Virtual Event
              </Badge>
            )}
            {hasSponsors && (
              <Badge className='bg-gray-800 hover:bg-gray-700 text-white border-0'>
                <Shield className='h-3 w-3 mr-1' />
                {totalSponsors} Sponsor{totalSponsors !== 1 ? 's' : ''}
              </Badge>
            )}
            {event.sponsorshipTiers && event.sponsorshipTiers.length > 0 && !hasSponsors && (
              <Badge variant='outline' className='border-gray-400 text-gray-300 bg-gray-900/30'>
                <Shield className='h-3 w-3 mr-1' />
                Seeking Sponsors
              </Badge>
            )}
            {event.isAllOrNothing && (
              <Badge className='bg-gray-600 hover:bg-gray-500 text-white border-0'>
                Crowdfunded
              </Badge>
            )}
            {event.isFree && (
              <Badge className='bg-gray-500 hover:bg-gray-400 text-white border-0'>
                Free Event
              </Badge>
            )}
          </div>

          <h1 className='text-3xl md:text-4xl lg:text-5xl font-bold mb-2 text-white drop-shadow-lg'>
            {event.title}
          </h1>

          <div className='flex flex-wrap gap-4 items-center text-sm md:text-base text-white/90'>
            <span className='flex items-center gap-1'>
              <CalendarIcon className='h-4 w-4' />
              {formatDate(event.startDate)}
            </span>
            <span className='flex items-center gap-1'>
              <ClockIcon className='h-4 w-4' />
              {formatTime(event.startDate)}
            </span>
            {!isVirtualEvent && event.location && (
              <span className='flex items-center gap-1'>
                <MapPinIcon className='h-4 w-4' />
                <span className='truncate max-w-xs'>{event.location}</span>
              </span>
            )}
            <span className='flex items-center gap-1'>
              <UserIcon className='h-4 w-4' />
              {event.organizer?.name || 'Event Organizer'}
            </span>
          </div>

          {/* Funding progress for crowdfunded events */}
          {event.isAllOrNothing && event.targetAmount && (
            <div className='mt-4 max-w-md'>
              <div className='flex justify-between text-sm text-white/90 mb-1'>
                <span>Funding Progress</span>
                <span>
                  ${event.currentAmount || 0} / ${event.targetAmount}
                </span>
              </div>
              <div className='w-full bg-white/20 rounded-full h-2'>
                <div
                  className='bg-black h-2 rounded-full transition-all duration-300'
                  style={{
                    width: `${Math.min(100, ((event.currentAmount || 0) / event.targetAmount) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventHeader;
