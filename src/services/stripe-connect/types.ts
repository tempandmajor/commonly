/**
 * Types for Stripe Connect functionality
 */

export interface TransferOptions {
  amount: number;
  currency?: string | undefined;
  creatorId: string;
  description?: string | undefined;
  metadata?: Record<string, string> | undefined;
}

export interface TransferResult {
  success: boolean;
  transferId?: string | undefined;
  error?: string | undefined;
}

/**
 * Types for Stripe Connect integration with Creator Program support
 */

export interface StripeConnectAccount {
  id: string;
  object: string;
  business_profile: {
    name?: string | undefined;
    url?: string | undefined;
  };
  capabilities: {
    card_payments?: string;
    transfers?: string;
  };
  charges_enabled: boolean;
  country: string;
  created: number;
  default_currency: string;
  details_submitted: boolean;
  email?: string;
  payouts_enabled: boolean;
  type: string;
}

// Platform fee configuration with Creator Program support
export const PLATFORM_FEE_PERCENT = 20; // Default for regular users (20%)
export const CREATOR_PROGRAM_FEE_PERCENT = 15; // Reduced fee for Creator Program members (15%)

export interface PaymentIntentOptions {
  amount: number;
  currency: string;
  customerId: string;
  paymentMethodId: string;
  connectedAccountId: string;
  applicationFeeAmount?: number | undefined;
  isCreatorProgram?: boolean | undefined;
  metadata?: Record<string, string> | undefined;
}

export interface ConnectPaymentResult {
  success: boolean;
  paymentIntentId?: string | undefined;
  status?: string | undefined;
  amount?: number | undefined;
  platformFee?: number | undefined;
  platformFeePercent?: number | undefined;
  creatorEarnings?: number | undefined;
  isCreatorProgram?: boolean | undefined;
  currency?: string | undefined;
  error?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
}
