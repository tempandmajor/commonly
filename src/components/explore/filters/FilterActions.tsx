import { Button } from '@/components/ui/button';

interface FilterActionsProps {
  onApply: () => void;
  onReset: () => void;
}

const FilterActions = ({ onApply, onReset }: FilterActionsProps) => {
  return (
    <div className='space-y-2'>
      <Button className='w-full' onClick={onApply}>
        Apply Filters
      </Button>
      <Button variant='outline' className='w-full' onClick={onReset}>
        Reset All
      </Button>
    </div>
  );
};

export default FilterActions;
