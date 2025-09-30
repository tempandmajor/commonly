import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import EnhancedVenueCard from './EnhancedVenueCard';
import { Venue } from '@/hooks/useVenueSearch';

interface VenueGridViewProps {
  venues: Venue[];
  isLoading: boolean;
  viewMode: 'grid' | 'list' | 'map';
  hasMore: boolean;
  onLoadMore: () => void;
  emptyStateTitle?: string | undefined;
  emptyStateDescription?: string | undefined;
}

const VenueGridView = memo<VenueGridViewProps>(({
  venues,
  isLoading,
  viewMode,
  hasMore,
  onLoadMore,
  emptyStateTitle = 'No venues found',
  emptyStateDescription = 'Try adjusting your search or filters to see more results.',
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (viewMode === 'map') {
    return (
      <Card className='border border-gray-200 bg-white'>
        <CardContent className='p-8 text-center'>
          <div className='w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center'>
            <Building2 className='h-8 w-8 text-gray-400' />
          </div>
          <h3 className='text-lg font-semibold text-[#2B2B2B] mb-2'>Interactive Map Coming Soon</h3>
          <p className='text-gray-600 mb-4'>
            We're working on an interactive map view to help you find venues by location.
          </p>
          <p className='text-sm text-gray-500'>
            Use the grid or list view to browse venue locations and details.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading && venues.length === 0) {
    return (
      <div className={`grid gap-6 ${
        viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
      }`}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className='overflow-hidden border border-gray-200'>
            <Skeleton className='h-48 w-full' />
            <CardContent className='p-4 space-y-3'>
              <Skeleton className='h-4 w-3/4' />
              <Skeleton className='h-3 w-full' />
              <Skeleton className='h-3 w-2/3' />
              <div className='flex gap-2'>
                <Skeleton className='h-5 w-16' />
                <Skeleton className='h-5 w-20' />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (venues.length === 0 && !isLoading) {
    return (
      <div className='text-center py-12'>
        <div className='w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center'>
          <Building2 className='h-8 w-8 text-gray-400' />
        </div>
        <h3 className='text-lg font-medium text-[#2B2B2B] mb-2'>{emptyStateTitle}</h3>
        <p className='text-gray-600 mb-6 max-w-md mx-auto'>
          {emptyStateDescription}
        </p>
        {user && (
          <Button
            onClick={() => navigate('/venue/list-your-venue')}
            className='bg-[#2B2B2B] hover:bg-gray-800 text-white'
          >
            <Plus className='w-4 h-4 mr-2' />
            List Your Venue
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className={`grid gap-6 ${
        viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
      }`}>
        {venues.map(venue => (
          <EnhancedVenueCard
            key={venue.id}
            venue={venue}
            viewMode={viewMode}
          />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className='flex justify-center pt-8'>
          <Button
            onClick={onLoadMore}
            disabled={isLoading}
            variant='outline'
            className='border-gray-300 text-[#2B2B2B] hover:bg-gray-50'
            size='lg'
          >
            {isLoading ? 'Loading...' : 'Load More Venues'}
          </Button>
        </div>
      )}

      {/* Loading indicator for pagination */}
      {isLoading && venues.length > 0 && (
        <div className='flex justify-center pt-4'>
          <div className='flex items-center gap-2 text-gray-600'>
            <div className='w-4 h-4 border-2 border-gray-300 border-t-[#2B2B2B] rounded-full animate-spin' />
            <span className='text-sm'>Loading more venues...</span>
          </div>
        </div>
      )}
    </div>
  );
});

VenueGridView.displayName = 'VenueGridView';

export default VenueGridView;