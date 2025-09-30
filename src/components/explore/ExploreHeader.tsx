import React from 'react';

export interface ExploreHeaderProps {
  searchQuery: string;
  onSearch: (query: string) => void;
}

const ExploreHeader: React.FC<ExploreHeaderProps> = ({ searchQuery, onSearch }) => {
  return (
    <div className='bg-background border-b'>
      <div className='container mx-auto px-4 py-6'>
        <h1 className='text-3xl font-bold mb-4'>Explore Events</h1>
        <div className='relative'>
          <input
            type='text'
            placeholder='Search events...'
            value={searchQuery}
            onChange={e => onSearch((e.target as HTMLInputElement).value)}
            className='w-full px-4 py-2 border rounded-lg'
          />
        </div>
      </div>
    </div>
  );
};

export default ExploreHeader;
