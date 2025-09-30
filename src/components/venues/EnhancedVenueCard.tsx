import React, { useState, memo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  CheckCircle,
  AlertCircle,
  Eye,
  MessageCircle,
  Camera,
} from 'lucide-react';
import { toast } from 'sonner';
import { Venue } from '@/hooks/useVenueSearch';

interface EnhancedVenueCardProps {
  venue: Venue;
  viewMode: 'grid' | 'list';
  onFavorite?: (venueId: string) => void | undefined;
  onShare?: (venue: Venue) => void | undefined;
}

const EnhancedVenueCard = memo<EnhancedVenueCardProps>(({
  venue,
  viewMode,
  onFavorite,
  onShare,
}) => {
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

  const formatPrice = (venue: Venue) => {
    const pricePerHour = venue.metadata?.pricePerHour;
    if (pricePerHour) {
      return `$${pricePerHour}/hour`;
    }

    // Calculate based on capacity as fallback
    const estimatedPrice = Math.max(50, venue.capacity * 2);
    return `$${estimatedPrice}/hour`;
  };

  const getVenueType = (venue: Venue) => {
    return venue.metadata?.venueType || 'Event Space';
  };

  const getRating = () => {
    // Simulate rating based on venue attributes
    const baseRating = 4.0;
    const capacityBonus = venue.capacity > 100 ? 0.3 : 0.1;
    const amenitiesBonus = venue.amenities.length * 0.05;
    return Math.min(5.0, baseRating + capacityBonus + amenitiesBonus);
  };

  const getReviewCount = () => {
    // Simulate review count
    return Math.floor(Math.random() * 50) + 10;
  };

  const getAvailabilityStatus = () => {
    return 'available'; // Default to available
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

  const rating = getRating();
  const reviewCount = getReviewCount();
  const availabilityStatus = getAvailabilityStatus();
  const venueImages = [
    'https://images.unsplash.com/photo-1519167758481-83f29c1fe8c0?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
  ];

  if (viewMode === 'list') {
    return (
      <Card className='group hover:shadow-lg transition-all duration-200 border border-gray-200 bg-white'>
        <Link to={`/venues/${venue.id}`} className='block'>
          <CardContent className='p-6'>
            <div className='flex items-center gap-6'>
              <div className='relative w-32 h-24 flex-shrink-0'>
                {isImageLoading && (
                  <div className='absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center rounded-lg'>
                    <Camera className='h-6 w-6 text-gray-400' />
                  </div>
                )}
                <img
                  src={venueImages[0]}
                  alt={venue.name}
                  className={`w-full h-full object-cover rounded-lg transition-all duration-300 group-hover:scale-105 ${
                    isImageLoading ? 'opacity-0' : 'opacity-100'
                  }`}
                  onLoad={() => setIsImageLoading(false)}
                  onError={() => setIsImageLoading(false)}
                />

                {/* Status badge */}
                <div className='absolute top-2 left-2'>
                  {availabilityStatus === 'available' ? (
                    <Badge className='bg-[#2B2B2B] hover:bg-gray-800 text-white text-xs'>
                      <CheckCircle className='h-3 w-3 mr-1' />
                      Available
                    </Badge>
                  ) : (
                    <Badge variant='secondary' className='bg-gray-600 text-white text-xs'>
                      <Clock className='h-3 w-3 mr-1' />
                      Busy
                    </Badge>
                  )}
                </div>
              </div>

              <div className='flex-1 min-w-0'>
                <div className='flex items-start justify-between'>
                  <div className='flex-1 min-w-0'>
                    <h3 className='font-semibold text-lg text-[#2B2B2B] group-hover:text-gray-800 transition-colors truncate'>
                      {venue.name}
                    </h3>

                    <div className='flex items-center text-gray-600 mt-1'>
                      <MapPin className='h-4 w-4 mr-1 flex-shrink-0' />
                      <span className='text-sm truncate'>
                        {venue.location.city}, {venue.location.state}
                      </span>
                    </div>

                    <div className='flex items-center gap-4 mt-2'>
                      <div className='flex items-center'>
                        {getStarRating(rating)}
                        <span className='ml-1 text-sm font-medium'>{rating.toFixed(1)}</span>
                      </div>
                      <div className='flex items-center text-sm text-gray-600'>
                        <MessageCircle className='h-3 w-3 mr-1' />
                        <span>{reviewCount} reviews</span>
                      </div>
                      <Badge variant='outline' className='text-xs border-gray-300'>
                        {getVenueType(venue)}
                      </Badge>
                    </div>

                    <div className='flex items-center gap-4 mt-3 text-sm text-gray-600'>
                      <div className='flex items-center'>
                        <Users className='h-4 w-4 mr-1' />
                        <span>Up to {venue.capacity.toLocaleString()}</span>
                      </div>
                      <div className='flex items-center font-semibold text-[#2B2B2B]'>
                        <DollarSign className='h-4 w-4 mr-1' />
                        <span>{formatPrice(venue)}</span>
                      </div>
                    </div>

                    {venue.amenities.length > 0 && (
                      <div className='flex flex-wrap gap-1 mt-3'>
                        {venue.amenities.slice(0, 3).map((amenity) => (
                          <Badge key={amenity} variant='outline' className='text-xs border-gray-300 text-gray-700'>
                            {amenity}
                          </Badge>
                        ))}
                        {venue.amenities.length > 3 && (
                          <Badge variant='outline' className='text-xs border-gray-300 text-gray-700'>
                            +{venue.amenities.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  <div className='ml-4 flex flex-col gap-2'>
                    <div className='flex gap-2'>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={handleFavorite}
                        className='h-8 w-8 p-0 hover:bg-gray-100'
                      >
                        <Heart
                          className={`h-4 w-4 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
                        />
                      </Button>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={handleShare}
                        className='h-8 w-8 p-0 hover:bg-gray-100'
                      >
                        <Share2 className='h-4 w-4 text-gray-600' />
                      </Button>
                    </div>

                    <Button
                      size='sm'
                      className='bg-[#2B2B2B] hover:bg-gray-800 text-white'
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
                </div>
              </div>
            </div>
          </CardContent>
        </Link>
      </Card>
    );
  }

  // Grid view
  return (
    <Card className='group overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-96 flex flex-col border border-gray-200 bg-white'>
      <div className='relative h-48 overflow-hidden'>
        <Link to={`/venues/${venue.id}`}>
          <div className='relative'>
            {isImageLoading && (
              <div className='absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center'>
                <Camera className='h-8 w-8 text-gray-400' />
              </div>
            )}
            <img
              src={venueImages[0]}
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
              <Button size='sm' className='bg-white/90 text-[#2B2B2B] hover:bg-white'>
                <Eye className='h-4 w-4 mr-2' />
                Quick View
              </Button>
            </div>
          </div>
        </Link>

        {/* Status badge */}
        <div className='absolute top-3 left-3'>
          {availabilityStatus === 'available' ? (
            <Badge className='bg-[#2B2B2B] hover:bg-gray-800 text-white'>
              <CheckCircle className='h-3 w-3 mr-1' />
              Available
            </Badge>
          ) : (
            <Badge variant='secondary' className='bg-gray-600 text-white'>
              <Clock className='h-3 w-3 mr-1' />
              Busy
            </Badge>
          )}
        </div>

        {/* Action buttons */}
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

        {/* Image count indicator */}
        <div className='absolute bottom-3 right-3'>
          <Badge variant='secondary' className='bg-black/50 text-white text-xs'>
            <Camera className='h-3 w-3 mr-1' />
            {venueImages.length}
          </Badge>
        </div>
      </div>

      <CardContent className='p-4 flex-1 flex flex-col'>
        <div className='flex items-start justify-between mb-2'>
          <Link to={`/venues/${venue.id}`} className='flex-1 min-w-0'>
            <h3 className='font-semibold text-lg leading-tight line-clamp-2 text-[#2B2B2B] group-hover:text-gray-800 transition-colors'>
              {venue.name}
            </h3>
          </Link>
        </div>

        <div className='flex items-center text-gray-600 mb-2'>
          <MapPin className='h-4 w-4 mr-1 flex-shrink-0' />
          <span className='text-sm truncate'>{venue.location.city}, {venue.location.state}</span>
        </div>

        <div className='flex items-center gap-3 mb-3'>
          <div className='flex items-center'>
            {getStarRating(rating)}
            <span className='ml-1 text-sm font-medium'>{rating.toFixed(1)}</span>
          </div>
          <div className='flex items-center text-sm text-gray-600'>
            <MessageCircle className='h-3 w-3 mr-1' />
            <span>{reviewCount} reviews</span>
          </div>
        </div>

        <div className='flex items-center justify-between text-sm mb-4'>
          <div className='flex items-center text-gray-600'>
            <Users className='h-4 w-4 mr-1' />
            <span>Up to {venue.capacity.toLocaleString()}</span>
          </div>
          <div className='flex items-center font-semibold text-[#2B2B2B]'>
            <DollarSign className='h-4 w-4 mr-1' />
            <span>{formatPrice(venue)}</span>
          </div>
        </div>

        {/* Amenities preview */}
        {venue.amenities.length > 0 && (
          <div className='flex flex-wrap gap-1 mb-4'>
            <Badge variant='outline' className='text-xs border-gray-300'>
              <Wifi className='h-3 w-3 mr-1' />
              WiFi
            </Badge>
            <Badge variant='outline' className='text-xs border-gray-300'>
              <Car className='h-3 w-3 mr-1' />
              Parking
            </Badge>
            {venue.amenities.length > 2 && (
              <Badge variant='outline' className='text-xs border-gray-300'>
                +{venue.amenities.length - 2} more
              </Badge>
            )}
          </div>
        )}

        <div className='mt-auto space-y-2'>
          <div className='flex gap-2'>
            <Button variant='outline' size='sm' className='flex-1 border-gray-300' asChild>
              <Link to={`/venues/${venue.id}`}>View Details</Link>
            </Button>
            <Button
              size='sm'
              className='flex-1 bg-[#2B2B2B] hover:bg-gray-800 text-white'
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
            <p className='text-xs text-center text-gray-600'>
              Usually responds within 2 hours
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

EnhancedVenueCard.displayName = 'EnhancedVenueCard';

export default EnhancedVenueCard;