import { Loader2 } from 'lucide-react';
import VenueCard from './VenueCard';
import { DisplayVenue } from '@/lib/types/venue';

interface VenueGridProps {
  venues: DisplayVenue[];
  loading?: boolean | undefined;
}

const VenueGrid = ({ venues, loading = false }: VenueGridProps) => {
  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    );
  }

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
      {venues.map(venue => (
        <VenueCard key={venue.id} venue={venue} />
      ))}
    </div>
  );
};

export default VenueGrid;
