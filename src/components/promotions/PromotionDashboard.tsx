import { useState } from 'react';
import { usePromotions } from '@/hooks/usePromotions';
import DashboardHeader from './dashboard/DashboardHeader';
import EmptyState from './dashboard/EmptyState';
import LoadingState from './dashboard/LoadingState';
import PromotionTabs from './dashboard/PromotionTabs';
import { PromotionSettings } from '@/lib/types/promotion';

const PromotionDashboard = () => {
  const { promotions, isLoading, handleToggleStatus } = usePromotions();
  const [selectedPromotion, setSelectedPromotion] = useState<PromotionSettings | null>(null);

  if (isLoading) {
    return <LoadingState />;
  }

  if (promotions.length === 0) {
    return <EmptyState />;
  }

  const activePromotions = promotions.filter(p => ['active', 'pending'].includes(p.status));

  return (
    <div className='space-y-6'>
      <DashboardHeader />

      <PromotionTabs
        activePromotions={activePromotions}
        selectedPromotion={selectedPromotion}
        onSelectPromotion={setSelectedPromotion}
        onToggleStatus={handleToggleStatus}
        promotions={promotions}
      />
    </div>
  );
};

export default PromotionDashboard;
