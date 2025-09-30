import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Toggle } from '@/components/ui/toggle';
import { PromotionSettings } from '@/lib/types/promotion';
import { Pause, Play } from 'lucide-react';

interface PromotionCardProps {
  promotion: PromotionSettings;
  isSelected: boolean;
  onSelect: () => void;
  onToggleStatus: (id: string, status: string) => void;
}

export const PromotionCard = ({
  promotion,
  isSelected,
  onSelect,
  onToggleStatus,
}: PromotionCardProps) => {
  const handleToggleStatus = () => {
    const newStatus = promotion.status === 'active' ? 'paused' : 'active';
    onToggleStatus(promotion.id, newStatus);
  };

  return (
    <Card
      className={`cursor-pointer transition-colors ${isSelected ? 'ring-2 ring-primary' : ''}`}
      onClick={onSelect}
    >
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>{promotion.title}</CardTitle>
        <Badge variant={promotion.status === 'active' ? 'default' : 'secondary'}>
          {promotion.status}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold'>${promotion.budget}</div>
        <p className='text-xs text-muted-foreground'>{promotion.targetAudience}</p>
        <div className='flex items-center pt-2'>
          <Toggle
            pressed={promotion.status === 'active'}
            onPressedChange={handleToggleStatus}
            className='ml-auto'
            variant='outline'
          >
            {promotion.status === 'active' ? (
              <Pause className='h-4 w-4' />
            ) : (
              <Play className='h-4 w-4' />
            )}
          </Toggle>
        </div>
      </CardContent>
    </Card>
  );
};

export default PromotionCard;
