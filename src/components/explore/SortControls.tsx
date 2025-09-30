import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SortControlsProps {
  sortOrder: string;
  onSortChange: (value: string) => void;
}

const SortControls = ({ sortOrder, onSortChange }: SortControlsProps) => {
  return (
    <Select value={sortOrder} onValueChange={onSortChange}>
      <SelectTrigger className='w-[180px]'>
        <SelectValue placeholder='Sort by' />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value='newest'>Newest</SelectItem>
        <SelectItem value='popular'>Most Popular</SelectItem>
        <SelectItem value='funded'>Best Funded</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default SortControls;
