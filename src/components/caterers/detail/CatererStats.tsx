import React from 'react';
import { UnifiedCaterer } from '@/types/unifiedCaterer';
import { Star, Users, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CatererStatsProps {
  caterer: UnifiedCaterer;
}

const CatererStats: React.FC<CatererStatsProps> = ({ caterer }) => {
  return (
    <div className='flex flex-wrap items-center gap-4 mt-3'>
      <div className='flex items-center'>
        <Star className='h-4 w-4 text-yellow-500 mr-1 fill-yellow-500' />
        <span className='font-medium'>{caterer.rating.toFixed(1)}</span>
        <span className='text-sm text-muted-foreground ml-1'>
          ({caterer.reviewCount} {caterer.reviewCount === 1 ? 'review' : 'reviews'})
        </span>
      </div>

      <div className='flex items-center'>
        <Users className='h-4 w-4 mr-1' />
        <span className='text-sm'>
          {caterer.capacity?.min || 0}-{caterer.capacity?.max || 0} guests
        </span>
      </div>

      <div className='flex flex-wrap gap-2'>
        {caterer.cuisineTypes.slice(0, 3).map((cuisine, index) => (
          <Badge key={index} variant='outline'>
            {cuisine}
          </Badge>
        ))}
        {caterer.cuisineTypes.length > 3 && (
          <Badge variant='outline'>+{caterer.cuisineTypes.length - 3} more</Badge>
        )}
      </div>

      {caterer.featured && (
        <div className='flex items-center'>
          <Award className='h-4 w-4 text-primary mr-1' />
          <span className='text-sm font-medium'>Featured Caterer</span>
        </div>
      )}
    </div>
  );
};

export default CatererStats;
