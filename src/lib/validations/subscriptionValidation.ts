import { z } from 'zod';

// Subscription plans
export const subscriptionPlans = ['free', 'starter', 'pro', 'enterprise'] as const;
export const billingCycles = ['monthly', 'quarterly', 'yearly'] as const;
export const paymentMethods = ['card', 'paypal', 'bank-transfer', 'crypto'] as const;
export const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'] as const;

// Plan selection schema
export const planSelectionSchema = z.object({
  plan: z.enum(subscriptionPlans),

  billingCycle: z.enum(billingCycles).default('monthly'),

  currency: z.enum(currencies).default('USD'),

  quantity: z.number().min(1).max(100).default(1),

  addons: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        quantity: z.number().min(1).default(1),
        price: z.number(),
      })
    )
    .optional(),

  promoCode: z.string().optional(),

  autoRenew: z.boolean().default(true),

  startDate: z.date().optional(),
});

// Payment method schemas
export const cardPaymentSchema = z.object({
  type: z.literal('card'),

  cardNumber: z
    .string()
    .regex(/^\d{13,19}$/, 'Invalid card number')
    .transform(val => val.replace(/\s/g, '')),

  cardholderName: z
    .string()
    .min(2, 'Cardholder name is required')
    .max(50, 'Cardholder name too long'),

  expiryMonth: z.string().regex(/^(0[1-9]|1[0-2])$/, 'Invalid month'),

  expiryYear: z.string().regex(/^\d{2}$/, 'Invalid year'),

  cvv: z.string().regex(/^\d{3,4}$/, 'Invalid CVV'),

  saveCard: z.boolean().default(false),

  billingAddress: z.object({
    line1: z.string().min(1, 'Address is required'),
    line2: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State/Province is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
    country: z.string().min(2).max(2, 'Use 2-letter country code'),
  }),
});

export const paypalPaymentSchema = z.object({
  type: z.literal('paypal'),
  email: z.string().email('Invalid PayPal email'),
  saveAccount: z.boolean().default(false),
});

export const bankTransferSchema = z.object({
  type: z.literal('bank-transfer'),
  accountName: z.string().min(2, 'Account name is required'),
  accountNumber: z.string().min(8, 'Account number is required'),
  routingNumber: z.string().min(9).max(9, 'Routing number must be 9 digits'),
  accountType: z.enum(['checking', 'savings']),
  saveAccount: z.boolean().default(false),
});

export const cryptoPaymentSchema = z.object({
  type: z.literal('crypto'),
  currency: z.enum(['BTC', 'ETH', 'USDT', 'USDC']),
  walletAddress: z.string().min(20, 'Invalid wallet address'),
});

// Combined payment schema
export const paymentMethodSchema = z.discriminatedUnion('type', [
  cardPaymentSchema,
  paypalPaymentSchema,
  bankTransferSchema,
  cryptoPaymentSchema,
]);

// Subscription update schema
export const subscriptionUpdateSchema = z.object({
  action: z.enum(['upgrade', 'downgrade', 'cancel', 'pause', 'resume']),

  newPlan: z.enum(subscriptionPlans).optional(),

  newBillingCycle: z.enum(billingCycles).optional(),

  effectiveDate: z.enum(['immediate', 'end-of-cycle', 'custom']).default('end-of-cycle'),

  customDate: z.date().optional(),

  reason: z.string().max(500).optional(),

  feedback: z
    .object({
      rating: z.number().min(1).max(5).optional(),
      improvements: z.array(z.string()).optional(),
      wouldRecommend: z.boolean().optional(),
    })
    .optional(),
});

// Billing information update schema
export const billingInfoSchema = z.object({
  companyName: z.string().optional(),

  taxId: z.string().optional(),

  billingEmail: z.string().email('Invalid email'),

  billingAddress: z.object({
    line1: z.string().min(1, 'Address is required'),
    line2: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State/Province is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
    country: z.string().min(2).max(2, 'Use 2-letter country code'),
  }),

  invoicePreferences: z.object({
    frequency: z.enum(['per-transaction', 'monthly', 'quarterly']).default('monthly'),
    format: z.enum(['pdf', 'csv', 'xml']).default('pdf'),
    includeDetails: z.boolean().default(true),
  }),
});

// Usage limits schema
export const usageLimitsSchema = z.object({
  notifyAt: z.array(z.number().min(0).max(100)).default([80, 90, 100]),

  hardLimit: z.boolean().default(true),

  autoUpgrade: z.boolean().default(false),

  upgradeThreshold: z.number().min(80).max(100).optional(),

  notificationEmails: z.array(z.string().email()).max(5),
});

