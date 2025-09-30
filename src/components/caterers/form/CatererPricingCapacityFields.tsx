import React from 'react';
import { Input } from '@/components/ui/input';

interface CatererPricingCapacityFieldsProps {
  formData: {
    location: string;
    pricePerPerson: string;
    minGuestCount: string;
    maxGuestCount: string;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export const CatererPricingCapacityFields: React.FC<CatererPricingCapacityFieldsProps> = ({
  formData,
  handleInputChange,
}) => {
  return (
    <div className='grid md:grid-cols-3 gap-4'>
      <div className='space-y-2'>
        <label className='text-sm font-medium'>Location *</label>
        <Input
          name='location'
          value={formData.location}
          onChange={handleInputChange}
          placeholder='City, State'
          required
        />
      </div>
      <div className='space-y-2'>
        <label className='text-sm font-medium'>Price per Person *</label>
        <Input
          name='pricePerPerson'
          type='number'
          value={formData.pricePerPerson}
          onChange={handleInputChange}
          placeholder='Base price'
          required
        />
      </div>
      <div className='space-y-2'>
        <label className='text-sm font-medium'>Guest Capacity</label>
        <div className='flex space-x-2'>
          <Input
            name='minGuestCount'
            type='number'
            value={formData.minGuestCount}
            onChange={handleInputChange}
            placeholder='Min'
          />
          <Input
            name='maxGuestCount'
            type='number'
            value={formData.maxGuestCount}
            onChange={handleInputChange}
            placeholder='Max'
          />
        </div>
      </div>
    </div>
  );
};

export default CatererPricingCapacityFields;
