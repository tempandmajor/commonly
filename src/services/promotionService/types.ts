export interface PromotionStats {
  impressions: number;
  clicks: number;
  conversions: number;
  spent: number;
  engagements: number;
}

export interface PromotionSettings {
  targetId: string;
  title: string;
  description: string;
  budget: number;
  dailyBudgetLimit?: number | undefined;
  startDate: Date;
  endDate: Date | null;
  type: string;
  bidAmount: number;
  status: string;
  stats: PromotionStats;
  createdBy: string;
  createdAt: Date;
}
