import React from 'react';
import { UnifiedCaterer } from '@/types/unifiedCaterer';

interface CatererHeaderProps {
  caterer: UnifiedCaterer;
}

const CatererHeader: React.FC<CatererHeaderProps> = ({ caterer }) => {
  return (
    <div className='space-y-2'>
      <h1 className='text-3xl font-bold'>{caterer.name}</h1>
      <p className='text-muted-foreground'>
        {typeof caterer.location === 'string'
          ? caterer.location
          : caterer.location?.address || 'Location not specified'}
      </p>
    </div>
  );
};

export default CatererHeader;
