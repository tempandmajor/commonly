export interface Order {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  totalPrice: number;
  status: 'pending' | 'fulfilled' | 'cancelled' | 'returned';
  createdAt: string;
}

export interface PurchaseProductParams {
  productId: string;
  userId?: string | undefined;
  quantity: number;
  customerEmail?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
}

export interface PurchaseResult {
  success: boolean;
  url?: string | undefined;
  error?: string | undefined;
}

// Fulfillment lifecycle aligned with Printify + backend migration
export type FulfillmentStatus =
  | 'submitted'
  | 'in_production'
  | 'shipped'
  | 'cancelled'
  | 'submission_failed';

// Extend Order with optional fulfillment fields used by UI
export interface Order {
  // existing fields above retained
  fulfillment_status?: FulfillmentStatus | undefined| null;
  fulfillment_ref?: string | undefined| null;
  tracking_number?: string | undefined| null;
  carrier?: string | undefined| null;
  tracking_url?: string | undefined| null;
  fulfillment_error?: string | undefined| null;
  shipped_at?: string | undefined| null;
}
