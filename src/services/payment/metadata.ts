// Shared payment metadata definitions and helpers

export type PaymentMetadataBase = {
  userId?: string;
  paymentType?: 'event' | 'product' | 'donation' | 'platform_credit' | string;
  source?: 'web' | 'mobile' | string;
  timestamp?: string; // ISO string
  [key: string]: unknown;
};

export type EventPaymentMetadata = PaymentMetadataBase & {
  eventId: string;
  ticketTypeId?: string;
  quantity?: number;
  organizerId?: string;
  creatorId?: string; // For connected payouts
};

export type ProductPaymentMetadata = PaymentMetadataBase & {
  productId: string;
  variantId?: string;
  quantity?: number;
  vendorId?: string;
};

export function buildEventMetadata(input: Partial<EventPaymentMetadata>): EventPaymentMetadata {
  if (!input.eventId) throw new Error('eventId is required for event payments');
  return {
    paymentType: 'event',
    timestamp: new Date().toISOString(),
          ...input,
  } as EventPaymentMetadata;
}

export function buildProductMetadata(
  input: Partial<ProductPaymentMetadata>
): ProductPaymentMetadata {
  if (!input.productId) throw new Error('productId is required for product payments');
  return {
    paymentType: 'product',
    timestamp: new Date().toISOString(),
          ...input,
  } as ProductPaymentMetadata;
}

export function normalizePaymentMetadata(meta: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!meta || typeof meta !== 'object') return out;
  for (const [k, v] of Object.entries(meta as Record<string, unknown>)) {
    if (v == null) continue;
    // Stripe metadata requires string values
    out[k] = typeof v === 'string' ? v : JSON.stringify(v);
  }
  return out;
}