// Subscription preferences schema
export const subscriptionPreferencesSchema = z.object({
  autoRenew: z.boolean().default(true),

  reminderDays: z.number().min(0).max(30).default(7),

  paymentRetries: z.number().min(1).max(5).default(3),

  backupPaymentMethod: z.string().optional(),

  notifications: z.object({
    paymentSuccess: z.boolean().default(true),
    paymentFailed: z.boolean().default(true),
    subscriptionChanges: z.boolean().default(true),
    usageAlerts: z.boolean().default(true),
    productUpdates: z.boolean().default(false),
  }),
});

// Default values
export const planSelectionDefaults = {
  plan: 'free' as const,
  billingCycle: 'monthly' as const,
  currency: 'USD' as const,
  quantity: 1,
  autoRenew: true,
  addons: [],
};

export const cardPaymentDefaults = {
  type: 'card' as const,
  saveCard: false,
};

export const subscriptionUpdateDefaults = {
  effectiveDate: 'end-of-cycle' as const,
};

export const billingInfoDefaults = {
  invoicePreferences: {
    frequency: 'monthly' as const,
    format: 'pdf' as const,
    includeDetails: true,
  },
};

export const usageLimitsDefaults = {
  notifyAt: [80, 90, 100],
  hardLimit: true,
  autoUpgrade: false,
  notificationEmails: [],
};

export const subscriptionPreferencesDefaults = {
  autoRenew: true,
  reminderDays: 7,
  paymentRetries: 3,
  notifications: {
    paymentSuccess: true,
    paymentFailed: true,
    subscriptionChanges: true,
    usageAlerts: true,
    productUpdates: false,
  },
};

// Type exports
export type PlanSelectionFormValues = z.infer<typeof planSelectionSchema>;
export type PaymentMethodFormValues = z.infer<typeof paymentMethodSchema>;
export type SubscriptionUpdateFormValues = z.infer<typeof subscriptionUpdateSchema>;
export type BillingInfoFormValues = z.infer<typeof billingInfoSchema>;
export type UsageLimitsFormValues = z.infer<typeof usageLimitsSchema>;
export type SubscriptionPreferencesFormValues = z.infer<typeof subscriptionPreferencesSchema>;

// Helper functions
export const formatCardNumber = (value: string): string => {
  const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
  const matches = v.match(/\d{4,16}/g);
  const match = (matches && matches[0]) || '';
  const parts = [];

  for (let i = 0, len = match.length; i < len; i += 4) {
    parts.push(match.substring(i, i + 4));
  }

  if (parts.length) {
    return parts.join(' ');
  } else {
    return value;
  }
};

export const validateCardNumber = (cardNumber: string): boolean => {
  // Luhn algorithm
  const digits = cardNumber.replace(/\D/g, '');
  let sum = 0;
  let shouldDouble = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
};

export const getCardType = (cardNumber: string): string => {
  const patterns = {
    visa: /^4/,
    mastercard: /^5[1-5]/,
    amex: /^3[47]/,
    discover: /^6(?:011|5)/,
  };

  const number = cardNumber.replace(/\D/g, '');

  for (const [type, pattern] of Object.entries(patterns)) {
    if (pattern.test(number)) return type;
  }

  return 'unknown';
};

export const calculatePricing = (
  plan: string,
  billingCycle: string,
  quantity: number,
  addons: unknown[] = []
): { subtotal: number; discount: number; tax: number; total: number } => {
  // Mock pricing calculation
  const basePrices: Record<string, Record<string, number>> = {
    free: { monthly: 0, quarterly: 0, yearly: 0 },
    starter: { monthly: 29, quarterly: 78, yearly: 290 },
    pro: { monthly: 79, quarterly: 213, yearly: 790 },
    enterprise: { monthly: 299, quarterly: 807, yearly: 2990 },
  };

  const basePrice = basePrices[plan]?.[billingCycle] || 0;
  const addonTotal = addons.reduce((sum, addon) => sum + addon.price * addon.quantity, 0);
  const subtotal = basePrice * quantity + addonTotal;

  // Calculate discount based on billing cycle
  let discount = 0;
  if (billingCycle === 'quarterly') discount = subtotal * 0.1;
  if (billingCycle === 'yearly') discount = subtotal * 0.2;

  const tax = (subtotal - discount) * 0.1; // 10% tax
  const total = subtotal - discount + tax;

  return { subtotal, discount, tax, total };
};
