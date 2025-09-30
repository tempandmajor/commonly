'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

import { useToast } from '@/hooks/use-toast';
import {
  FormField,
  FormSection,
  SearchSelect,
  SearchSelectOption,
} from '@/components/forms/shared';
import {
  advancedSearchSchema,
  advancedSearchDefaults,
  AdvancedSearchValues,
  SearchSuggestion,
  SearchHistory,
  SearchResult,
} from '@/lib/validations/searchValidation';
import {
  Search,
  Filter,
  MapPin,
  Calendar,
  DollarSign,
  ChevronDown,
  ChevronUp,
  History,
  X,
  SlidersHorizontal,
  Globe,
  Star,
  Clock,
  TrendingUp,
  Users,
  Package,
  Mic,
  Building,
  UtensilsCrossed,
  Save,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdvancedSearchFormProps {
  onSearch: (data: AdvancedSearchValues) => Promise<SearchResult[]>;
  onSaveSearch?: (data: AdvancedSearchValues) => Promise<void> | undefined;
  initialValues?: Partial<AdvancedSearchValues> | undefined;
  showSaveSearch?: boolean | undefined;
  showAdvancedFilters?: boolean | undefined;
  allowedCategories?: string[] | undefined;
  placeholder?: string | undefined;
  className?: string | undefined;
}

export const AdvancedSearchForm: React.FC<AdvancedSearchFormProps> = ({
  onSearch,
  onSaveSearch,
  initialValues = {},
  showSaveSearch = true,
  showAdvancedFilters = true,
  allowedCategories,
  placeholder = 'Search for events, products, communities, and more...',
  className,
}) => {
  const { toast } = useToast();
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [searchCount, setSearchCount] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<AdvancedSearchValues>({
    resolver: zodResolver(advancedSearchSchema),
    defaultValues: {
          ...advancedSearchDefaults,
          ...initialValues,
    },
  });

  const { setValue, watch } = form;
  const queryValue = watch('query');
  const categoryValue = watch('category');
  const saveSearchValue = watch('saveSearch');

  // Load search history from localStorage
  useEffect(() => {
    const history = localStorage.getItem('search-history');
    if (history) {
      try {
        setSearchHistory(JSON.parse(history) as any);
      } catch (_error) {
        // Error handling silently ignored
      }
    }
  }, []);

  // Generate suggestions based on query
  useEffect(() => {
    if (queryValue && queryValue.length > 2) {
      const timer = setTimeout(() => {
        generateSuggestions(queryValue);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
    }
  }, [queryValue]);

  // Focus search input with Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        setShowFilters(!showFilters);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showFilters]);

  // Category options
  const categoryOptions: SearchSelectOption[] = useMemo(() => {
    const allCategories = [
      {
        value: 'all',
        label: 'All Categories',
        icon: <Globe className='w-4 h-4' />,
        description: 'Search across all content types',
      },
      {
        value: 'events',
        label: 'Events',
        icon: <Calendar className='w-4 h-4' />,
        description: 'Find local and virtual events',
      },
      {
        value: 'products',
        label: 'Products',
        icon: <Package className='w-4 h-4' />,
        description: 'Discover products and services',
      },
      {
        value: 'communities',
        label: 'Communities',
        icon: <Users className='w-4 h-4' />,
        description: 'Join communities and groups',
      },
      {
        value: 'users',
        label: 'People',
        icon: <Users className='w-4 h-4' />,
        description: 'Connect with other users',
      },
      {
        value: 'podcasts',
        label: 'Podcasts',
        icon: <Mic className='w-4 h-4' />,
        description: 'Listen to podcasts and shows',
      },
      {
        value: 'venues',
        label: 'Venues',
        icon: <Building className='w-4 h-4' />,
        description: 'Find event venues and spaces',
      },
      {
        value: 'caterers',
        label: 'Caterers',
        icon: <UtensilsCrossed className='w-4 h-4' />,
        description: 'Hire catering services',
      },
    ];

    if (allowedCategories) {
      return allCategories.filter(cat => allowedCategories.includes(cat.value));
    }

    return allCategories;
  }, [allowedCategories]);

  const sortOptions: SearchSelectOption[] = [
    {
      value: 'relevance',
      label: 'Relevance',
      icon: <Star className='w-4 h-4' />,
      description: 'Most relevant results first',
    },
    {
      value: 'date',
      label: 'Date',
      icon: <Calendar className='w-4 h-4' />,
      description: 'Newest first',
    },
    { value: 'price-low', label: 'Price: Low to High', icon: <DollarSign className='w-4 h-4' /> },
    { value: 'price-high', label: 'Price: High to Low', icon: <DollarSign className='w-4 h-4' /> },
    {
      value: 'distance',
      label: 'Distance',
      icon: <MapPin className='w-4 h-4' />,
      description: 'Closest to you first',
    },
    { value: 'popularity', label: 'Popularity', icon: <TrendingUp className='w-4 h-4' /> },
    { value: 'rating', label: 'Rating', icon: <Star className='w-4 h-4' /> },
    { value: 'newest', label: 'Newest', icon: <Clock className='w-4 h-4' /> },
  ];

  const generateSuggestions = async (query: string) => {
    // Mock suggestion generation - in real app, this would call an API
    const mockSuggestions: SearchSuggestion[] = [
      { type: 'query', text: `${query} events`, icon: <Calendar className='w-4 h-4' />, count: 15 },
      { type: 'query', text: `${query} products`, icon: <Package className='w-4 h-4' />, count: 8 },
      {
        type: 'location',
        text: `${query} near me`,
        icon: <MapPin className='w-4 h-4' />,
        count: 23,
      },
      {
        type: 'category',
        text: `Popular in ${categoryValue}`,
        icon: <TrendingUp className='w-4 h-4' />,
        count: 12,
      },
    ];

    setSuggestions(mockSuggestions.slice(0, 5));
    setShowSuggestions(true);
  };

  const handleSearch = async (data: AdvancedSearchValues) => {
    if (!data.query.trim()) {
      toast({
        title: 'Search query required',
        description: 'Please enter something to search for',
        variant: 'destructive',
      });
      return;
    }

    setIsSearching(true);
    setShowSuggestions(false);

    try {
      const searchResults = await onSearch(data);
      setSearchCount(searchResults.length);

      // Add to search history
      const historyItem: SearchHistory = {
        id: Date.now().toString(),
        query: data.query,
        category: data.category,
        timestamp: new Date(),
        resultsCount: searchResults.length,
      };

      const updatedHistory = [historyItem, ...searchHistory.slice(0, 9)];
      setSearchHistory(updatedHistory);
      localStorage.setItem('search-history', JSON.stringify(updatedHistory));

      toast({
        title: 'Search completed',
        description: `Found ${searchResults.length} result${searchResults.length === 1 ? '' : 's'}`,
      });
    } catch (error) {
      toast({
        title: 'Search failed',
        description: 'Please try again with different terms',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSaveSearch = async () => {
    if (!saveSearchValue) return;

    const searchData = form.getValues();

    try {
      if (onSaveSearch) {
        await onSaveSearch(searchData);
        toast({
          title: 'Search saved',
          description: 'You can access this search from your saved searches',
        });
      }
    } catch (error) {
      toast({
        title: 'Failed to save search',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const applySuggestion = (suggestion: SearchSuggestion) => {
    setValue('query', suggestion.text);
    setShowSuggestions(false);
    if (suggestion.type === 'category') {
      setValue('category', suggestion.text.includes('events') ? 'events' : 'all');
    }
  };

  const applyHistorySearch = (historyItem: SearchHistory) => {
    setValue('query', historyItem.query);
    setValue(
      'category',
      historyItem.category as
        | 'users'
        | 'communities'
        | 'events'
        | 'products'
        | 'podcasts'
        | 'venues'
        | 'caterers'
        | 'all'
    );
    setShowSuggestions(false);
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('search-history');
    toast({ title: 'Search history cleared' });
  };

  const resetFilters = () => {
    form.reset(advancedSearchDefaults);
    toast({ title: 'Filters reset' });
  };

  const hasActiveFilters = useMemo(() => {
    const values = form.getValues();
    return (
      values.location ||
      values.dateRange ||
      values.priceRange ||

      (values.filters && Object.keys(values.filters).length > 0)
    );
  }, [form.watch()]);

  return (
    <div className={cn('w-full max-w-4xl mx-auto space-y-6', className)}>
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='flex items-center gap-2'>
            <Search className='w-5 h-5' />
            Advanced Search
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={form.handleSubmit(handleSearch)} className='space-y-6'>
            {/* Main search input */}
            <div className='space-y-4'>
              <div className='relative'>
                <div className='relative flex items-center'>
                  <Search className='absolute left-3 w-4 h-4 text-muted-foreground z-10' />
                  <Input
          {...form.register('query')}
                    placeholder={placeholder}
                    className='pl-10 pr-32 h-12 text-base'
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  />
                  <div className='absolute right-2 flex items-center gap-2'>
                    <Badge variant='secondary' className='text-xs'>
                      Ctrl+K
                    </Badge>
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      onClick={() => setShowFilters(!showFilters)}
                      className={cn('h-8 px-2', hasActiveFilters && 'text-primary')}
                    >
                      <SlidersHorizontal className='w-4 h-4' />
                      {hasActiveFilters && <div className='w-2 h-2 bg-primary rounded-full ml-1' />}
                    </Button>
                  </div>
                </div>

                {/* Search suggestions */}
                {showSuggestions && (suggestions.length > 0 || searchHistory.length > 0) && (
                  <Card className='absolute top-full left-0 right-0 z-50 mt-1 shadow-lg'>
                    <CardContent className='p-0'>
                      {suggestions.length > 0 && (
                        <div className='p-3'>
                          <h4 className='text-sm font-medium mb-2'>Suggestions</h4>
                          <div className='space-y-1'>
                            {suggestions.map((suggestion, index) => (
                              <button
                                key={index}
                                type='button'
                                className='w-full flex items-center gap-3 p-2 text-left hover:bg-muted rounded text-sm'
                                onClick={() => applySuggestion(suggestion)}
                              >
                                {suggestion.icon}
                                <span className='flex-1'>{suggestion.text}</span>
                                {suggestion.count && (
                                  <Badge variant='secondary' className='text-xs'>
                                    {suggestion.count}
                                  </Badge>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {searchHistory.length > 0 && (
                        <>
                          {suggestions.length > 0 && <Separator />}
                          <div className='p-3'>
                            <div className='flex items-center justify-between mb-2'>
                              <h4 className='text-sm font-medium'>Recent Searches</h4>
                              <Button
                                type='button'
                                variant='ghost'
                                size='sm'
                                onClick={clearHistory}
                                className='h-auto p-1 text-xs'
                              >
                                Clear
                              </Button>
                            </div>
                            <div className='space-y-1'>
                              {searchHistory.slice(0, 5).map(item => (
                                <button
                                  key={item.id}
                                  type='button'
                                  className='w-full flex items-center gap-3 p-2 text-left hover:bg-muted rounded text-sm'
                                  onClick={() => applyHistorySearch(item)}
                                >
                                  <History className='w-4 h-4 text-muted-foreground' />
                                  <span className='flex-1'>{item.query}</span>
                                  <span className='text-xs text-muted-foreground'>
                                    {item.resultsCount} results
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Quick category and search button */}
              <div className='flex gap-3'>
                <div className='flex-1'>
                  <SearchSelect
                    options={categoryOptions}
                    value={watch('category') || 'all'}
                    onChange={value =>
                      setValue(
                        'category',
                        value as
                          | 'users'
                          | 'communities'
                          | 'events'
                          | 'products'
                          | 'podcasts'
                          | 'venues'
                          | 'caterers'
                          | 'all'
                      )
                    }
                    placeholder='Select category'
                  />
                </div>
                <Button type='submit' disabled={isSearching} className='px-8'>
                  {isSearching ? (
                    <>
                      <Search className='w-4 h-4 mr-2 animate-spin' />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className='w-4 h-4 mr-2' />
                      Search
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Advanced filters */}
            {showAdvancedFilters && (
              <Collapsible open={showFilters} onOpenChange={setShowFilters}>
                <CollapsibleTrigger asChild>
                  <Button variant='outline' className='w-full justify-between'>
                    <span className='flex items-center gap-2'>
                      <Filter className='w-4 h-4' />
                      Advanced Filters
                      {hasActiveFilters && (
                        <Badge variant='secondary' className='text-xs'>
                          Active
                        </Badge>
                      )}
                    </span>
                    {showFilters ? (
                      <ChevronUp className='w-4 h-4' />
                    ) : (
                      <ChevronDown className='w-4 h-4' />
                    )}
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent className='mt-4 space-y-6'>
                  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                    {/* Location Filter */}
                    <FormSection title='Location' icon={<MapPin className='w-4 h-4' />}>
                      <div className='space-y-3'>
                        <FormField
                          form={form}
                          name='location.city'
                          label='City'
                          placeholder='Enter city name'
                        />
                        <FormField
                          form={form}
                          name='location.radius'
                          label='Radius (miles)'
                          type='number'
                          placeholder='25'
                        />
                      </div>
                    </FormSection>

                    {/* Date Range Filter */}
                    <FormSection title='Date Range' icon={<Calendar className='w-4 h-4' />}>
                      <div className='space-y-3'>
                        <div>
                          <label className='text-sm font-medium mb-1 block'>Start Date</label>
                          <Input
                            type='date'
          {...form.register('dateRange.start')}
                            placeholder='Select start date'
                          />
                        </div>
                        <div>
                          <label className='text-sm font-medium mb-1 block'>End Date</label>
                          <Input
                            type='date'
          {...form.register('dateRange.end')}
                            placeholder='Select end date'
                          />
                        </div>
                      </div>
                    </FormSection>

                    {/* Price Range Filter */}
                    <FormSection title='Price Range' icon={<DollarSign className='w-4 h-4' />}>
                      <div className='space-y-3'>
                        <FormField
                          form={form}
                          name='priceRange.min'
                          label='Minimum Price'
                          type='number'
                          placeholder='0'
                        />
                        <FormField
                          form={form}
                          name='priceRange.max'
                          label='Maximum Price'
                          type='number'
                          placeholder='1000'
                        />
                      </div>
                    </FormSection>
                  </div>

                  {/* Sort and Results */}
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div>
                      <label className='text-sm font-medium mb-2 block'>Sort Results</label>
                      <SearchSelect
                        options={sortOptions}
                        value={watch('sortBy') || 'relevance'}
                        onChange={value =>
                          setValue(
                            'sortBy',
                            value as
                              | 'rating'
                              | 'date'
                              | 'newest'
                              | 'price-low'
                              | 'price-high'
                              | 'relevance'
                              | 'popularity'
                              | 'distance'
                          )
                        }
                        placeholder='Select sort order'
                      />
                    </div>

                    <div>
                      <label className='text-sm font-medium mb-2 block'>Results per page</label>
                      <SearchSelect
                        options={[
                          { value: '10', label: '10 results' },
                          { value: '20', label: '20 results' },
                          { value: '50', label: '50 results' },
                          { value: '100', label: '100 results' },
                        ]}
                        value={watch('limit')?.toString() || '20'}
                        onChange={value => {
                          if (typeof value === 'string') {
                            const numValue = parseInt(value, 10);
                            setValue('limit', numValue);
                          }
                        }}
                        placeholder='Select limit'
                      />
                    </div>
                  </div>

                  {/* Save Search */}
                  {showSaveSearch && (
                    <div className='border-t pt-4'>
                      <div className='flex items-center gap-3'>
                        <input type='checkbox' id='saveSearch' {...form.register('saveSearch')} />
                        <label htmlFor='saveSearch' className='text-sm font-medium'>
                          Save this search
                        </label>
                        {saveSearchValue && (
                          <FormField
                            form={form}
                            name='searchName'
                            label='Search Name'
                            placeholder='Search name'
                            className='flex-1'
                          />
                        )}
                      </div>
                    </div>
                  )}

                  <div className='flex gap-3'>
                    <Button type='button' variant='outline' onClick={resetFilters}>
                      <X className='w-4 h-4 mr-2' />
                      Reset Filters
                    </Button>
                    {saveSearchValue && (
                      <Button type='button' onClick={handleSaveSearch}>
                        <Save className='w-4 h-4 mr-2' />
                        Save Search
                      </Button>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </form>

          {/* Search Results Summary */}
          {searchCount > 0 && (
            <div className='mt-6 pt-6 border-t'>
              <div className='flex items-center justify-between'>
                <p className='text-sm text-muted-foreground'>
                  Found {searchCount.toLocaleString()} result{searchCount === 1 ? '' : 's'}
                  {queryValue && ` for "${queryValue}"`}
                </p>
                <Button variant='ghost' size='sm'>
                  <Settings className='w-4 h-4 mr-2' />
                  Refine Results
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

};

export default AdvancedSearchForm;
