import * as z from 'zod';
import { commonValidations } from './shared';

// Payment method types
export const paymentMethodTypes = ['card', 'bank', 'wallet', 'crypto'] as const;
export const walletTypes = ['apple_pay', 'google_pay', 'paypal'] as const;

// Billing address schema
export const billingAddressSchema = z.object({
  line1: commonValidations.requiredString('Address line 1', 1, 200) as string,
  line2: z.string().max(200).optional(),
  city: commonValidations.requiredString('City', 1, 100) as string,
  state: commonValidations.requiredString('State/Province', 1, 100) as string,
  postalCode: commonValidations.requiredString('Postal code', 1, 20) as string,
  country: commonValidations.requiredString('Country', 2, 2) as string, // ISO country code
});

export type BillingAddressFormValues = z.infer<typeof billingAddressSchema>;

// Credit card schema
export const creditCardSchema = z.object({
  cardNumber: z
    .string()
    .regex(/^\d{13,19}$/, 'Invalid card number')
    .transform(val => val.replace(/\s/g, '')),
  cardholderName: commonValidations.requiredString('Cardholder name', 2, 100) as string,
  expiryMonth: z.string().regex(/^(0[1-9]|1[0-2])$/, 'Invalid month'),
  expiryYear: z.string().regex(/^\d{2}$/, 'Invalid year'),
  cvv: z.string().regex(/^\d{3,4}$/, 'Invalid CVV'),
  saveCard: commonValidations.booleanWithDefault(false),
});

export type CreditCardFormValues = z.infer<typeof creditCardSchema>;

// Checkout schema
export const checkoutSchema = z
  .object({
    // Payment information
    paymentMethod: z.enum(paymentMethodTypes),
    savedPaymentMethodId: z.string().optional(),
    newCard: creditCardSchema.optional(),
    walletType: z.enum(walletTypes).optional(),

    // Billing information
    billingAddress: billingAddressSchema,
    useShippingAsBilling: commonValidations.booleanWithDefault(true),

    // Order information
    items: z
      .array(
        z.object({
          id: z.string(),
          name: z.string(),
          quantity: z.number().min(1),
          price: z.number().min(0),
          type: z.enum(['ticket', 'product', 'subscription', 'credit']),
        })
      )
      .min(1, 'At least one item is required'),

    // Pricing
    subtotal: z.number().min(0),
    tax: z.number().min(0).default(0),
    discount: z.number().min(0).default(0),
    platformFee: z.number().min(0).default(0),
    total: z.number().min(0),

    // Additional options
    tipAmount: z.number().min(0).default(0),
    giftMessage: z.string().max(500).optional(),
    promoCode: z.string().max(50).optional(),

    // Terms acceptance
    acceptTerms: z.boolean().refine(val => val === true, {
      message: 'You must accept the terms and conditions',
    }),
    acceptRefundPolicy: z.boolean().refine(val => val === true, {
      message: 'You must accept the refund policy',
    }),

    // Contact preferences
    receiveReceipt: commonValidations.booleanWithDefault(true),
    receiveUpdates: commonValidations.booleanWithDefault(false),
  })
  .refine(
    data => {
      // Validate total calculation
      const calculatedTotal =
        data.subtotal + data.tax + data.platformFee + data.tipAmount - data.discount;
      return Math.abs(calculatedTotal - data.total) < 0.01; // Allow for small rounding differences
    },
    {
      message: "Total amount doesn't match calculation",
      path: ['total'],
    }
  );

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;

// Quick checkout schema (for single items)
export const quickCheckoutSchema = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
  itemType: z.enum(['ticket', 'product', 'subscription', 'credit']),
  quantity: z.number().min(1).default(1),
  paymentMethodId: z.string().min(1, 'Payment method is required'),
  savePaymentMethod: commonValidations.booleanWithDefault(false),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms',
  }),
});

