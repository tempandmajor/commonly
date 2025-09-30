export interface PromotionSettings {
  id: string;
  title: string;
  status: 'active' | 'paused' | 'completed' | 'pending' | 'rejected';
  budget: number;
  targetAudience: string;
  description?: string | undefined;
  startDate?: string | undefined;
  endDate?: string | undefined;
  createdAt?: string | undefined;
  updatedAt?: string | undefined;
  targetId?: string | undefined;
  createdBy?: string | undefined;
  type?: 'event' | undefined| 'venue' | 'artist' | 'post' | 'caterer';
  userId?: string | undefined;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  budget: number;
  status: 'active' | 'paused' | 'completed' | 'pending' | 'rejected';
  targetAudience: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  targetId?: string | undefined;
  createdBy?: string | undefined;
  type?: 'event' | undefined| 'venue' | 'artist' | 'post' | 'caterer';
  userId?: string | undefined;
}

export interface ContentPromotion {
  id: string;
  promotionId: string;
  contentId: string;
  contentType: 'event' | 'podcast' | 'product';
  priority: number;
  createdAt: string;
}

export interface PromotionAnalytics {
  impressions: number;
  clicks: number;
  conversions: number;
  cost: number;
  ctr: number;
  cpc: number;
  roas: number;
}
