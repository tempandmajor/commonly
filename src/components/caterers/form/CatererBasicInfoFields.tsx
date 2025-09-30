import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface CatererBasicInfoFieldsProps {
  formData: {
    name: string;
    description: string;
    cuisineType: string;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export const CatererBasicInfoFields: React.FC<CatererBasicInfoFieldsProps> = ({
  formData,
  handleInputChange,
}) => {
  return (
    <>
      <div className='grid md:grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <label className='text-sm font-medium'>Caterer Name *</label>
          <Input
            name='name'
            value={formData.name}
            onChange={handleInputChange}
            placeholder='Your catering business name'
            required
          />
        </div>
        <div className='space-y-2'>
          <label className='text-sm font-medium'>Cuisine Type *</label>
          <Input
            name='cuisineType'
            value={formData.cuisineType}
            onChange={handleInputChange}
            placeholder='e.g., Italian, Fusion, Vegan'
            required
          />
        </div>
      </div>

      <div className='space-y-2'>
        <label className='text-sm font-medium'>Description *</label>
        <Textarea
          name='description'
          value={formData.description}
          onChange={handleInputChange}
          placeholder='Tell us about your catering business, your specialties, and what makes you unique'
          className='min-h-[100px]'
          required
        />
      </div>
    </>
  );
};

export default CatererBasicInfoFields;
