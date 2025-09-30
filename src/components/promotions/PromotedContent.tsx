import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PromotedContentProps {
  type: 'event' | 'venue' | 'caterer' | 'artist';
  id: string;
  title: string;
  description: string;
  image?: string | undefined;
  location?: string | undefined;
  date?: string | undefined;
  capacity?: number | undefined;
  price?: string | undefined;
  promotionId: string;
  onPromotionClick?: (promotionId: string) => void | undefined;
}

const PromotedContent = ({
  type,
  id,
  title,
  description,
  image,
  location,
  date,
  capacity,
  price,
  promotionId,
  onPromotionClick,
}: PromotedContentProps) => {
  const handleClick = () => {
    // Track click for analytics
    if (onPromotionClick) {
      onPromotionClick(promotionId);
    }
  };

  // Determine link path based on content type
  const linkPath = (() => {
    switch (type) {
      case 'event':
        return `/events/${id}`;
      case 'venue':
        return `/venues/${id}`;
      case 'caterer':
        return `/caterers/${id}`;
      case 'artist':
        return `/artists/${id}`;
      default:
        return '#';
    }
  })();

  return (
    <Card className='overflow-hidden border-2 border-primary/20 relative h-full flex flex-col'>
      <Badge className='absolute top-2 right-2 z-10' variant='secondary'>
        Sponsored
      </Badge>

      {image && (
        <div className='h-40 overflow-hidden'>
          <img
            src={image}
            alt={title}
            className='w-full h-full object-cover transition-transform hover:scale-105'
          />
        </div>
      )}

      <CardContent className='pt-6 flex-1'>
        <h3 className='font-semibold text-lg'>{title}</h3>
        <p className='text-sm text-muted-foreground line-clamp-2 mt-1'>{description}</p>

        <div className='mt-4 space-y-2'>
          {location && (
            <div className='flex items-center text-sm'>
              <MapPin className='h-4 w-4 mr-2 text-muted-foreground' />
              <span>{location}</span>
            </div>
          )}

          {date && (
            <div className='flex items-center text-sm'>
              <Calendar className='h-4 w-4 mr-2 text-muted-foreground' />
              <span>{date}</span>
            </div>
          )}

          {capacity && (
            <div className='flex items-center text-sm'>
              <Users className='h-4 w-4 mr-2 text-muted-foreground' />
              <span>Capacity: {capacity}</span>
            </div>
          )}

          {price && (
            <div className='flex items-center text-sm font-medium'>
              <span>Price: {price}</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className='pt-2 pb-4'>
        <Link to={linkPath} className='w-full' onClick={handleClick}>
          <Button className='w-full' variant='default'>
            View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default PromotedContent;
