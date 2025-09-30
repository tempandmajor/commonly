import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import VenueGrid from './VenueGrid';
import VenuePagination from './VenuePagination';
import { DisplayVenue } from '@/lib/types/venue';

interface VenueResultsProps {
  venues: DisplayVenue[];
  loading: boolean;
  totalVenues: number;
  page: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onResetFilters: () => void;
}

const VenueResults = ({
  venues,
  loading,
  totalVenues,
  page,
  pageSize,
  totalPages,
  onPageChange,
  onResetFilters,
}: VenueResultsProps) => {
  const currentPageStart = venues.length > 0 ? (page - 1) * pageSize + 1 : 0;
  const currentPageEnd = Math.min(page * pageSize, totalVenues);

  if (loading && page === 1) {
    return (
      <div className='flex justify-center items-center h-64'>
        <div className='flex flex-col items-center'>
          <Loader2 className='h-10 w-10 animate-spin text-primary mb-4' />
          <p className='text-muted-foreground'>Loading venues...</p>
        </div>
      </div>
    );
  }

  if (venues.length === 0) {
    return (
      <Card className='p-10 text-center'>
        <h2 className='text-xl font-semibold mb-2'>No venues found</h2>
        <p className='text-muted-foreground mb-6'>Try adjusting your filters or search criteria.</p>
        <Button variant='outline' onClick={onResetFilters}>
          Reset All Filters
        </Button>
      </Card>
    );
  }

  return (
    <div>
      <VenuePagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
        pageSize={pageSize}
        totalItems={totalVenues}
        currentPageStart={currentPageStart}
        currentPageEnd={currentPageEnd}
      />

      <VenueGrid venues={venues} loading={loading && page > 1} />

      {totalPages > 1 && (
        <VenuePagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
          pageSize={pageSize}
          totalItems={totalVenues}
          currentPageStart={currentPageStart}
          currentPageEnd={currentPageEnd}
        />
      )}
    </div>
  );
};

export default VenueResults;
