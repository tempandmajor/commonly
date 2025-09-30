import { PaymentStatus, PaymentType } from './types';

/**
 * Options specific to platform credit payments
 */
export interface CreditPaymentOptions {
  amount: number;
  currency: string;
  paymentType: PaymentType;
  description: string;
  isPlatformFee: boolean;
  metadata?: Record<string, string> | undefined;
  customerId?: string | undefined;
  status: PaymentStatus;
  userId?: string | undefined;
  title?: string | undefined;
}
