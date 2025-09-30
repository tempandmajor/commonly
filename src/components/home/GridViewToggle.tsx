import { Grid3X3, LayoutList } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GridViewToggleProps {
  viewMode: 'grid' | 'list';
  onViewChange: (mode: 'grid' | 'list') => void;
}

const GridViewToggle = ({ viewMode, onViewChange }: GridViewToggleProps) => {
  return (
    <div className='flex items-center gap-2'>
      <Button
        variant={viewMode === 'grid' ? 'default' : 'outline'}
        size='icon'
        onClick={() => onViewChange('grid')}
        className='h-8 w-8'
      >
        <Grid3X3 className='h-4 w-4' />
      </Button>
      <Button
        variant={viewMode === 'list' ? 'default' : 'outline'}
        size='icon'
        onClick={() => onViewChange('list')}
        className='h-8 w-8'
      >
        <LayoutList className='h-4 w-4' />
      </Button>
    </div>
  );
};

export default GridViewToggle;
