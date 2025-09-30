import React, { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { PromotionFormValues } from './types';
import { FormFieldWrapper } from '@/components/shared/form-fields/FormFieldWrapper';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export interface TargetAudienceProps {
  form: UseFormReturn<PromotionFormValues>;
  isLoading: boolean;
  selectedLocations?: string[] | undefined;
  setSelectedLocations?: React.Dispatch<React.SetStateAction<string[]>> | undefined;
}

export const TargetAudience = ({
  form,
  isLoading,
  selectedLocations = [],
  setSelectedLocations = () => {},
}: TargetAudienceProps) => {
  const [locationInput, setLocationInput] = useState('');
  const [interestInput, setInterestInput] = useState('');

  // Get form values we need to watch
  const audience = form.watch('audience') || [];
  const interestTags = form.watch('interestTags') || [];

  const handleAddLocation = () => {
    if (locationInput && !selectedLocations.includes(locationInput)) {
      setSelectedLocations([...selectedLocations, locationInput]);
      form.setValue('locationTargeting', [...selectedLocations, locationInput]);
      setLocationInput('');
    }
  };

  const handleRemoveLocation = (location: string) => {
    const updated = selectedLocations.filter(loc => loc !== location);
    setSelectedLocations(updated);
    form.setValue('locationTargeting', updated);
  };

  const handleAddInterest = () => {
    if (interestInput && !interestTags.includes(interestInput)) {
      const updated = [...interestTags, interestInput];
      form.setValue('interestTags', updated);
      setInterestInput('');
    }
  };

  const handleRemoveInterest = (interest: string) => {
    const updated = interestTags.filter(tag => tag !== interest);
    form.setValue('interestTags', updated);
  };

  return (
    <div className='space-y-4'>
      <h3 className='text-lg font-medium'>Target Audience</h3>

      <FormFieldWrapper
        form={form}
        name='ageRangeMin'
        label='Age Range'
        description='Target users within a specific age range'
      >
        <div className='flex items-center space-x-2'>
          <Input type='number' placeholder='Min' disabled={isLoading} className='w-24' />
          <span>-</span>
          <Input type='number' placeholder='Max' disabled={isLoading} className='w-24' />
        </div>
      </FormFieldWrapper>

      <FormFieldWrapper
        form={form}
        name='locationTargeting'
        label='Location Targeting'
        description='Target users in specific locations'
      >
        <div className='flex items-center space-x-2'>
          <Input
            type='text'
            placeholder='Enter location'
            disabled={isLoading}
            value={locationInput}
            onChange={e => setLocationInput((e.target as HTMLInputElement).value)}
            className='flex-1'
          />
          <Button
            type='button'
            variant='outline'
            size='sm'
            disabled={isLoading}
            onClick={handleAddLocation}
          >
            Add
          </Button>
        </div>
        <div className='flex flex-wrap gap-1 mt-2'>
          {selectedLocations.map(location => (
            <Badge key={location} variant='secondary' className='gap-x-2'>
              {location}
              <Button
                type='button'
                variant='ghost'
                size='icon'
                onClick={() => handleRemoveLocation(location)}
              >
                <X className='h-3 w-3' />
              </Button>
            </Badge>
          ))}
        </div>
      </FormFieldWrapper>

      <FormFieldWrapper
        form={form}
        name='interestTags'
        label='Interest Targeting'
        description='Target users based on their interests'
      >
        <div className='flex items-center space-x-2'>
          <Input
            type='text'
            placeholder='Enter interest'
            disabled={isLoading}
            value={interestInput}
            onChange={e => setInterestInput((e.target as HTMLInputElement).value)}
            className='flex-1'
          />
          <Button
            type='button'
            variant='outline'
            size='sm'
            disabled={isLoading}
            onClick={handleAddInterest}
          >
            Add
          </Button>
        </div>
        <div className='flex flex-wrap gap-1 mt-2'>
          {interestTags.map(interest => (
            <Badge key={interest} variant='secondary' className='gap-x-2'>
              {interest}
              <Button
                type='button'
                variant='ghost'
                size='icon'
                onClick={() => handleRemoveInterest(interest)}
              >
                <X className='h-3 w-3' />
              </Button>
            </Badge>
          ))}
        </div>
      </FormFieldWrapper>
    </div>
  );
};
