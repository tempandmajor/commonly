import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface VenueListHeaderProps {
  totalVenues: number;
}

const VenueListHeader = ({ totalVenues }: VenueListHeaderProps) => {
  return (
    <div className='flex justify-between items-center mb-6'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Venue Listings</h1>
        <p className='text-muted-foreground mt-1'>
          Find the perfect venue for your next event
          {totalVenues > 0 && ` (${totalVenues} available)`}
        </p>
      </div>
      <Button asChild>
        <Link to='/venue/list-your-venue'>
          <Plus className='mr-2 h-4 w-4' /> List Your Venue
        </Link>
      </Button>
    </div>
  );
};

export default VenueListHeader;
