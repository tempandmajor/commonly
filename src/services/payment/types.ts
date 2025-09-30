/**
 * Standard payment types supported by the application
 */
export type PaymentType =
  | 'subscription'
  | 'one-time'
  | 'donation'
  | 'product'
  | 'service'
  | 'event'
  | 'membership';

/**
 * Possible payment statuses
 */
export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded'
  | 'cancelled';

/**
 * Base payment options interface
 */
export interface PaymentOptions {
  amount: number;
  currency: string;
  paymentType: PaymentType;
  description?: string | undefined;
  isPlatformFee?: boolean | undefined;
  metadata?: Record<string, string> | undefined;
  userId?: string | undefined;
  redirectUrl?: string | undefined;
  successUrl?: string | undefined;
  cancelUrl?: string | undefined;
  status?: PaymentStatus | undefined;
  eventId?: string | undefined;
  isAllOrNothing?: boolean | undefined;
  creatorId?: string | undefined;
  customerId?: string | undefined;
  usePlatformCredit?: boolean | undefined;
  title?: string | undefined;
  productId?: string | undefined; // Added missing property
  customerEmail?: string | undefined; // Added missing property
  availableTickets?: number | undefined; // Added missing property
  pledgeDeadline?: string | undefined; // Added missing property
}

/**
 * Options specific to connected account payments
 */
export interface ConnectedPaymentOptions extends PaymentOptions {
  creatorId: string;
  customerId: string;
  status: PaymentStatus;
  usePlatformCredit?: boolean;
}

/**
 * Result of a payment operation
 */
export interface PaymentResult {
  success: boolean;
  error?: string | undefined;
  redirectUrl: string | null;
  transactionId?: string | undefined;
  paymentMethod?: string | undefined;
  url?: string | undefined;
}

/**
 * Data for creating a payment record
 */
/**
 * Payment Record Data
 * Represents the data structure for payment records in the database
 */
export interface PaymentRecordData {
  amount_in_cents: number;
  currency?: string | undefined;
  description?: string | undefined;
  user_id?: string | undefined;
  customer_id?: string | undefined;
  status: PaymentStatus;
  payment_method?: string | undefined;
  stripe_payment_id?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
  created_at?: string | undefined;
  updated_at?: string | undefined;

  // Fields for internal use, mapped to DB fields before saving
  amount?: number | undefined;
  userId?: string | undefined;
  customerId?: string | undefined;
  paymentMethod?: string | undefined;
  paymentIntentId?: string | undefined;

  // Additional metadata fields that will be stored in the metadata JSON
  creatorId?: string | undefined;
  eventId?: string | undefined;
}

/**
 * Payment verification result interface
 */
export interface PaymentVerificationResult {
  success: boolean;
  error?: string | undefined;
  paymentData?: unknown | undefined;
}
