export interface ReferralCode {
  userId: string;
  code: string;
  createdAt: string;
}

export interface ReferralStats {
  totalReferrals: number;
  totalEarnings: number;
  pendingReferrals: number;
}

export interface ReferralTransaction {
  referrerUserId: string;
  referredUserId: string;
  amount: number;
  status: 'pending' | 'completed';
  timestamp: string;
}
