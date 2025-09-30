import React from 'react';
import { RouteWrapper } from '@/components/layout/RouteWrapper';
import CatererOwnerBookingDashboard from '@/components/caterers/CatererOwnerBookingDashboard';

const CatererBookingManagement: React.FC = () => {
  return (
    <RouteWrapper>
      <div className='container mx-auto px-4 py-8'>
        <CatererOwnerBookingDashboard />
      </div>
    </RouteWrapper>
  );
};

export default CatererBookingManagement;
