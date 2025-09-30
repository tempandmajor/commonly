import * as z from 'zod';
import { commonValidations } from './shared';

// Transfer types
export const transferTypes = ['credits', 'funds', 'both'] as const;
export const transferMethods = ['username', 'email', 'userId', 'qrCode'] as const;

// Base transfer schema
const baseTransferSchema = z.object({
  amount: z
    .number()
    .min(0.01, 'Minimum transfer amount is $0.01')
    .max(10000, 'Maximum transfer amount is $10,000')
    .multipleOf(0.01, 'Amount must be in increments of $0.01'),

  description: z.string().max(500, 'Description must be less than 500 characters').optional(),

  note: z.string().max(200, 'Note must be less than 200 characters').optional(),

  isGift: commonValidations.booleanWithDefault(false),
  isAnonymous: commonValidations.booleanWithDefault(false),

  // Security
  confirmAmount: z.number(),
  pin: z
    .string()
    .length(4, 'PIN must be 4 digits')
    .regex(/^\d+$/, 'PIN must contain only numbers')
    .optional(),
  twoFactorCode: z
    .string()
    .length(6, 'Code must be 6 digits')
    .regex(/^\d+$/, 'Code must contain only numbers')
    .optional(),
});

// Credit transfer schema
export const creditTransferSchema = baseTransferSchema
  .extend({
    transferType: z.literal('credits'),
    recipientMethod: z.enum(transferMethods),
    recipientIdentifier: z.string().min(1, 'Recipient is required'),

    // Credit specific
    creditType: z.enum(['platform', 'promotional', 'auto']).default('platform'),
    expiryDate: z.date().optional(),
    restrictedTo: z.array(z.string()).optional(), // Event IDs, Product IDs, etc

    // Validation based on method
  })
  .refine(data => data.amount === data.confirmAmount, {
    message: "Amounts don't match",
    path: ['confirmAmount'],
  })
  .refine(
    data => {
      switch (data.recipientMethod) {
        case 'email':
          return commonValidations.email.safeParse(data.recipientIdentifier).success;
        case 'username':
          return data.recipientIdentifier.length >= 3;
        case 'userId':
          return data.recipientIdentifier.length > 0;
        case 'qrCode':
          return data.recipientIdentifier.length > 0;
        default:
          return false;
      }
    },
    {
      message: 'Invalid recipient identifier for selected method',
      path: ['recipientIdentifier'],
    }
  );

export type CreditTransferFormValues = z.infer<typeof creditTransferSchema>;

// Funds transfer schema
export const fundsTransferSchema = baseTransferSchema
  .extend({
    transferType: z.literal('funds'),
    recipientMethod: z.enum(transferMethods),
    recipientIdentifier: z.string().min(1, 'Recipient is required'),

    // Funds specific
    currency: z.string().default('USD'),
    transferSpeed: z.enum(['instant', 'standard', 'scheduled']).default('instant'),
    scheduledDate: z.date().optional(),

    // Fees
    includeFees: commonValidations.booleanWithDefault(true),
    feeAmount: z.number().min(0).default(0),
    totalAmount: z.number().min(0),
  })
  .refine(
    data => {
      if (data.transferSpeed === 'scheduled' && !data.scheduledDate) {
        return false;
      }
      return true;
    },
    {
      message: 'Scheduled date is required for scheduled transfers',
      path: ['scheduledDate'],
    }
  )
  .refine(
    data => {
      const expectedTotal = data.includeFees ? data.amount + data.feeAmount : data.amount;
      return Math.abs(expectedTotal - data.totalAmount) < 0.01;
    },
    {
      message: "Total amount doesn't match calculation",
      path: ['totalAmount'],
    }
  );

export type FundsTransferFormValues = z.infer<typeof fundsTransferSchema>;

// Combined transfer schema (credits + funds)
export const combinedTransferSchema = baseTransferSchema
  .extend({
    transferType: z.literal('both'),
    recipientMethod: z.enum(transferMethods),
    recipientIdentifier: z.string().min(1, 'Recipient is required'),

    // Split amounts
    creditAmount: z.number().min(0).default(0),
    fundsAmount: z.number().min(0).default(0),

    // Options from both types
    creditType: z.enum(['platform', 'promotional', 'auto']).default('platform'),
    currency: z.string().default('USD'),
    transferSpeed: z.enum(['instant', 'standard']).default('instant'),

    // Fees
    includeFees: commonValidations.booleanWithDefault(true),
    feeAmount: z.number().min(0).default(0),
    totalAmount: z.number().min(0),
  })
  .refine(
    data => {
      return data.creditAmount + data.fundsAmount === data.amount;
    },
    {
      message: 'Credit and funds amounts must equal total amount',
      path: ['amount'],
    }
  );

export type CombinedTransferFormValues = z.infer<typeof combinedTransferSchema>;

