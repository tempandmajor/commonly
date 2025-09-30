import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import VenueFilters from './VenueFilters';
import { VenueFilters as VenueFiltersType } from '@/hooks/useVenues';

interface VenueSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onFilterChange: (filters: Partial<VenueFiltersType>) => void;
  filters: VenueFiltersType;
  onResetFilters: () => void;
}

const VenueSearch = ({
  searchQuery,
  onSearchChange,
  filters,
  onFilterChange,
  onResetFilters,
}: VenueSearchProps) => {
  const [showFilters, setShowFilters] = useState(false);

  const handleToggleFilters = () => {
    setShowFilters(prev => !prev);
  };

  return (
    <div className='mb-6'>
      <Card className='overflow-hidden'>
        <CardHeader className='bg-muted/50 p-4'>
          <div className='flex flex-col sm:flex-row gap-3 justify-between'>
            <Button
              variant={showFilters ? 'default' : 'outline'}
              size='sm'
              onClick={handleToggleFilters}
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
            <div className='relative max-w-sm'>
              <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search venues...'
                value={searchQuery}
                onChange={e => onSearchChange((e.target as HTMLInputElement).value)}
                className='pl-8'
              />
            </div>
          </div>
        </CardHeader>

        {showFilters && (
          <div className='p-4 border-t'>
            <VenueFilters filters={filters} onFilterChange={onFilterChange} />
          </div>
        )}
      </Card>
    </div>
  );
};

export default VenueSearch;
