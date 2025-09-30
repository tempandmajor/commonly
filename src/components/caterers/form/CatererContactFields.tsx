import React from 'react';
import { Input } from '@/components/ui/input';

interface CatererContactFieldsProps {
  formData: {
    contactEmail: string;
    contactPhone: string;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export const CatererContactFields: React.FC<CatererContactFieldsProps> = ({
  formData,
  handleInputChange,
}) => {
  return (
    <div className='grid md:grid-cols-2 gap-4'>
      <div className='space-y-2'>
        <label className='text-sm font-medium'>Contact Email</label>
        <Input
          name='contactEmail'
          type='email'
          value={formData.contactEmail}
          onChange={handleInputChange}
          placeholder='contact@yourcompany.com'
        />
      </div>
      <div className='space-y-2'>
        <label className='text-sm font-medium'>Contact Phone</label>
        <Input
          name='contactPhone'
          type='tel'
          value={formData.contactPhone}
          onChange={handleInputChange}
          placeholder='(123) 456-7890'
        />
      </div>
    </div>
  );
};

export default CatererContactFields;
