import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { VenueFilters as FiltersType } from '@/hooks/useVenues';

interface VenueFiltersProps {
  filters: FiltersType;
  onFilterChange: (filters: Partial<FiltersType>) => void;
}

const VenueFilters = ({ filters, onFilterChange }: VenueFiltersProps) => {
  const [location, setLocation] = useState(filters.location || '');
  const [venueType, setVenueType] = useState(filters.type || 'all');
  const [capacity, setCapacity] = useState(filters.capacity || 'all');
  const [priceRange, setPriceRange] = useState(filters.priceRange || 'all');
  const [date, setDate] = useState(filters.date || '');

  const handleApplyFilters = () => {
    // Create a filters object to pass to the parent component
    const newFilters = {
      location: location || undefined,
          ...(venueType !== 'all' && { type: venueType }),
          ...(capacity !== 'all' && { capacity: capacity }),
          ...(priceRange !== 'all' && { priceRange: priceRange }),
      date: date || undefined,
    };

    // Call the onFilterChange function with the filters object
    onFilterChange(newFilters);
  };

  return (
    <div className='bg-card rounded-lg border p-4 space-y-4'>
      <div className='font-medium flex items-center'>
        <Filter className='h-4 w-4 mr-2' />
        Filters
      </div>

      <div>
        <label className='text-sm font-medium mb-1 block'>Location</label>
        <Input
          placeholder='Enter city or ZIP code'
          value={location}
          onChange={e => setLocation((e.target as HTMLInputElement).value)}
        />
      </div>

      <div>
        <label className='text-sm font-medium mb-1 block'>Venue Type</label>
        <Select value={venueType} onValueChange={setVenueType}>
          <SelectTrigger>
            <SelectValue placeholder='All venue types' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All venue types</SelectItem>
            <SelectItem value='banquet'>Banquet Hall</SelectItem>
            <SelectItem value='outdoor'>Outdoor</SelectItem>
            <SelectItem value='rooftop'>Rooftop</SelectItem>
            <SelectItem value='garden'>Garden</SelectItem>
            <SelectItem value='industrial'>Industrial</SelectItem>
            <SelectItem value='rustic'>Rustic</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className='text-sm font-medium mb-1 block'>Capacity</label>
        <Select value={capacity} onValueChange={setCapacity}>
          <SelectTrigger>
            <SelectValue placeholder='Any capacity' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Any capacity</SelectItem>
            <SelectItem value='small'>Up to 100 guests</SelectItem>
            <SelectItem value='medium'>100-300 guests</SelectItem>
            <SelectItem value='large'>300+ guests</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className='text-sm font-medium mb-1 block'>Price Range</label>
        <Select value={priceRange} onValueChange={setPriceRange}>
          <SelectTrigger>
            <SelectValue placeholder='Any price' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Any price</SelectItem>
            <SelectItem value='budget'>$ (Budget-friendly)</SelectItem>
            <SelectItem value='moderate'>$$ (Moderate)</SelectItem>
            <SelectItem value='premium'>$$$ (Premium)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className='text-sm font-medium mb-1 block'>Availability</label>
        <Input
          type='date'
          className='w-full'
          value={date}
          onChange={e => setDate((e.target as HTMLInputElement).value)}
        />
      </div>

      <Button className='w-full' onClick={handleApplyFilters}>
        Apply Filters
      </Button>
    </div>
  );
};

export default VenueFilters;
