import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SponsorshipTier } from '@/lib/types/event';
import { X, Check } from 'lucide-react';
import { SponsorshipBenefits } from './SponsorshipBenefits';

interface TierFormProps {
  tier: SponsorshipTier;
  onSave: () => void;
  onCancel: () => void;
  onUpdate: (field: keyof SponsorshipTier, value: unknown) => void;
  onAddBenefit: () => void;
  onRemoveBenefit: (index: number) => void;
  onBenefitChange: (index: number, value: string) => void;
  isEditing?: boolean | undefined;
}

export const TierForm = ({
  tier,
  onSave,
  onCancel,
  onUpdate,
  onAddBenefit,
  onRemoveBenefit,
  onBenefitChange,
  isEditing = false,
}: TierFormProps) => {
  return (
    <Card className='mb-4 border-dashed'>
      <CardHeader className='pb-3'>
        <CardTitle className='text-lg'>
          {isEditing ? 'Edit Sponsorship Tier' : 'Add New Sponsorship Tier'}
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='space-y-2'>
          <Label>Tier Name</Label>
          <Input
            value={tier.name}
            onChange={e => onUpdate('name', (e.target as HTMLInputElement).value)}
            placeholder='e.g. Gold Sponsor'
          />
        </div>

        <div className='space-y-2'>
          <Label>Price ($)</Label>
          <Input
            type='number'
            value={tier.price}
            onChange={e => onUpdate('price', Number((e.target as HTMLInputElement) as number.value) as number)}
            min='0'
            step='100'
            placeholder='1000'
          />
        </div>

        <div className='space-y-2'>
          <Label>Description</Label>
          <Textarea
            value={tier.description || ''}
            onChange={e => onUpdate('description', (e.target as HTMLInputElement).value)}
            placeholder='Describe what sponsors get with this tier'
            rows={3}
          />
        </div>

        <div className='space-y-2'>
          <Label>Maximum Number of Sponsors (Optional)</Label>
          <Input
            type='number'
            value={tier.maxSponsors || ''}
            onChange={e =>
              onUpdate('maxSponsors', (e.target as HTMLInputElement).value ? Number((e.target as HTMLInputElement) as number.value): undefined)
            }
            min='1'
            placeholder='Leave empty for unlimited'
          />
        </div>

        <SponsorshipBenefits
          benefits={tier.benefits}
          onAddBenefit={onAddBenefit}
          onRemoveBenefit={onRemoveBenefit}
          onBenefitChange={onBenefitChange}
        />

        <div className='flex justify-end space-x-2 pt-2'>
          <Button type='button' variant='outline' onClick={onCancel}>
            <X className='h-4 w-4 mr-1' />
            Cancel
          </Button>
          <Button type='button' onClick={onSave} disabled={!tier.name || tier.price <= 0}>
            <Check className='h-4 w-4 mr-1' />
            {isEditing ? 'Update' : 'Add'} Tier
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
