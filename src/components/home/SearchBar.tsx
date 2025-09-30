import React, { useState, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { debounce } from '@/utils/debounce';

interface SearchBarProps {
  placeholder?: string | undefined;
  className?: string | undefined;
  onSearch?: (query: string) => void | undefined;
  autoFocus?: boolean | undefined;
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search events, categories, or locations...',
  className,
  onSearch,
  autoFocus = false,
}) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  // Debounced search for real-time suggestions
  const debouncedSearch = useCallback(
    debounce((searchQuery: string) => {
      if (onSearch && searchQuery.trim()) {
        onSearch(searchQuery);
      }
    }, 300),
    [onSearch]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = (e.target as HTMLInputElement).value;
    setQuery(value);
    debouncedSearch(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsSearching(true);
      // Navigate to explore page with search query
      navigate(`/explore?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleClear = () => {
    setQuery('');
    if (onSearch) {
      onSearch('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClear();
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn('relative w-full', className)}>
      <div className='relative'>
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none' />
        <Input
          type='search'
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            'w-full pl-10 pr-24',
            'h-12 text-base',
            'focus:ring-2 focus:ring-primary/20',
            'transition-all duration-200'
          )}
          autoFocus={autoFocus}
          disabled={isSearching}
        />
        {query && (
          <button
            type='button'
            onClick={handleClear}
            className='absolute right-20 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors'
            aria-label='Clear search'
          >
            <X className='h-4 w-4 text-muted-foreground' />
          </button>
        )}
        <Button
          type='submit'
          size='sm'
          className='absolute right-2 top-1/2 -translate-y-1/2'
          disabled={!query.trim() || isSearching}
        >
          {isSearching ? 'Searching...' : 'Search'}
        </Button>
      </div>
    </form>
  );
};

export default SearchBar;
