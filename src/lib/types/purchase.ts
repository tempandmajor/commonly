import { Order } from './order';

export interface OrderDetails extends Order {
  totalAmount: number;
}

export interface PaymentDetails {
  amount: number;
  currency: string;
  description?: string | undefined;
  createdAt: string;
}

export interface PurchaseVerificationResult {
  isVerifying: boolean;
  verificationSuccess: boolean;
  orderDetails: OrderDetails | null;
  product: unknown; // TODO: Replace with proper Product type when available
  paymentDetails: PaymentDetails | null;
  eventId: string | null;
}
