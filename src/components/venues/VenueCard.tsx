import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  MapPin,
  Star,
  Users,
  DollarSign,
  Heart,
  Share2,
  Calendar,
  Clock,
  Wifi,
  Car,
  Camera,
  Eye,
  MessageCircle,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { EnhancedVenue } from '@/types/venue';
import { toast } from 'sonner';

interface VenueCardProps {
  venue: EnhancedVenue;
  onFavorite?: (venueId: string) => void | undefined;
  onShare?: (venue: EnhancedVenue) => void | undefined;
  showActions?: boolean | undefined;
  compact?: boolean | undefined;
  variant?: 'default' | undefined| 'compact' | 'featured';
}

const VenueCard = ({
  venue,
  onFavorite,
  onShare,
  showActions = true,
  compact = false,
  variant = 'default',
}: VenueCardProps) => {
  const [isFavorited, setIsFavorited] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorited(!isFavorited);
    onFavorite?.(venue.id);
    toast.success(isFavorited ? 'Removed from favorites' : 'Added to favorites');
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onShare?.(venue);

    // Copy venue URL to clipboard
    const url = `${window.location.origin}/venues/${venue.id}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        toast.success('Venue link copied to clipboard');
      })
      .catch(() => {
        toast.error('Failed to copy link');
      });
  };

  const getAvailabilityStatus = () => {
    return venue.status === 'active' ? 'available' : 'unavailable';
  };

  const availabilityStatus = getAvailabilityStatus();

  const formatPrice = (price: number) => {
    return `$${price}/hour`;
  };

  const getStarRating = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${
          i < Math.floor(rating)
            ? 'fill-yellow-400 text-yellow-400'
            : i < rating
              ? 'fill-yellow-400/50 text-yellow-400'
              : 'text-gray-300'
        }`}
      />
    ));
  };

  const cardHeight = compact ? 'h-80' : 'h-96';

  // Compact variant for lists
  if (variant === 'compact') {
    return (
      <Link to={`/venues/${venue.id}`}>
        <Card className="border border-gray-200 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                {venue.media.cover_image ? (
                  <img
                    src={venue.media.cover_image}
                    alt={venue.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Camera className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-[#2B2B2B] truncate">{venue.name}</h3>
                  {venue.analytics.average_rating > 0 && (
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>{venue.analytics.average_rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-1">{venue.venue_type} • {venue.capacity} guests</p>
                <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {venue.location.city}, {venue.location.state}
                </p>
                <p className="text-sm font-semibold text-[#2B2B2B]">
                  {formatPrice(venue.pricing.base_price_per_hour)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Card
      className={`group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${cardHeight} flex flex-col`}
    >
      <div className='relative h-48 overflow-hidden'>
        <Link to={`/venues/${venue.id}`}>
          <div className='relative'>
            {isImageLoading && (
              <div className='absolute inset-0 bg-muted animate-pulse flex items-center justify-center'>
                <Camera className='h-8 w-8 text-muted-foreground' />
              </div>
            )}
            <img
              src={
                venue.media.cover_image ||
                'https://images.unsplash.com/photo-1519167758481-83f29c1fe8c0?w=400&h=200&fit=crop'
              }
              alt={venue.name}
              className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${
                isImageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onLoad={() => setIsImageLoading(false)}
              onError={() => setIsImageLoading(false)}
            />

            {/* Overlay gradient */}
            <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300' />

            {/* Quick view button */}
            <div className='absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
              <Button size='sm' className='bg-white/90 text-black hover:bg-white'>
                <Eye className='h-4 w-4 mr-2' />
                Quick View
              </Button>
            </div>
          </div>
        </Link>

        {/* Status badge */}
        <div className='absolute top-3 left-3'>
          {availabilityStatus === 'available' ? (
            <Badge className='bg-black hover:bg-gray-800 text-white'>
              <CheckCircle className='h-3 w-3 mr-1' />
              Available
            </Badge>
          ) : (
            <Badge variant='secondary' className='bg-gray-600 hover:bg-gray-700 text-white'>
              <Clock className='h-3 w-3 mr-1' />
              Busy
            </Badge>
          )}
        </div>

        {/* Action buttons */}
        {showActions && (
          <div className='absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
            <Button
              size='sm'
              variant='secondary'
              className='h-8 w-8 p-0 bg-white/90 hover:bg-white'
              onClick={handleFavorite}
            >
              <Heart
                className={`h-4 w-4 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
              />
            </Button>
            <Button
              size='sm'
              variant='secondary'
              className='h-8 w-8 p-0 bg-white/90 hover:bg-white'
              onClick={handleShare}
            >
              <Share2 className='h-4 w-4 text-gray-600' />
            </Button>
          </div>
        )}

        {/* Image count indicator */}
        {venue.media.gallery_images && venue.media.gallery_images.length > 0 && (
          <div className='absolute bottom-3 right-3'>
            <Badge variant='secondary' className='bg-black/50 text-white text-xs'>
              <Camera className='h-3 w-3 mr-1' />
              {venue.media.gallery_images.length + 1}
            </Badge>
          </div>
        )}
      </div>

      <CardContent className='p-4 flex-1 flex flex-col'>
        <div className='flex items-start justify-between mb-2'>
          <Link to={`/venues/${venue.id}`} className='flex-1 min-w-0'>
            <h3 className='font-semibold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors'>
              {venue.name}
            </h3>
          </Link>
        </div>

        <div className='flex items-center text-muted-foreground mb-2'>
          <MapPin className='h-4 w-4 mr-1 flex-shrink-0' />
          <span className='text-sm truncate'>{venue.location.city}, {venue.location.state}</span>
        </div>

        <div className='flex items-center gap-3 mb-3'>
          <div className='flex items-center'>
            {getStarRating(venue.analytics.average_rating)}
            <span className='ml-1 text-sm font-medium'>{venue.analytics.average_rating.toFixed(1)}</span>
          </div>
          <div className='flex items-center text-sm text-muted-foreground'>
            <MessageCircle className='h-3 w-3 mr-1' />
            <span>{venue.analytics.total_reviews} reviews</span>
          </div>
        </div>

        <div className='flex items-center justify-between text-sm mb-4'>
          <div className='flex items-center text-muted-foreground'>
            <Users className='h-4 w-4 mr-1' />
            <span>Up to {venue.capacity.toLocaleString()}</span>
          </div>
          <div className='flex items-center font-semibold'>
            <DollarSign className='h-4 w-4 mr-1' />
            <span>{formatPrice(venue.pricing.base_price_per_hour)}</span>
          </div>
        </div>

        {/* Amenities preview */}
        {!compact && (
          <div className='flex flex-wrap gap-1 mb-4'>
            {venue.amenities.technology.includes('wifi') && (
              <Badge variant='outline' className='text-xs'>
                <Wifi className='h-3 w-3 mr-1' />
                WiFi
              </Badge>
            )}
            {venue.amenities.basic.includes('parking') && (
              <Badge variant='outline' className='text-xs'>
                <Car className='h-3 w-3 mr-1' />
                Parking
              </Badge>
            )}
            {venue.amenities.basic.length > 2 && (
              <Badge variant='outline' className='text-xs'>
                +{venue.amenities.basic.length - 2} more
              </Badge>
            )}
          </div>
        )}

        <div className='mt-auto space-y-2'>
          <div className='flex gap-2'>
            <Button variant='outline' size='sm' className='flex-1' asChild>
              <Link to={`/venues/${venue.id}`}>View Details</Link>
            </Button>
            <Button
              size='sm'
              className='flex-1'
              disabled={availabilityStatus !== 'available'}
              asChild={availabilityStatus === 'available'}
            >
              {availabilityStatus === 'available' ? (
                <Link to={`/venues/${venue.id}?booking=true`}>
                  <Calendar className='h-4 w-4 mr-2' />
                  Book Now
                </Link>
              ) : (
                <>
                  <AlertCircle className='h-4 w-4 mr-2' />
                  Unavailable
                </>
              )}
            </Button>
          </div>

          {availabilityStatus === 'available' && (
            <p className='text-xs text-center text-muted-foreground'>
              Usually responds within 2 hours
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VenueCard;
