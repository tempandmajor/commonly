import React from 'react';
import { Loader2, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UnifiedCaterer } from '@/types/unifiedCaterer';
import CatererCard from './CatererCard';

interface CatererListProps {
  caterers: UnifiedCaterer[];
  loading: boolean;
  dateNeeded?: string | undefined;
  sortOrder: string;
  onSortChange: (value: string) => void;
  onResetFilters: () => void;
}

const CatererList: React.FC<CatererListProps> = ({
  caterers,
  loading,
  dateNeeded,
  sortOrder,
  onSortChange,
  onResetFilters,
}) => {
  return (
    <div className='w-full'>
      <div className='flex justify-between items-center mb-6'>
        {loading ? (
          <p className='text-muted-foreground flex items-center'>
            <Loader2 className='h-4 w-4 animate-spin mr-2' /> Loading caterers...
          </p>
        ) : (
          <p className='text-muted-foreground'>{caterers.length} caterers found</p>
        )}
        <Select value={sortOrder} onValueChange={onSortChange}>
          <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder='Sort by' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='popular'>Most Popular</SelectItem>
            <SelectItem value='rating'>Highest Rated</SelectItem>
            <SelectItem value='price-asc'>Price: Low to High</SelectItem>
            <SelectItem value='price-desc'>Price: High to Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className='flex justify-center items-center h-60'>
          <div className='flex flex-col items-center'>
            <Loader2 className='h-10 w-10 animate-spin text-primary mb-4' />
            <p className='text-muted-foreground'>Loading caterers...</p>
          </div>
        </div>
      ) : caterers.length === 0 ? (
        <div className='text-center py-20 bg-muted/20 rounded-lg border border-dashed'>
          <UtensilsCrossed className='h-10 w-10 text-muted-foreground mx-auto mb-4' />
          <h3 className='text-lg font-medium mb-2'>No caterers found</h3>
          <p className='text-muted-foreground mb-4'>
            Try adjusting your filters or search for caterers in a different location.
          </p>
          <Button variant='outline' onClick={onResetFilters}>
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {caterers.map(caterer => (
            <CatererCard key={caterer.id} caterer={caterer} {...(dateNeeded && { dateNeeded })} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CatererList;
