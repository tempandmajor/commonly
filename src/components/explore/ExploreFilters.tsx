import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Filter, DollarSign, MapPin, Users, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

export interface ExploreFilters {
  categories: string[];
  priceRange: { min?: number | undefined; max?: number } | undefined | undefined | undefined;
  dateRange: { start?: Date; end?: Date };
  location: string;
  capacity: { min?: number; max?: number };
  tags: string[];
  eventType: string[];
  sortBy: 'date' | 'price' | 'popularity' | 'distance';
}

interface ExploreFiltersProps {
  filters: ExploreFilters;
  onFiltersChange: (filters: ExploreFilters) => void;
  onFiltersApply: () => void;
}

export const ExploreFilters: React.FC<ExploreFiltersProps> = ({
  filters,
  onFiltersChange,
  onFiltersApply,
}) => {
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Load available filter options from database
  useEffect(() => {
    loadFilterOptions();
  }, []);

  const loadFilterOptions = async () => {
    setLoading(true);
    try {
      // Get unique categories from events
      const { data: categories } = await supabase.from('categories').select('name').order('name');

      // Get popular tags from events
      const { data: events } = await supabase
        .from('events')
        .select('tags')
        .not('tags', 'is', null)
        .limit(100);

      // Extract unique tags
      const allTags = new Set<string>();
      (events as any)?.forEach((event: any) => {
        if (Array.isArray(event.tags)) {
          event.tags.forEach((tag: string) => allTags.add(tag));
        }
      });

      setAvailableCategories((categories as any)?.map((c: any) => c.name) || []);
      setAvailableTags(Array.from(allTags).sort());
    } catch (error) {
      console.error('Error loading filter options:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category: string, checked: boolean) => {
    const newCategories = checked
      ? [...filters.categories, category]
      : filters.categories.filter(c => c !== category);

    onFiltersChange({
          ...filters,
      categories: newCategories,
    });
  };

  const handlePriceRangeChange = (field: 'min' | 'max', value: string) => {
    const numValue = value ? parseFloat(value) : undefined;
    onFiltersChange({
          ...filters,
      priceRange: {
          ...filters.priceRange,
        [field]: numValue,
      },
    });
  };

  const handleDateChange = (field: 'start' | 'end', value: string) => {
    const dateValue = value ? new Date(value) : undefined;
    onFiltersChange({
          ...filters,
      dateRange: {
          ...filters.dateRange,
        [field]: dateValue,
      },
    });
  };

  const handleCapacityChange = (field: 'min' | 'max', value: string) => {
    const numValue = value ? parseInt(value) : undefined;
    onFiltersChange({
          ...filters,
      capacity: {
          ...filters.capacity,
        [field]: numValue,
      },
    });
  };

  const handleTagToggle = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];

    onFiltersChange({
          ...filters,
      tags: newTags,
    });
  };

  const handleEventTypeChange = (type: string, checked: boolean) => {
    const newTypes = checked
      ? [...filters.eventType, type]
      : filters.eventType.filter(t => t !== type);

    onFiltersChange({
          ...filters,
      eventType: newTypes,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      categories: [],
      priceRange: {},
      dateRange: {},
      location: '',
      capacity: {},
      tags: [],
      eventType: [],
      sortBy: 'date',
    });
  };

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.priceRange.min !== undefined ||
    filters.priceRange.max !== undefined ||
    filters.dateRange.start !== undefined ||
    filters.dateRange.end !== undefined ||
    filters.location !== '' ||
    filters.capacity.min !== undefined ||
    filters.capacity.max !== undefined ||
    filters.tags.length > 0 ||
    filters.eventType.length > 0;

  return (
    <div className='w-full space-y-6'>
      <div className='font-medium flex items-center justify-between'>
        <div className='flex items-center'>
          <Filter className='h-4 w-4 mr-2' />
          Filters
        </div>
        {hasActiveFilters && (
          <Button variant='ghost' size='sm' onClick={clearFilters}>
            Clear All
          </Button>
        )}
      </div>

      {/* Sort By */}
      <div className='space-y-2'>
        <label className='text-sm font-medium'>Sort By</label>
        <Select
          value={filters.sortBy}
          onValueChange={value => onFiltersChange({ ...filters, sortBy: value as any })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='date'>Date</SelectItem>
            <SelectItem value='price'>Price</SelectItem>
            <SelectItem value='popularity'>Popularity</SelectItem>
            <SelectItem value='distance'>Distance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Categories */}
      <div className='space-y-2'>
        <label className='text-sm font-medium flex items-center'>
          <Tag className='h-4 w-4 mr-1' />
          Categories
        </label>
        <div className='space-y-2 max-h-32 overflow-y-auto'>
          {availableCategories.map(category => (
            <div key={category} className='flex items-center space-x-2'>
              <Checkbox
                id={`category-${category}`}
                checked={filters.categories.includes(category)}
                onCheckedChange={checked => handleCategoryChange(category, checked as boolean)}
              />
              <label htmlFor={`category-${category}`} className='text-sm'>
                {category}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Event Types */}
      <div className='space-y-2'>
        <label className='text-sm font-medium'>Event Type</label>
        <div className='space-y-2'>
          {['in_person', 'virtual', 'hybrid'].map(type => (
            <div key={type} className='flex items-center space-x-2'>
              <Checkbox
                id={`type-${type}`}
                checked={filters.eventType.includes(type)}
                onCheckedChange={checked => handleEventTypeChange(type, checked as boolean)}
              />
              <label htmlFor={`type-${type}`} className='text-sm capitalize'>
                {type.replace('_', ' ')}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Date Range */}
      <div className='space-y-2'>
        <label className='text-sm font-medium flex items-center'>
          <Calendar className='h-4 w-4 mr-1' />
          Date Range
        </label>
        <div className='grid grid-cols-2 gap-2'>
          <Input
            type='date'
            placeholder='Start date'
            value={filters.dateRange.start?.toISOString().split('T')[0] || ''}
            onChange={e => handleDateChange('start', (e.target as HTMLInputElement).value)}
          />
          <Input
            type='date'
            placeholder='End date'
            value={filters.dateRange.end?.toISOString().split('T')[0] || ''}
            onChange={e => handleDateChange('end', (e.target as HTMLInputElement).value)}
          />
        </div>
      </div>

      {/* Price Range */}
      <div className='space-y-2'>
        <label className='text-sm font-medium flex items-center'>
          <DollarSign className='h-4 w-4 mr-1' />
          Price Range
        </label>
        <div className='grid grid-cols-2 gap-2'>
          <Input
            type='number'
            placeholder='Min price'
            value={filters.priceRange.min || ''}
            onChange={e => handlePriceRangeChange('min', (e.target as HTMLInputElement).value)}
          />
          <Input
            type='number'
            placeholder='Max price'
            value={filters.priceRange.max || ''}
            onChange={e => handlePriceRangeChange('max', (e.target as HTMLInputElement).value)}
          />
        </div>
      </div>

      {/* Capacity */}
      <div className='space-y-2'>
        <label className='text-sm font-medium flex items-center'>
          <Users className='h-4 w-4 mr-1' />
          Capacity
        </label>
        <div className='grid grid-cols-2 gap-2'>
          <Input
            type='number'
            placeholder='Min capacity'
            value={filters.capacity.min || ''}
            onChange={e => handleCapacityChange('min', (e.target as HTMLInputElement).value)}
          />
          <Input
            type='number'
            placeholder='Max capacity'
            value={filters.capacity.max || ''}
            onChange={e => handleCapacityChange('max', (e.target as HTMLInputElement).value)}
          />
        </div>
      </div>

      {/* Location */}
      <div className='space-y-2'>
        <label className='text-sm font-medium flex items-center'>
          <MapPin className='h-4 w-4 mr-1' />
          Location
        </label>
        <Input
          placeholder='Enter location...'
          value={filters.location}
          onChange={e => onFiltersChange({ ...filters, location: (e.target as HTMLInputElement).value })}
        />
      </div>

      {/* Tags */}
      <div className='space-y-2'>
        <label className='text-sm font-medium'>Popular Tags</label>
        <div className='flex flex-wrap gap-1 max-h-32 overflow-y-auto'>
          {availableTags.slice(0, 20).map(tag => (
            <Badge
              key={tag}
              variant={filters.tags.includes(tag) ? 'default' : 'outline'}
              className='cursor-pointer text-xs'
              onClick={() => handleTagToggle(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* Apply Filters Button */}
      <Button onClick={onFiltersApply} className='w-full' disabled={loading}>
        Apply Filters
      </Button>
    </div>
  );
};
