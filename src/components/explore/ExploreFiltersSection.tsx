import React from 'react';

export interface ExploreFiltersSectionProps {
  selectedCategory: string;
  sortBy: string;
  onCategoryChange: (category: string) => void;
  onSortChange: (sort: string) => void;
  onFilterChange?: (filters: unknown) => void | undefined;
}

const ExploreFiltersSection: React.FC<ExploreFiltersSectionProps> = ({
  selectedCategory,
  sortBy,
  onCategoryChange,
  onSortChange,
}) => {
  return (
    <div className='flex flex-wrap gap-4 mb-6'>
      <select
        value={selectedCategory}
        onChange={e => onCategoryChange((e.target as HTMLInputElement).value)}
        className='px-4 py-2 border rounded-lg'
      >
        <option value='all'>All Categories</option>
        <option value='music'>Music</option>
        <option value='art'>Art</option>
        <option value='food'>Food</option>
        <option value='sports'>Sports</option>
      </select>

      <select
        value={sortBy}
        onChange={e => onSortChange((e.target as HTMLInputElement).value)}
        className='px-4 py-2 border rounded-lg'
      >
        <option value='relevance'>Relevance</option>
        <option value='date'>Date</option>
        <option value='popularity'>Popularity</option>
      </select>
    </div>
  );
};

export default ExploreFiltersSection;