export type QuickCheckoutFormValues = z.infer<typeof quickCheckoutSchema>;

// Subscription checkout schema
export const subscriptionCheckoutSchema = z.object({
  planId: z.string().min(1, 'Plan ID is required'),
  billingCycle: z.enum(['monthly', 'yearly']),
  paymentMethod: creditCardSchema,
  billingAddress: billingAddressSchema,
  startDate: z.date().optional(),
  promoCode: z.string().optional(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept the subscription terms',
  }),
  autoRenew: commonValidations.booleanWithDefault(true),
});

export type SubscriptionCheckoutFormValues = z.infer<typeof subscriptionCheckoutSchema>;

// Credit purchase schema
export const creditPurchaseSchema = z.object({
  amount: z.number().min(5, 'Minimum purchase is $5').max(1000, 'Maximum purchase is $1000'),
  customAmount: z.boolean().default(false),
  bonusCredits: z.number().min(0).default(0),
  paymentMethod: z.enum(paymentMethodTypes),
  paymentDetails: creditCardSchema.optional(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms',
  }),
});

export type CreditPurchaseFormValues = z.infer<typeof creditPurchaseSchema>;

// All-or-nothing pledge schema
export const pledgeSchema = z
  .object({
    eventId: z.string().min(1, 'Event ID is required'),
    pledgeAmount: z.number().min(1, 'Pledge amount must be at least $1'),
    ticketQuantity: z.number().min(1).default(1),
    paymentMethod: z.string().min(1, 'Payment method is required'),

    // Pledge specific
    maxPledgeAmount: z.number().optional(),
    allowOverpledge: commonValidations.booleanWithDefault(false),
    anonymousPledge: commonValidations.booleanWithDefault(false),

    // Contact preferences
    notifyOnSuccess: commonValidations.booleanWithDefault(true),
    notifyOnFailure: commonValidations.booleanWithDefault(true),

    // Terms
    understandPledgeTerms: z.boolean().refine(val => val === true, {
      message: 'You must understand that you will only be charged if the event reaches its goal',
    }),
    acceptCancellationPolicy: z.boolean().refine(val => val === true, {
      message: 'You must accept the cancellation policy',
    }),
  })
  .refine(
    data => {
      if (data.maxPledgeAmount && !data.allowOverpledge) {
        return data.pledgeAmount <= data.maxPledgeAmount;
      }
      return true;
    },
    {
      message: 'Pledge amount exceeds maximum allowed',
      path: ['pledgeAmount'],
    }
  );

export type PledgeFormValues = z.infer<typeof pledgeSchema>;

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

export const getCardType = (number: string): string => {
  const cleaned = number.replace(/\s/g, '');

  const patterns = {
    visa: /^4/,
    mastercard: /^5[1-5]/,
    amex: /^3[47]/,
    discover: /^6(?:011|5)/,
  };

  for (const [type, pattern] of Object.entries(patterns)) {
    if (pattern.test(cleaned)) {
      return type;
    }
  }

  return 'unknown';
};

// Default values
export const checkoutDefaults: Partial<CheckoutFormValues> = {
  paymentMethod: 'card',
  items: [],
  subtotal: 0,
  tax: 0,
  discount: 0,
  platformFee: 0,
  total: 0,
  tipAmount: 0,
  useShippingAsBilling: true,
  acceptTerms: false,
  acceptRefundPolicy: false,
  receiveReceipt: true,
  receiveUpdates: false,
};

export const quickCheckoutDefaults: Partial<QuickCheckoutFormValues> = {
  quantity: 1,
  savePaymentMethod: false,
  acceptTerms: false,
};

export const pledgeDefaults: Partial<PledgeFormValues> = {
  ticketQuantity: 1,
  allowOverpledge: false,
  anonymousPledge: false,
  notifyOnSuccess: true,
  notifyOnFailure: true,
  understandPledgeTerms: false,
  acceptCancellationPolicy: false,
};
