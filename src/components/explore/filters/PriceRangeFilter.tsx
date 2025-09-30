import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PriceRangeFilterProps {
  defaultValue?: string | undefined;
  onChange: (value: string) => void;
}

const PriceRangeFilter = ({ defaultValue = 'all', onChange }: PriceRangeFilterProps) => {
  return (
    <div>
      <Label className='text-sm font-medium mb-1 block'>Price Range</Label>
      <Select defaultValue={defaultValue} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder='Any price' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>Any price</SelectItem>
          <SelectItem value='$'>$ (Budget-friendly)</SelectItem>
          <SelectItem value='$$'>$$ (Moderate)</SelectItem>
          <SelectItem value='$$$'>$$$ (Premium)</SelectItem>
          <SelectItem value='$$$$'>$$$$ (Luxury)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default PriceRangeFilter;
