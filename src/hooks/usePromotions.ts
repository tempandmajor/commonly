import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { PromotionSettings } from '@/lib/types/promotion';
import { updatePromotionStatus } from '@/services/promotionService';
import { supabase } from '@/integrations/supabase/client';

export const usePromotions = () => {
  const [promotions, setPromotions] = useState<PromotionSettings[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('pending');
  const [activePromotions, setActivePromotions] = useState<PromotionSettings[]>([]);
  const [pendingPromotions, setPendingPromotions] = useState<PromotionSettings[]>([]);
  const [completedPromotions, setCompletedPromotions] = useState<PromotionSettings[]>([]);

  /**
   * Maps content data from ContentTest table to the PromotionSettings interface
   */
  const mapContentToPromotion = (item: unknown): PromotionSettings | null => {
    try {
      const promotionData = JSON.parse(item.body || '{}') as any;

      if (promotionData.type === 'promotion_settings') {
        return {
          id: item.id,
          targetId: promotionData.targetId || '',
          title: item.title || promotionData.title || '',
          description: promotionData.description || '',
          budget: promotionData.budget || 0,
          startDate: promotionData.startDate || item.created_at,
          endDate: promotionData.endDate || null,
          status: promotionData.status || 'pending',
          targetAudience: promotionData.targetAudience || '',
          createdBy: promotionData.createdBy || '',
          createdAt: item.created_at,
          type: promotionData.targetType || 'event',
          userId: promotionData.userId || '',
        };
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  /**
   * Fetch promotions from the ContentTest table
   */
  const fetchPromotions = async () => {
    setIsLoading(true);
    try {
      // Fetch promotion settings from ContentTest
      const { data, error } = await supabase
        .from('ContentTest')
        .select('*')
        .like('body', '%"type":"promotion_settings"%')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map and filter out any parsing errors
      const promotionsData = (data || [])
        .map(mapContentToPromotion)
        .filter(Boolean) as PromotionSettings[];

      setPromotions(promotionsData);

      // Update filtered lists
      setActivePromotions(promotionsData.filter(p => p.status === 'active'));
      setPendingPromotions(promotionsData.filter(p => p.status === 'pending'));
      setCompletedPromotions(
        promotionsData.filter(p => ['completed', 'rejected'].includes(p.status))
      );
    } catch (error) {
      toast.error('Failed to load promotions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleToggleStatus = async (promotionId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'completed' : 'active';

    try {
      const success = await updatePromotionStatus(
        promotionId,
        newStatus as 'active' | 'completed' | 'pending' | 'rejected'
      );

      if (success) {
        const updatedPromotions = promotions.map(promo =>
          promo.id === promotionId
            ? {
          ...promo,
                status: newStatus as 'pending' | 'active' | 'completed' | 'rejected' | 'paused',
              }
            : promo
        );

        setPromotions(updatedPromotions);
        setActivePromotions(updatedPromotions.filter(p => p.status === 'active'));
        setPendingPromotions(updatedPromotions.filter(p => p.status === 'pending'));
        setCompletedPromotions(
          updatedPromotions.filter(p => ['completed', 'rejected'].includes(p.status))
        );

        toast.success(
          `Promotion ${newStatus === 'active' ? 'activated' : 'completed'} successfully`
        );
      }
    } catch (error) {
      toast.error('Failed to update promotion status');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const success = await updatePromotionStatus(id, 'active');
      if (success) {
        const updatedPromotions = promotions.map(promo =>
          promo.id === id ? { ...promo, status: 'active' as const } : promo
        );
        setPromotions(updatedPromotions);
        setActivePromotions(updatedPromotions.filter(p => p.status === 'active'));
        setPendingPromotions(updatedPromotions.filter(p => p.status === 'pending'));

        toast.success('Promotion approved successfully');
      }
    } catch (error) {
      toast.error('Failed to approve promotion');
    }
  };

  const handleReject = async (id: string) => {
    try {
      const success = await updatePromotionStatus(id, 'rejected');
      if (success) {
        const updatedPromotions = promotions.map(promo =>
          promo.id === id ? { ...promo, status: 'rejected' as const } : promo
        );
        setPromotions(updatedPromotions);
        setCompletedPromotions([
          ...completedPromotions,
          ...updatedPromotions.filter(p => p.id === id),
        ]);
        setPendingPromotions(updatedPromotions.filter(p => p.status === 'pending'));

        toast.success('Promotion rejected successfully');
      }
    } catch (error) {
      toast.error('Failed to reject promotion');
    }
  };

  return {
    promotions,
    isLoading,
    activeTab,
    setActiveTab,
    activePromotions,
    pendingPromotions,
    completedPromotions,
    handleToggleStatus,
    handleApprove,
    handleReject,
  };
};
