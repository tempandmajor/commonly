import { supabase } from '@/integrations/supabase/client';
import { handleError } from '@/utils/errorUtils';

interface PromotionData {
  id?: string | undefined;
  title: string;
  description: string;
  discount: number;
  validFrom: Date;
  validUntil: Date;
  couponCode: string;
  isActive: boolean;
  applicableTo: 'venues' | 'caterers' | 'all';
  minimumPurchase?: number | undefined;
  imageUrl?: string | undefined;
}

// Since the promotions table doesn't exist, we'll use ContentTest as a fallback
// and store promotion data in the body field as JSON

// Get active promotions
export const getActivePromotions = async (
  type?: 'venues' | 'caterers'
): Promise<PromotionData[]> => {
  try {
    // Use ContentTest table to store promotions data
    const { data, error } = await supabase
      .from('ContentTest')
      .select('*')
      .like('body', '%promotion%')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Parse and filter promotion data
    const promotions = (data || [])
      .map(item => {
        try {
          const promotionData = JSON.parse(item.body || '{}') as any;
          if (promotionData.type === 'promotion') {
            return {
              id: item.id,
              title: item.title || promotionData.title,
              description: promotionData.description || '',
              discount: promotionData.discount || 0,
              validFrom: new Date(promotionData.validFrom || item.created_at),
              validUntil: new Date(promotionData.validUntil || item.created_at),
              couponCode: promotionData.couponCode || '',
              isActive: promotionData.isActive || false,
              applicableTo: promotionData.applicableTo || 'all',
              minimumPurchase: promotionData.minimumPurchase,
              imageUrl: promotionData.imageUrl,
            };
          }
          return null;
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    // Filter by type if provided
    if (type) {
      return promotions.filter(p => p && (p.applicableTo === type || p.applicableTo === 'all'));
    }

    return promotions;
  } catch (error) {
    handleError(error, { type }, 'Unable to load promotions');
    return [];
  }
};

// Get promotion by id
export const getPromotionById = async (id: string): Promise<PromotionData | null> => {
  try {
    const { data, error } = await supabase.from('ContentTest').select('*').eq('id', id).single();

    if (error || !data) return null;

    try {
      const promotionData = JSON.parse(data.body || '{}') as any;
      if (promotionData.type === 'promotion') {
        return {
          id: data.id,
          title: data.title || promotionData.title,
          description: promotionData.description || '',
          discount: promotionData.discount || 0,
          validFrom: new Date(promotionData.validFrom || data.created_at),
          validUntil: new Date(promotionData.validUntil || data.created_at),
          couponCode: promotionData.couponCode || '',
          isActive: promotionData.isActive || false,
          applicableTo: promotionData.applicableTo || 'all',
          minimumPurchase: promotionData.minimumPurchase,
          imageUrl: promotionData.imageUrl,
        };
      }
    } catch {
      return null;
    }

    return null;
  } catch (error) {
    handleError(error, { id }, 'Unable to load promotion details');
    return null;
  }
};

// Apply promotion to booking
export const applyPromotion = async (
  promoCode: string,
  bookingTotal: number,
  bookingType: 'venue' | 'caterer'
): Promise<{
  valid: boolean;
  discount: number;
  discountedTotal: number;
  message: string;
}> => {
  try {
    // Fetch all promotions that might match the code
    const { data, error } = await supabase
      .from('ContentTest')
      .select('*')
      .like('body', `%${promoCode}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Find a matching promotion
    let validPromotion = null;

    for (const item of data || []) {
      try {
        const promotionData = JSON.parse(item.body || '{}') as any;
        if (
          promotionData.type === 'promotion' &&
          promotionData.couponCode === promoCode &&
          promotionData.isActive &&
          (promotionData.applicableTo === 'all' || promotionData.applicableTo === bookingType) &&
          new Date(promotionData.validFrom) <= new Date() &&
          new Date(promotionData.validUntil) >= new Date()
        ) {
          validPromotion = {
            id: item.id,
            title: item.title || promotionData.title,
            description: promotionData.description || '',
            discount: promotionData.discount || 0,
            validFrom: new Date(promotionData.validFrom || item.created_at),
            validUntil: new Date(promotionData.validUntil || item.created_at),
            couponCode: promotionData.couponCode,
            isActive: promotionData.isActive,
            applicableTo: promotionData.applicableTo,
            minimumPurchase: promotionData.minimumPurchase || 0,
          };
          break;
        }
      } catch (_e) {
        // Error handling silently ignored
      }
    }

    if (!validPromotion) {
      return {
        valid: false,
        discount: 0,
        discountedTotal: bookingTotal,
        message: 'Invalid promotion code',
      };
    }

    if (validPromotion.minimumPurchase && bookingTotal < validPromotion.minimumPurchase) {
      return {
        valid: false,
        discount: 0,
        discountedTotal: bookingTotal,
        message: `Minimum purchase of $${validPromotion.minimumPurchase} required`,
      };
    }

    const discountAmount = (validPromotion.discount / 100) * bookingTotal;
    const discountedTotal = bookingTotal - discountAmount;

    return {
      valid: true,
      discount: discountAmount,
      discountedTotal,
      message: `${validPromotion.discount}% discount applied`,
    };
  } catch (error) {
    handleError(error, { promoCode, bookingTotal, bookingType }, 'Unable to apply promotion code');
    return {
      valid: false,
      discount: 0,
      discountedTotal: bookingTotal,
      message: 'An error occurred while processing your promotion code',
    };
  }
};

// Create a promotion (admin only)
export const createPromotion = async (
  promotion: Omit<PromotionData, 'id'>
): Promise<string | null> => {
  try {
    const promotionData = {
      type: 'promotion',
          ...promotion,
      createdAt: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('ContentTest')
      .insert({
        title: promotion.title,
        body: JSON.stringify(promotionData),
      })
      .select('id')
      .single();

    if (error) throw error;
    return data?.id || null;
  } catch (error) {
    handleError(error, { promotion }, 'Failed to create promotion');
    return null;
  }
};

// Update a promotion (admin only)
export const updatePromotion = async (
  id: string,
  data: Partial<PromotionData>
): Promise<boolean> => {
  try {
    // Get existing promotion
    const { data: existing, error: fetchError } = await supabase
      .from('ContentTest')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const existingData = JSON.parse(existing.body || '{}') as any;
    const updatedData = {
          ...existingData,
          ...data,
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('ContentTest')
      .update({
        title: data.title || existing.title,
        body: JSON.stringify(updatedData),
      })
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    handleError(error, { id, data }, 'Failed to update promotion');
    return false;
  }
};

// Delete a promotion (admin only)
export const deletePromotion = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from('ContentTest').delete().eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    handleError(error, { id }, 'Failed to delete promotion');
    return false;
  }
};
