import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Globe, Lock, Grid, List } from 'lucide-react';

const COMMUNITY_CATEGORIES = [
  'All',
  'Technology',
  'Business',
  'Arts & Design',
  'Health & Fitness',
  'Education',
  'Entertainment',
  'Sports',
  'Travel',
  'Food & Drink',
  'Lifestyle',
  'Gaming',
  'Music',
  'Photography',
  'Writing',
  'Science',
];

interface CommunityFiltersProps {
  searchQuery: string;
  selectedCategory: string;
  sortBy: 'created_at' | 'member_count' | 'name';
  showPrivate: boolean | undefined;
  viewMode: 'grid' | 'list';
  onSearchChange: (value: string) => void;
  onCategoryChange: (category: string) => void;
  onSortChange: (sort: 'created_at' | 'member_count' | 'name') => void;
  onPrivacyChange: (privacy: boolean | undefined) => void;
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

const CommunityFilters = memo<CommunityFiltersProps>(({
  searchQuery,
  selectedCategory,
  sortBy,
  showPrivate,
  viewMode,
  onSearchChange,
  onCategoryChange,
  onSortChange,
  onPrivacyChange,
  onViewModeChange,
}) => {
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange((e.target as HTMLInputElement).value);
  };

  const handleSortChange = (value: string) => {
    onSortChange(value as 'created_at' | 'member_count' | 'name');
  };

  return (
    <Card className='mb-8 border border-gray-200 bg-white'>
      <CardHeader>
        <CardTitle className='text-lg text-[#2B2B2B] flex items-center gap-2'>
          <Search className='h-5 w-5' />
          Find Your Perfect Community
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          <div className='grid lg:grid-cols-4 gap-4'>
            <div className='lg:col-span-2'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                <Input
                  placeholder='Search by name, topic, or keyword...'
                  value={searchQuery}
                  onChange={handleSearchInput}
                  className='pl-10 border-gray-300'
                />
              </div>
            </div>

            <Select value={selectedCategory} onValueChange={onCategoryChange}>
              <SelectTrigger className='border-gray-300'>
                <SelectValue placeholder='All Categories' />
              </SelectTrigger>
              <SelectContent>
                {COMMUNITY_CATEGORIES.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className='border-gray-300'>
                <SelectValue placeholder='Sort by' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='created_at'>Newest First</SelectItem>
                <SelectItem value='member_count'>Most Popular</SelectItem>
                <SelectItem value='name'>Alphabetical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='flex justify-between items-center'>
            <div className='flex gap-2'>
              <Button
                variant={showPrivate === false ? 'default' : 'outline'}
                size='sm'
                onClick={() => onPrivacyChange(false)}
                className={`text-xs ${
                  showPrivate === false
                    ? 'bg-[#2B2B2B] text-white hover:bg-gray-800'
                    : 'border-gray-300 text-[#2B2B2B] hover:bg-gray-50'
                }`}
              >
                <Globe className='w-3 h-3 mr-1' />
                Public
              </Button>
              <Button
                variant={showPrivate === true ? 'default' : 'outline'}
                size='sm'
                onClick={() => onPrivacyChange(true)}
                className={`text-xs ${
                  showPrivate === true
                    ? 'bg-[#2B2B2B] text-white hover:bg-gray-800'
                    : 'border-gray-300 text-[#2B2B2B] hover:bg-gray-50'
                }`}
              >
                <Lock className='w-3 h-3 mr-1' />
                Private
              </Button>
              <Button
                variant={showPrivate === undefined ? 'default' : 'outline'}
                size='sm'
                onClick={() => onPrivacyChange(undefined)}
                className={`text-xs ${
                  showPrivate === undefined
                    ? 'bg-[#2B2B2B] text-white hover:bg-gray-800'
                    : 'border-gray-300 text-[#2B2B2B] hover:bg-gray-50'
                }`}
              >
                All Types
              </Button>
            </div>

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
                <Grid className='w-4 h-4' />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size='sm'
                onClick={() => onViewModeChange('list')}
                className={`rounded-l-none ${
                  viewMode === 'list'
                    ? 'bg-[#2B2B2B] text-white hover:bg-gray-800'
                    : 'text-[#2B2B2B] hover:bg-gray-50'
                }`}
              >
                <List className='w-4 h-4' />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

CommunityFilters.displayName = 'CommunityFilters';

export default CommunityFilters;