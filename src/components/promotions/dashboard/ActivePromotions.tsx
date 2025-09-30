import { PromotionSettings } from '@/lib/types/promotion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PromotionCard } from './PromotionCard';

interface ActivePromotionsProps {
  promotions: PromotionSettings[];
  selectedPromotion: PromotionSettings | null;
  onSelectPromotion: (promotion: PromotionSettings) => void;
  onToggleStatus: (id: string, status: string) => void;
}

export const ActivePromotions = ({
  promotions,
  selectedPromotion,
  onSelectPromotion,
  onToggleStatus,
}: ActivePromotionsProps) => {
  if (promotions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Promotions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground'>No active promotions found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Promotions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {promotions.map(promotion => (
            <PromotionCard
              key={promotion.id}
              promotion={promotion}
              isSelected={selectedPromotion?.id === promotion.id}
              onSelect={() => onSelectPromotion(promotion)}
              onToggleStatus={onToggleStatus}
            />

          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivePromotions;