// Bulk transfer schema
export const bulkTransferSchema = z
  .object({
    transferType: z.enum(transferTypes),
    recipients: z
      .array(
        z.object({
          method: z.enum(transferMethods),
          identifier: z.string().min(1),
          amount: z.number().min(0.01),
          note: z.string().max(200).optional(),
          isValid: z.boolean().default(true),
          error: z.string().optional(),
        })
      )
      .min(1, 'At least one recipient is required')
      .max(100, 'Maximum 100 recipients allowed'),

    // Bulk options
    totalAmount: z.number().min(0),
    splitEvenly: commonValidations.booleanWithDefault(false),
    includeFees: commonValidations.booleanWithDefault(true),
    feeAmount: z.number().min(0).default(0),

    // Common fields
    description: z.string().max(500).optional(),
    isGift: commonValidations.booleanWithDefault(false),

    // Scheduling
    transferSpeed: z.enum(['instant', 'scheduled']).default('instant'),
    scheduledDate: z.date().optional(),

    // Security
    confirmTotalAmount: z.number(),
    pin: z.string().length(4).regex(/^\d+$/).optional(),
  })
  .refine(
    data => {
      const calculatedTotal = data.recipients.reduce((sum, r) => sum + r.amount, 0);
      return Math.abs(calculatedTotal - data.totalAmount) < 0.01;
    },
    {
      message: "Sum of individual amounts doesn't match total",
      path: ['totalAmount'],
    }
  )
  .refine(data => data.totalAmount === data.confirmTotalAmount, {
    message: "Total amounts don't match",
    path: ['confirmTotalAmount'],
  });

export type BulkTransferFormValues = z.infer<typeof bulkTransferSchema>;

// Request money schema
export const requestMoneySchema = z.object({
  requestType: z.enum(['credits', 'funds']),
  amount: z
    .number()
    .min(0.01, 'Minimum request amount is $0.01')
    .max(5000, 'Maximum request amount is $5,000'),

  // Request from
  requestMethod: z.enum(['username', 'email', 'multiple']),
  requestFrom: z.string().min(1, 'Recipient is required'),
  multipleRecipients: z.array(z.string()).max(10, 'Maximum 10 recipients').optional(),

  // Details
  reason: commonValidations.requiredString('Reason', 10, 500) as string,
  dueDate: z.date().optional(),

  // Options
  allowPartialPayment: commonValidations.booleanWithDefault(false),
  sendReminder: commonValidations.booleanWithDefault(true),
  reminderFrequency: z.enum(['daily', 'weekly', 'once']).default('weekly'),

  // Attachments
  attachments: z.array(commonValidations.imageUrl).max(3).optional(),
});

export type RequestMoneyFormValues = z.infer<typeof requestMoneySchema>;

// Transfer limits schema
export const transferLimitsSchema = z.object({
  dailyLimit: z.number().min(0),
  weeklyLimit: z.number().min(0),
  monthlyLimit: z.number().min(0),
  perTransactionLimit: z.number().min(0),
  requirePinAbove: z.number().min(0),
  require2FAAbove: z.number().min(0),
});

export type TransferLimitsFormValues = z.infer<typeof transferLimitsSchema>;

// Helper functions
export const calculateTransferFee = (
  amount: number,
  type: 'instant' | 'standard' | 'scheduled'
): number => {
  if (type === 'standard' || type === 'scheduled') return 0;

  // Instant transfer fees
  if (amount <= 10) return 0.25;
  if (amount <= 100) return amount * 0.015; // 1.5%
  if (amount <= 1000) return amount * 0.01; // 1%
  return amount * 0.005; // 0.5% for large amounts
};

export const validateRecipient = async (
  method: string,
  identifier: string
): Promise<{
  isValid: boolean;
  userId?: string;
  displayName?: string;
  error?: string;
}> => {
  // This would call an API to validate the recipient
  // Mock implementation for now
  if (!identifier) {
    return { isValid: false, error: 'Recipient is required' };
  }

  switch (method) {
    case 'email':
      if (!commonValidations.email.safeParse(identifier).success) {
        return { isValid: false, error: 'Invalid email address' };
      }
      break;
    case 'username':
      if (identifier.length < 3) {
        return { isValid: false, error: 'Username too short' };
      }
      break;
  }

  // Mock successful validation
  return {
    isValid: true,
    userId: 'user123',
    displayName: 'John Doe',
  };
};

// Default values
export const creditTransferDefaults: Partial<CreditTransferFormValues> = {
  transferType: 'credits',
  recipientMethod: 'username',
  amount: 0,
  confirmAmount: 0,
  creditType: 'platform',
  isGift: false,
  isAnonymous: false,
};

export const fundsTransferDefaults: Partial<FundsTransferFormValues> = {
  transferType: 'funds',
  recipientMethod: 'username',
  amount: 0,
  confirmAmount: 0,
  currency: 'USD',
  transferSpeed: 'instant',
  includeFees: true,
  feeAmount: 0,
  totalAmount: 0,
  isGift: false,
  isAnonymous: false,
};

export const requestMoneyDefaults: Partial<RequestMoneyFormValues> = {
  requestType: 'funds',
  requestMethod: 'username',
  amount: 0,
  allowPartialPayment: false,
  sendReminder: true,
  reminderFrequency: 'weekly',
};
