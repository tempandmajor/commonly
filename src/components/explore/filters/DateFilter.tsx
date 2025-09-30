import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface DateFilterProps {
  onChange: (date: string) => void;
}

const DateFilter = ({ onChange }: DateFilterProps) => {
  return (
    <div>
      <Label className='text-sm font-medium mb-1 block'>Event Date</Label>
      <Input type='date' className='w-full' onChange={e => onChange((e.target as HTMLInputElement).value)} />
    </div>
  );
};

export default DateFilter;
