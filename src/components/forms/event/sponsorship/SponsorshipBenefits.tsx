import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, X } from 'lucide-react';

interface SponsorshipBenefitsProps {
  benefits: string[];
  onAddBenefit: () => void;
  onRemoveBenefit: (index: number) => void;
  onBenefitChange: (index: number, value: string) => void;
}

export const SponsorshipBenefits = ({
  benefits,
  onAddBenefit,
  onRemoveBenefit,
  onBenefitChange,
}: SponsorshipBenefitsProps) => {
  return (
    <div className='space-y-2'>
      <div className='flex justify-between items-center'>
        <Label>Benefits</Label>
        <Button type='button' variant='ghost' size='sm' onClick={onAddBenefit}>
          <PlusCircle className='h-4 w-4 mr-1' />
          Add Benefit
        </Button>
      </div>

      {benefits.map((benefit, index) => (
        <div key={index} className='flex space-x-2'>
          <Input
            value={benefit}
            onChange={e => onBenefitChange(index, (e.target as HTMLInputElement).value)}
            placeholder={`Benefit ${index + 1}`}
          />
          <Button
            type='button'
            variant='ghost'
            size='icon'
            onClick={() => onRemoveBenefit(index)}
            disabled={benefits.length <= 1}
          >
            <X className='h-4 w-4' />
          </Button>
        </div>
      ))}
    </div>
  );
};
