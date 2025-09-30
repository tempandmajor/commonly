export interface WalletBalance {
  userId: string;
  available: number;
  pending: number;
  platformCredit: number;
  referralEarnings: number;
  currency: string;
  lastUpdated: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  description: string;
  status: TransactionStatus;
  createdAt: Date | string;
  metadata?: Record<string, unknown> | undefined;
  paymentMethodId?: string | undefined;
  relatedTransactionId?: string | undefined;
  updatedAt?: Date | undefined| string;
}

export type TransactionType =
  | 'deposit'
  | 'withdrawal'
  | 'transfer'
  | 'refund'
  | 'platform_credit'
  | 'referral'
  | 'referral_earning'
  | 'sponsorship_earning'
  | 'payment'
  | 'fee'
  | 'promotion'
  | 'credit';

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface TransactionFilter {
  search?: string | undefined;
  type?: TransactionType | undefined| TransactionType[];
  startDate?: string | undefined;
  endDate?: string | undefined;
  limit?: number | undefined;
  status?: TransactionStatus | undefined| TransactionStatus[];
  minAmount?: number | undefined;
  maxAmount?: number | undefined;
}

export interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  pendingReferrals: number;
  earnings: number;
  conversionRate: number;
  totalEarnings: number;
}

export interface PaymentMethod {
  id: string;
  type: string;
  brand?: string | undefined;
  last4?: string | undefined;
  expMonth?: number | undefined;
  expYear?: number | undefined;
  bankName?: string | undefined;
  accountLast4?: string | undefined;
  isDefault: boolean;
  createdAt: Date | string;
}

export interface FraudDetectionData {
  userId: string;
  transactionId: string;
  amount: number;
  timestamp: Date;
  ipAddress?: string | undefined;
  deviceInfo?: string | undefined;
  locationData?: string | undefined;
  risk: 'low' | 'medium' | 'high';
}

export interface SuspiciousActivity {
  id: string;
  userId: string;
  activityType: string;
  details: Record<string, unknown>;
  timestamp: Date;
  status: 'pending' | 'reviewed' | 'resolved' | 'flagged';
  resolutionNotes?: string | undefined;
}
