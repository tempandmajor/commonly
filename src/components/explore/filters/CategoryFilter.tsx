import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EventType, EventCategory } from '@/lib/types/event';

interface CategoryFilterProps {
  defaultValue?: string | undefined;
  onChange: (value: string) => void;
}

const CategoryFilter = ({ defaultValue = 'all', onChange }: CategoryFilterProps) => {
  // Handler for event type selection
  const handleTypeChange = (value: string) => {
    onChange(value === 'all' ? '' : value);
  };

  // Handler for category selection with exact string matching
  const handleCategoryChange = (value: string) => {
    // Make sure we pass the exact value from the EventCategory enum
    onChange(value === 'all' ? '' : value);
  };

  return (
    <div>
      <Label className='text-sm font-medium mb-1 block'>Event Type</Label>
      <Select defaultValue={defaultValue} onValueChange={handleTypeChange}>
        <SelectTrigger>
          <SelectValue placeholder='All event types' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>All event types</SelectItem>
          {Object.values(EventType).map(type => (
            <SelectItem key={type} value={type}>
              {type}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Label className='text-sm font-medium mb-1 mt-4 block'>Event Category</Label>
      <Select defaultValue={defaultValue} onValueChange={handleCategoryChange}>
        <SelectTrigger>
          <SelectValue placeholder='All categories' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>All categories</SelectItem>
          {Object.values(EventCategory).map(category => (
            <SelectItem key={category} value={category}>
              {category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CategoryFilter;
