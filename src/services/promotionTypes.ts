export interface PromotionCredit {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  remainingAmount: number;
  createdAt: Date;
  expiresAt: Date;
  reason: string;
  createdBy: string;
  status: 'active' | 'depleted' | 'expired';
}

export interface PromotionAnalytics {
  id: string;
  promotionId: string;
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
}
