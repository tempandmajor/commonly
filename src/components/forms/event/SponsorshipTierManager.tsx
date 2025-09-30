import React, { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { EventFormValues } from '@/lib/validations/eventValidation';
import { SponsorshipTier } from '@/lib/types/event';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Users, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface SponsorshipTierManagerProps {
  form: UseFormReturn<EventFormValues>;
}

export const SponsorshipTierManager: React.FC<SponsorshipTierManagerProps> = ({ form }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newTier, setNewTier] = useState<Partial<SponsorshipTier>>({
    name: '',
    price: 0,
    benefits: [],
    description: '',
  });

  const sponsorshipTiers = form.watch('sponsorshipTiers') || [];

  const handleAddTier = () => {
    if (!newTier.name || !newTier.price) {
      toast.error('Please fill in tier name and price');
      return;
    }

    const tier: SponsorshipTier = {
      id: Date.now().toString(),
      name: newTier.name,
      price: newTier.price,
      benefits: newTier.benefits || [],
      maxSponsors: newTier.maxSponsors,
      description: newTier.description || '',
    };

    form.setValue('sponsorshipTiers', [...sponsorshipTiers, tier]);
    setNewTier({
      name: '',
      price: 0,
      benefits: [],
      description: '',
    });
    setIsCreating(false);
    toast.success('Sponsorship tier added');
  };

  const handleRemoveTier = (tierId: string) => {
    const updatedTiers = sponsorshipTiers.filter(tier => tier.id !== tierId);
    form.setValue('sponsorshipTiers', updatedTiers);
    toast.success('Sponsorship tier removed');
  };

  const handleBenefitChange = (index: number, value: string) => {
    const benefits = [...(newTier.benefits || [])];
    benefits[index] = value;
    setNewTier({ ...newTier, benefits });
  };

  const handleAddBenefit = () => {
    const benefits = [...(newTier.benefits || []), ''];
    setNewTier({ ...newTier, benefits });
  };

  const handleRemoveBenefit = (index: number) => {
    const benefits = (newTier.benefits || []).filter((_, i) => i !== index);
    setNewTier({ ...newTier, benefits });
  };

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold'>Sponsorship Tiers</h3>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={() => setIsCreating(true)}
          disabled={isCreating}
        >
          <Plus className='h-4 w-4 mr-2' />
          Add Tier
        </Button>
      </div>

      {/* Existing Tiers */}
      {sponsorshipTiers.length > 0 && (
        <div className='space-y-3'>
          {sponsorshipTiers.map(tier => (
            <Card key={tier.id} className='p-4'>
              <div className='flex items-start justify-between'>
                <div className='flex-1'>
                  <div className='flex items-center gap-2 mb-2'>
                    <h5 className='font-semibold'>{tier.name}</h5>
                    <Badge variant='secondary'>${tier.price.toLocaleString()}</Badge>
                    {tier.maxSponsors && (
                      <Badge variant='outline'>
                        <Users className='h-3 w-3 mr-1' />
                        Max {tier.maxSponsors}
                      </Badge>
                    )}
                  </div>
                  {tier.description && (
                    <p className='text-sm text-muted-foreground mb-2'>{tier.description}</p>
                  )}
                  {tier.benefits.length > 0 && (
                    <ul className='text-sm space-y-1'>
                      {tier.benefits.map((benefit, index) => (
                        <li key={index} className='flex items-start'>
                          <span className='mr-2'>•</span>
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={() => handleRemoveTier(tier.id)}
                >
                  <Trash2 className='h-4 w-4' />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create New Tier Form */}
      {isCreating && (
        <Card className='p-4'>
          <CardHeader className='px-0 pt-0'>
            <CardTitle className='text-base'>Create New Sponsorship Tier</CardTitle>
          </CardHeader>
          <CardContent className='px-0 space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='tier-name'>Tier Name</Label>
                <Input
                  id='tier-name'
                  value={newTier.name || ''}
                  onChange={e => setNewTier({ ...newTier, name: (e.target as HTMLInputElement).value })}
                  placeholder='e.g., Gold Sponsor'
                />
              </div>
              <div>
                <Label htmlFor='tier-price'>Price ($)</Label>
                <Input
                  id='tier-price'
                  type='number'
                  min='0'
                  value={newTier.price || ''}
                  onChange={e => setNewTier({ ...newTier, price: parseInt((e.target as HTMLInputElement).value) || 0 })}
                  placeholder='e.g., 5000'
                />
              </div>
            </div>

            <div>
              <Label htmlFor='tier-description'>Description (Optional)</Label>
              <Textarea
                id='tier-description'
                value={newTier.description || ''}
                onChange={e => setNewTier({ ...newTier, description: (e.target as HTMLInputElement).value })}
                placeholder='Describe what this sponsorship tier includes...'
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor='max-sponsors'>Max Sponsors (Optional)</Label>
              <Input
                id='max-sponsors'
                type='number'
                min='1'
                value={newTier.maxSponsors || ''}
                onChange={e =>
                  setNewTier({ ...newTier, maxSponsors: parseInt((e.target as HTMLInputElement).value) || undefined })
                }
                placeholder='e.g., 5'
              />
            </div>

            <div>
              <div className='flex items-center justify-between mb-2'>
                <Label>Benefits</Label>
                <Button type='button' variant='outline' size='sm' onClick={handleAddBenefit}>
                  <Plus className='h-3 w-3 mr-1' />
                  Add Benefit
                </Button>
              </div>
              {(newTier.benefits || []).map((benefit, index) => (
                <div key={index} className='flex gap-2 mb-2'>
                  <Input
                    value={benefit}
                    onChange={e => handleBenefitChange(index, (e.target as HTMLInputElement).value)}
                    placeholder='e.g., Logo on event materials'
                  />
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={() => handleRemoveBenefit(index)}
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </div>
              ))}
            </div>

            <div className='flex gap-2'>
              <Button type='button' onClick={handleAddTier}>
                Create Tier
              </Button>
              <Button
                type='button'
                variant='outline'
                onClick={() => {
                  setIsCreating(false);
                  setNewTier({
                    name: '',
                    price: 0,
                    benefits: [],
                    description: '',
                  });
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {sponsorshipTiers.length === 0 && !isCreating && (
        <div className='text-center py-8 text-muted-foreground'>
          <DollarSign className='h-12 w-12 mx-auto mb-4 opacity-50' />
          <p>No sponsorship tiers created yet.</p>
          <p className='text-sm'>Add tiers to offer different sponsorship options.</p>
        </div>
      )}
    </div>
  );
};
