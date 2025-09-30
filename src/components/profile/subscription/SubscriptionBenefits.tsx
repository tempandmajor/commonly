import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X } from 'lucide-react';

interface SubscriptionBenefitsProps {
  perks: string[];
  newPerk: string;
  onNewPerkChange: (perk: string) => void;
  onAddPerk: () => void;
  onRemovePerk: (index: number) => void;
}

const SubscriptionBenefits = ({
  perks,
  newPerk,
  onNewPerkChange,
  onAddPerk,
  onRemovePerk,
}: SubscriptionBenefitsProps) => {
  return (
    <div className='space-y-4'>
      <div className='flex gap-2'>
        <Input
          value={newPerk}
          onChange={e => onNewPerkChange((e.target as HTMLInputElement).value)}
          placeholder='Add a new benefit...'
          className='flex-1'
        />
        <Button type='button' onClick={onAddPerk} variant='outline'>
          <Plus className='h-4 w-4 mr-1' /> Add
        </Button>
      </div>

      <div className='space-y-2'>
        {perks.map((perk, index) => (
          <div key={index} className='flex items-center justify-between rounded-md border p-2'>
            <span>{perk}</span>
            <Button variant='ghost' size='sm' onClick={() => onRemovePerk(index)}>
              <X className='h-4 w-4' />
            </Button>
          </div>
        ))}
        {perks.length === 0 && (
          <p className='text-sm text-muted-foreground'>Add some benefits for your subscribers</p>
        )}
      </div>
    </div>
  );
};

export default SubscriptionBenefits;
