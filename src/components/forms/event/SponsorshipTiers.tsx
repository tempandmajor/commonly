import React, { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { EventFormValues } from '@/lib/validations/eventValidation';
import { PlusCircle } from 'lucide-react';
import { TierCard } from './sponsorship/TierCard';
import { TierForm } from './sponsorship/TierForm';
import { useTierState } from './sponsorship/useTierState';

interface SponsorshipTiersProps {
  form: UseFormReturn<EventFormValues>;
}

const SponsorshipTiers = ({ form }: SponsorshipTiersProps) => {
  const {
    tiers,
    editingTier,
    newTier,
    setNewTier,
    setEditingTier,
    handleSaveTier,
    handleUpdateTier,
    handleDeleteTier,
    handleUpdateNewTier,
    handleUpdateEditingTier,
    handleAddBenefit,
    handleBenefitChange,
    handleRemoveBenefit,
  } = useTierState(form);

  const [isAddingTier, setIsAddingTier] = useState(false);

  return (
    <div className='space-y-4'>
      <div className='flex justify-between items-center'>
        <h3 className='text-lg font-medium'>Sponsorship Tiers</h3>
        {!isAddingTier && (
          <Button type='button' onClick={() => setIsAddingTier(true)} variant='outline'>
            <PlusCircle className='h-4 w-4 mr-2' />
            Add Tier
          </Button>
        )}
      </div>

      {tiers.length === 0 && !isAddingTier && (
        <p className='text-muted-foreground text-sm'>
          No sponsorship tiers have been added yet. Add tiers to attract sponsors to your event.
        </p>
      )}

      {isAddingTier && (
        <TierForm
          tier={newTier}
          onSave={() => {
            handleSaveTier();
            setIsAddingTier(false);
          }}
          onCancel={() => setIsAddingTier(false)}
          onUpdate={handleUpdateNewTier}
          onAddBenefit={() => handleAddBenefit(false)}
          onRemoveBenefit={index => handleRemoveBenefit(index, false)}
          onBenefitChange={(index, value) => handleBenefitChange(index, value, false)}
        />
      )}

      {tiers.map(tier =>
        editingTier?.id === tier.id ? (
          <TierForm
            key={tier.id}
            tier={editingTier}
            onSave={handleUpdateTier}
            onCancel={() => setEditingTier(null)}
            onUpdate={handleUpdateEditingTier}
            onAddBenefit={() => handleAddBenefit(true)}
            onRemoveBenefit={index => handleRemoveBenefit(index, true)}
            onBenefitChange={(index, value) => handleBenefitChange(index, value, true)}
            isEditing
          />
        ) : (
          <TierCard
            key={tier.id}
            tier={tier}
            onEdit={setEditingTier}
            onDelete={handleDeleteTier}
            isEditing={!!editingTier}
          />
        )
      )}
    </div>
  );
};

export default SponsorshipTiers;
