import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { SponsorshipTier } from '@/lib/types/event';
import { UseFormReturn } from 'react-hook-form';
import { EventFormValues } from '@/lib/validations/eventValidation';

export const useTierState = (form: UseFormReturn<EventFormValues>) => {
  const initialTiers = (form.getValues('sponsorshipTiers') || []).map(tier => ({
          ...tier,
    id: tier.id || uuidv4(),
    name: tier.name || '',
    price: tier.price || 0,
    description: tier.description || '',
    benefits: tier.benefits || [''],
    maxSponsors: tier.maxSponsors,
    currentSponsors: tier.currentSponsors || 0,
  }));

  const [tiers, setTiers] = useState<SponsorshipTier[]>(initialTiers);
  const [editingTier, setEditingTier] = useState<SponsorshipTier | null>(null);
  const [newTier, setNewTier] = useState<SponsorshipTier>({
    id: uuidv4(),
    name: '',
    price: 0,
    description: '',
    benefits: [''],
    currentSponsors: 0,
  });

  const handleSaveTier = () => {
    if (!newTier.name || newTier.price <= 0) return;

    const tierToSave: SponsorshipTier = {
          ...newTier,
      benefits: newTier.benefits.filter(benefit => benefit.trim() !== ''),
    };

    const updatedTiers = [...tiers, tierToSave];
    setTiers(updatedTiers);
    form.setValue('sponsorshipTiers', updatedTiers);

    setNewTier({
      id: uuidv4(),
      name: '',
      price: 0,
      description: '',
      benefits: [''],
      currentSponsors: 0,
    });
  };

  const handleUpdateTier = () => {
    if (!editingTier || !editingTier.name || editingTier.price <= 0) return;

    const updatedTier = {
          ...editingTier,
      benefits: editingTier.benefits.filter(benefit => benefit.trim() !== ''),
    };

    const updatedTiers = tiers.map(tier => (tier.id === updatedTier.id ? updatedTier : tier));

    setTiers(updatedTiers);
    form.setValue('sponsorshipTiers', updatedTiers);
    setEditingTier(null);
  };

  const handleDeleteTier = (id: string) => {
    const updatedTiers = tiers.filter(tier => tier.id !== id);
    setTiers(updatedTiers);
    form.setValue('sponsorshipTiers', updatedTiers);
  };

  const handleUpdateNewTier = (field: keyof SponsorshipTier, value: unknown) => {
    setNewTier(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdateEditingTier = (field: keyof SponsorshipTier, value: unknown) => {
    setEditingTier(prev => (prev ? { ...prev, [field]: value } : null));
  };

  const handleAddBenefit = (isEditing: boolean) => {
    if (isEditing && editingTier) {
      setEditingTier({ ...editingTier, benefits: [...editingTier.benefits, ''] });
    } else {
      setNewTier(prev => ({
          ...prev,
        benefits: [...prev.benefits, ''],
      }));
    }
  };

  const handleBenefitChange = (index: number, value: string, isEditing: boolean) => {
    if (isEditing && editingTier) {
      const updatedBenefits = [...editingTier.benefits];
      updatedBenefits[index] = value;
      setEditingTier({ ...editingTier, benefits: updatedBenefits });
    } else {
      const updatedBenefits = [...newTier.benefits];
      updatedBenefits[index] = value;
      setNewTier({ ...newTier, benefits: updatedBenefits });
    }
  };

  const handleRemoveBenefit = (index: number, isEditing: boolean) => {
    if (isEditing && editingTier) {
      const updatedBenefits = [...editingTier.benefits];
      updatedBenefits.splice(index, 1);
      setEditingTier({ ...editingTier, benefits: updatedBenefits });
    } else {
      const updatedBenefits = [...newTier.benefits];
      updatedBenefits.splice(index, 1);
      setNewTier({ ...newTier, benefits: updatedBenefits });
    }
  };

  return {
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
  };
};
