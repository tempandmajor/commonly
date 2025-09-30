import { Edit, Trash } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SponsorshipTier } from '@/lib/types/event';

interface TierCardProps {
  tier: SponsorshipTier;
  onEdit: (tier: SponsorshipTier) => void;
  onDelete: (id: string) => void;
  isEditing: boolean;
}

export const TierCard = ({ tier, onEdit, onDelete, isEditing }: TierCardProps) => {
  return (
    <Card key={tier.id} className='mb-4'>
      <CardContent className='pt-4'>
        <div className='flex justify-between items-start mb-2'>
          <div>
            <h4 className='font-medium'>{tier.name}</h4>
            <p className='text-lg font-semibold'>${tier.price.toLocaleString()}</p>
          </div>
          <div className='flex space-x-1'>
            <Button
              type='button'
              variant='ghost'
              size='icon'
              onClick={() => onEdit(tier)}
              disabled={isEditing}
            >
              <span className='sr-only'>Edit tier</span>
              <Edit className='h-4 w-4' />
            </Button>
            <Button
              type='button'
              variant='ghost'
              size='icon'
              onClick={() => onDelete(tier.id)}
              disabled={isEditing}
            >
              <span className='sr-only'>Delete tier</span>
              <Trash className='h-4 w-4' />
            </Button>
          </div>
        </div>

        {tier.description && (
          <p className='text-muted-foreground text-sm mb-3'>{tier.description}</p>
        )}

        {tier.benefits.length > 0 && (
          <div className='space-y-1'>
            <p className='text-sm font-medium'>Benefits:</p>
            <ul className='text-sm list-disc list-inside space-y-1'>
              {tier.benefits.map((benefit, index) => (
                <li key={index}>{benefit}</li>
              ))}
            </ul>
          </div>
        )}

        {tier.maxSponsors && (
          <p className='text-xs text-muted-foreground mt-2'>
            Limited to {tier.maxSponsors} sponsors
          </p>
        )}
      </CardContent>
    </Card>
  );
};
