import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PromotionSettings } from '@/lib/types/promotion';
import { ActivePromotions } from './ActivePromotions';
import PastPromotionsTable from './PastPromotionsTable';

interface PromotionTabsProps {
  activePromotions: PromotionSettings[];
  selectedPromotion: PromotionSettings | null;
  onSelectPromotion: (promotion: PromotionSettings) => void;
  onToggleStatus: (id: string, status: string) => void;
  promotions: PromotionSettings[];
}

const PromotionTabs = ({
  activePromotions,
  selectedPromotion,
  onSelectPromotion,
  onToggleStatus,
  promotions,
}: PromotionTabsProps) => {
  return (
    <Tabs defaultValue='active' className='w-full'>
      <TabsList className='mb-4'>
        <TabsTrigger value='active'>Active Promotions</TabsTrigger>
        <TabsTrigger value='past'>Past Promotions</TabsTrigger>
      </TabsList>

      <TabsContent value='active'>
        <ActivePromotions
          promotions={activePromotions}
          selectedPromotion={selectedPromotion}
          onSelectPromotion={onSelectPromotion}
          onToggleStatus={onToggleStatus}
        />
      </TabsContent>

      <TabsContent value='past'>
        <Card>
          <CardHeader>
            <CardTitle>Past Promotions</CardTitle>
          </CardHeader>
          <CardContent>
            <PastPromotionsTable
              promotions={promotions.filter(p => ['completed', 'rejected'].includes(p.status))}
              onSelectPromotion={onSelectPromotion}
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default PromotionTabs;
