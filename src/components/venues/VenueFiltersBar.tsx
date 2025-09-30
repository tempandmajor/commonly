import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, SlidersHorizontal, Grid, List, Map, X } from 'lucide-react';

const VENUE_TYPES = [
  'all',
  'Event Hall',
  'Conference Room',
  'Outdoor Space',
  'Restaurant',
  'Gallery',
  'Theater',
  'Studio',
  'Warehouse',
  'Rooftop',
];

const CAPACITY_RANGES = [
  { value: 'all', label: 'Any capacity' },
  { value: 'small', label: 'Up to 50 guests' },
  { value: 'medium', label: '50-150 guests' },
  { value: 'large', label: '150-500 guests' },
  { value: 'xlarge', label: '500+ guests' },
];

const PRICE_RANGES = [
  { value: 'all', label: 'Any price' },
  { value: 'budget', label: 'Under $100/hr' },
  { value: 'mid', label: '$100-300/hr' },
  { value: 'premium', label: '$300-500/hr' },
  { value: 'luxury', label: '$500+/hr' },
];

const SORT_OPTIONS = [
  { value: 'rating', label: 'Highest rated' },
  { value: 'price_low', label: 'Price: Low to high' },
  { value: 'price_high', label: 'Price: High to low' },
  { value: 'capacity', label: 'Largest capacity' },
  { value: 'newest', label: 'Newest first' },
  { value: 'popular', label: 'Most popular' },
];

interface VenueFiltersBarProps {
  searchQuery: string;
  venueType: string;
  capacity: string;
  priceRange: string;
  sortBy: string;
  viewMode: 'grid' | 'list' | 'map';
  showFilters: boolean;
  onSearchChange: (value: string) => void;
  onVenueTypeChange: (type: string) => void;
  onCapacityChange: (capacity: string) => void;
  onPriceRangeChange: (range: string) => void;
  onSortChange: (sort: string) => void;
  onViewModeChange: (mode: 'grid' | 'list' | 'map') => void;
  onToggleFilters: () => void;
  onClearFilters: () => void;
}

const VenueFiltersBar = memo<VenueFiltersBarProps>(({
  searchQuery,
  venueType,
  capacity,
  priceRange,
  sortBy,
  viewMode,
  showFilters,
  onSearchChange,
  onVenueTypeChange,
  onCapacityChange,
  onPriceRangeChange,
  onSortChange,
  onViewModeChange,
  onToggleFilters,
  onClearFilters,
}) => {
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange((e.target as HTMLInputElement).value);
  };

  const activeFilterCount = [venueType, capacity, priceRange].filter(f => f !== 'all').length;

  return (
    <Card className='mb-8 border border-gray-200 bg-white'>
      <CardContent className='p-6'>
        <div className='space-y-4'>
          <div className='flex flex-col md:flex-row gap-4'>
            <div className='relative flex-1'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
              <Input
                placeholder='Search venues, locations, or amenities...'
                value={searchQuery}
                onChange={handleSearchInput}
                className='pl-10 border-gray-300'
              />
            </div>

            <Button
              variant='outline'
              onClick={onToggleFilters}
              className='border-gray-300 text-[#2B2B2B] hover:bg-gray-50'
            >
              <SlidersHorizontal className='h-4 w-4 mr-2' />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant='secondary' className='ml-2 bg-[#2B2B2B] text-white'>
                  {activeFilterCount}
                </Badge>
              )}
            </Button>

            <div className='flex border rounded-lg border-gray-300'>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size='sm'
                onClick={() => onViewModeChange('grid')}
                className={`rounded-r-none ${
                  viewMode === 'grid'
                    ? 'bg-[#2B2B2B] text-white hover:bg-gray-800'
                    : 'text-[#2B2B2B] hover:bg-gray-50'
                }`}
              >
                <Grid className='h-4 w-4' />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size='sm'
                onClick={() => onViewModeChange('list')}
                className={`rounded-none ${
                  viewMode === 'list'
                    ? 'bg-[#2B2B2B] text-white hover:bg-gray-800'
                    : 'text-[#2B2B2B] hover:bg-gray-50'
                }`}
              >
                <List className='h-4 w-4' />
              </Button>
              <Button
                variant={viewMode === 'map' ? 'default' : 'ghost'}
                size='sm'
                onClick={() => onViewModeChange('map')}
                className={`rounded-l-none ${
                  viewMode === 'map'
                    ? 'bg-[#2B2B2B] text-white hover:bg-gray-800'
                    : 'text-[#2B2B2B] hover:bg-gray-50'
                }`}
              >
                <Map className='h-4 w-4' />
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200'>
              <Select value={venueType} onValueChange={onVenueTypeChange}>
                <SelectTrigger className='border-gray-300'>
                  <SelectValue placeholder='Venue type' />
                </SelectTrigger>
                <SelectContent>
                  {VENUE_TYPES.map(type => (
                    <SelectItem key={type} value={type}>
                      {type === 'all' ? 'All Types' : type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={capacity} onValueChange={onCapacityChange}>
                <SelectTrigger className='border-gray-300'>
                  <SelectValue placeholder='Capacity' />
                </SelectTrigger>
                <SelectContent>
                  {CAPACITY_RANGES.map(range => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={priceRange} onValueChange={onPriceRangeChange}>
                <SelectTrigger className='border-gray-300'>
                  <SelectValue placeholder='Price range' />
                </SelectTrigger>
                <SelectContent>
                  {PRICE_RANGES.map(range => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={onSortChange}>
                <SelectTrigger className='border-gray-300'>
                  <SelectValue placeholder='Sort by' />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {activeFilterCount > 0 && (
            <div className='flex items-center justify-between pt-2 border-t border-gray-200'>
              <div className='flex flex-wrap gap-2'>
                {venueType !== 'all' && (
                  <Badge variant='secondary' className='bg-gray-100 text-gray-800'>
                    Type: {venueType}
                    <button
                      onClick={() => onVenueTypeChange('all')}
                      className='ml-1 hover:text-red-600'
                    >
                      <X className='h-3 w-3' />
                    </button>
                  </Badge>
                )}
                {capacity !== 'all' && (
                  <Badge variant='secondary' className='bg-gray-100 text-gray-800'>
                    Capacity: {CAPACITY_RANGES.find(r => r.value === capacity)?.label}
                    <button
                      onClick={() => onCapacityChange('all')}
                      className='ml-1 hover:text-red-600'
                    >
                      <X className='h-3 w-3' />
                    </button>
                  </Badge>
                )}
                {priceRange !== 'all' && (
                  <Badge variant='secondary' className='bg-gray-100 text-gray-800'>
                    Price: {PRICE_RANGES.find(r => r.value === priceRange)?.label}
                    <button
                      onClick={() => onPriceRangeChange('all')}
                      className='ml-1 hover:text-red-600'
                    >
                      <X className='h-3 w-3' />
                    </button>
                  </Badge>
                )}
              </div>
              <Button
                variant='ghost'
                size='sm'
                onClick={onClearFilters}
                className='text-gray-600 hover:text-[#2B2B2B]'
              >
                Clear all
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

VenueFiltersBar.displayName = 'VenueFiltersBar';

export default VenueFiltersBar;