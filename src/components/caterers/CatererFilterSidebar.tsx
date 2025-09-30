import { Input } from '@/components/ui/input';
import { Filter } from 'lucide-react';
import LocationSelector from '@/components/location/LocationSelector';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CUISINE_TYPES, DIET_TYPES, PRICE_RANGES } from '@/lib/types/caterer';

interface CatererFilterSidebarProps {
  locationFilter?: string | undefined;
  cuisineFilter?: string | undefined;
  dietFilter?: string | undefined;
  priceFilter?: string | undefined;
  dateNeeded?: string | undefined;
  locationInfo: {
    formatted: string | null;
    loading: boolean;
    error: string | null;
  };
  onLocationChange: (location: string) => void;
  onCuisineChange: (cuisine: string) => void;
  onDietChange: (diet: string) => void;
  onPriceChange: (price: string) => void;
  onDateChange: (date: string) => void;
}

const CatererFilterSidebar = ({
  locationFilter,
  cuisineFilter,
  dietFilter,
  priceFilter,
  dateNeeded,
  locationInfo,
  onLocationChange,
  onCuisineChange,
  onDietChange,
  onPriceChange,
  onDateChange,
}: CatererFilterSidebarProps) => {
  const handleLocationSelect = (newLocation: string) => {
    const locationValue = newLocation === 'All locations' ? undefined : newLocation;
    onLocationChange(locationValue || '');

    if (newLocation !== 'All locations') {
      // Track location filter usage for analytics
      // Location filter updated
    }
  };

  return (
    <div className='w-full max-w-sm bg-white border rounded-lg shadow-sm p-6 h-fit'>
      <div className='flex items-center gap-2 mb-6'>
        <Filter className='h-5 w-5' />
        <h3 className='font-semibold'>Filter Caterers</h3>
      </div>

      <div className='space-y-6'>
        <div>
          <label className='text-sm font-medium mb-2 block'>Location</label>
          <LocationSelector
            currentLocation={locationFilter || locationInfo.formatted}
            isLoading={locationInfo.loading}
            error={locationInfo.error}
            onSelect={handleLocationSelect}
            onRefresh={() => onLocationChange('')}
          />
        </div>

        <div>
          <label className='text-sm font-medium mb-2 block'>Cuisine Type</label>
          <Select
            value={cuisineFilter || 'all'}
            onValueChange={value => onCuisineChange(value === 'all' ? '' : value)}
          >
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='All cuisines' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All cuisines</SelectItem>
              {CUISINE_TYPES.map(cuisine => (
                <SelectItem key={cuisine} value={cuisine}>
                  {cuisine}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className='text-sm font-medium mb-2 block'>Dietary Options</label>
          <Select
            value={dietFilter || 'all'}
            onValueChange={value => onDietChange(value === 'all' ? '' : value)}
          >
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='All diets' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All diets</SelectItem>
              {DIET_TYPES.map(diet => (
                <SelectItem key={diet} value={diet}>
                  {diet}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className='text-sm font-medium mb-2 block'>Price Range</label>
          <Select
            value={priceFilter || 'all'}
            onValueChange={value => onPriceChange(value === 'all' ? '' : value)}
          >
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Any price' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Any price</SelectItem>
              {PRICE_RANGES.map(price => (
                <SelectItem key={price} value={price}>
                  {price === '$' && '$ (Budget-friendly)'}
                  {price === '$$' && '$$ (Moderate)'}
                  {price === '$$$' && '$$$ (Premium)'}
                  {price === '$$$$' && '$$$$ (Luxury)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className='text-sm font-medium mb-2 block'>Date Needed</label>
          <Input
            type='date'
            className='w-full'
            value={dateNeeded || ''}
            onChange={e => onDateChange((e.target as HTMLInputElement).value)}
          />
        </div>
      </div>
    </div>
  );
};

export default CatererFilterSidebar;
