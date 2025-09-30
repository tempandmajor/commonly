import React from 'react';
import { Input } from '@/components/ui/input';

interface CatererSpecialtiesFieldsProps {
  formData: {
    specialties: string;
    dietaryOptions: string;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export const CatererSpecialtiesFields: React.FC<CatererSpecialtiesFieldsProps> = ({
  formData,
  handleInputChange,
}) => {
  return (
    <div className='grid md:grid-cols-2 gap-4'>
      <div className='space-y-2'>
        <label className='text-sm font-medium'>Specialties (optional)</label>
        <Input
          name='specialties'
          value={formData.specialties}
          onChange={handleInputChange}
          placeholder='Wedding, Corporate, etc. (comma separated)'
        />
      </div>
      <div className='space-y-2'>
        <label className='text-sm font-medium'>Dietary Options (optional)</label>
        <Input
          name='dietaryOptions'
          value={formData.dietaryOptions}
          onChange={handleInputChange}
          placeholder='Vegan, Gluten-free, etc. (comma separated)'
        />
      </div>
    </div>
  );
};

export default CatererSpecialtiesFields;
