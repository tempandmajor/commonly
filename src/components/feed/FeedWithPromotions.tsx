import React from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { FeedWithPromotionsProps } from './types';

const FeedWithPromotions: React.FC<FeedWithPromotionsProps> = ({
  items,
  isLoading = false,
  onLoadMore,
  hasMore = false,
}) => {
  const { user } = useAuth();

  if (isLoading) {
    return (
      <div className='space-y-4'>
        {[1, 2, 3].map(i => (
          <div key={i} className='animate-pulse bg-gray-200 h-32 rounded-lg' />
        ))}
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {items.map(item => (
        <div key={item.id} className='bg-white rounded-lg shadow p-4'>
          <div className='flex items-center gap-3 mb-3'>
            <div className='w-8 h-8 bg-gray-300 rounded-full' />
            <div>
              <p className='font-medium'>{user?.display_name || user?.name || 'User'}</p>
              <p className='text-sm text-gray-500'>Content type: {item.type}</p>
            </div>
          </div>

          <div className='text-gray-700'>{JSON.stringify(item.content, null, 2)}</div>

          {item.promotion && (
            <div className='mt-3 p-2 bg-blue-50 rounded border border-blue-200'>
              <p className='text-sm text-blue-700'>Promoted Content</p>
            </div>
          )}
        </div>
      ))}

      {hasMore && onLoadMore && (
        <button
          onClick={onLoadMore}
          className='w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600'
        >
          Load More
        </button>
      )}
    </div>
  );
};

export default FeedWithPromotions;
