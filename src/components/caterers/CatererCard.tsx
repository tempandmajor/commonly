import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { MapPin, Star, UtensilsCrossed, Tag, Calendar } from 'lucide-react';
import { UnifiedCaterer } from '@/types/unifiedCaterer';

interface CatererCardProps {
  caterer: UnifiedCaterer | any;
  dateNeeded?: string | undefined;
}

const CatererCard: React.FC<CatererCardProps> = ({ caterer, dateNeeded }) => {
  // Handle both types of Caterer objects (from different sources)
  const imageUrl =
    caterer.coverImage || (caterer.images && caterer.images.length > 0 ? caterer.images[0] : '');
  const location =
    typeof caterer.location === 'string'
      ? caterer.location
      : caterer.location?.address || 'No location';

  const cuisines = caterer.cuisineTypes || caterer.cuisine || [];
  const specialDiets = caterer.specialDiets || [];

  return (
    <div className='bg-card rounded-lg border overflow-hidden flex flex-col h-full hover:shadow-lg transition-shadow duration-300'>
      <div className='h-48 overflow-hidden relative'>
        <img
          src={imageUrl}
          alt={caterer.name}
          className='object-cover w-full h-full transition-transform hover:scale-105 duration-300'
        />
      </div>
      <div className='p-4 flex-1 flex flex-col'>
        <h3 className='font-semibold text-lg'>{caterer.name}</h3>
        <div className='flex items-center text-muted-foreground mt-1 text-sm'>
          <MapPin className='h-3.5 w-3.5 mr-1' />
          {location}
        </div>
        <div className='flex items-center mt-2'>
          <Star className='h-4 w-4 text-yellow-400 mr-1' />
          <span>{caterer.rating.toFixed(1)}</span>
          <span className='text-muted-foreground ml-3'>{caterer.priceRange}</span>
        </div>
        <Separator className='my-3' />
        <div className='mt-2'>
          {cuisines.length > 0 && (
            <div className='flex items-start gap-1 text-muted-foreground text-sm mb-2'>
              <UtensilsCrossed className='h-3.5 w-3.5 mr-1 mt-0.5' />
              <span>{cuisines.join(', ')}</span>
            </div>
          )}
          {specialDiets?.length > 0 && (
            <div className='flex flex-wrap gap-1 mt-2'>
              {specialDiets.map((diet: string, index: number) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  <Tag className="h-3 w-3 mr-1" />
                  {diet}
                </Badge>
              ))}
            </div>
          )}
          {dateNeeded && (
            <div className='flex items-center text-xs text-muted-foreground mt-2'>
              <Calendar className='h-3 w-3 mr-1' />
              <span>
                Available for{' '}
                {new Date(dateNeeded).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                }) as string}
              </span>
            </div>
          )}
        </div>
        <Button variant='default' className='w-full mt-4'>
          View Details
        </Button>
      </div>
    </div>
  );
};

export default CatererCard;
