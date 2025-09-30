import { useState } from 'react';
import ExploreHeader from './ExploreHeader';
import ExploreFiltersSection from './ExploreFiltersSection';
import ExploreContent from './ExploreContent';

export interface ExploreLayoutProps {
  onSearch?: (query: string) => void | undefined;
  onFilterChange?: (filters: unknown) => void | undefined;
  onSortChange?: (sortBy: string) => void | undefined;
  onCategorySelect?: (category: string) => void | undefined;
  onEventView?: (eventId: string) => void | undefined;
  onEventInteraction?: (eventId: string, action: string) => void | undefined;
}

const ExploreLayout = ({
  onSearch,
  onFilterChange,
  onSortChange,
  onCategorySelect,
  onEventView,
  onEventInteraction,
}: ExploreLayoutProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    onCategorySelect?.(category);
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    onSortChange?.(sort);
  };

  return (
    <div className='min-h-screen bg-background'>
      <ExploreHeader searchQuery={searchQuery} onSearch={handleSearch} />

      <div className='container mx-auto px-4 py-6'>
        <ExploreFiltersSection
          selectedCategory={selectedCategory}
          sortBy={sortBy}
          onCategoryChange={handleCategoryChange}
          onSortChange={handleSortChange}
          onFilterChange={onFilterChange}
        />

        <ExploreContent
          searchQuery={searchQuery}
          selectedCategory={selectedCategory}
          sortBy={sortBy}
          onEventView={onEventView}
          onEventInteraction={onEventInteraction}
        />
      </div>
    </div>
  );
};

export default ExploreLayout;
