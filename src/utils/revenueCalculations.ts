/**
 * Revenue Calculation Utilities
 * Handles platform fee calculations based on user type and Creator Program status
 */

export interface RevenueBreakdown {
  grossAmount: number;
  platformFee: number;
  platformFeePercentage: number;
  paymentProcessingFee: number;
  creatorEarnings: number;
  creatorEarningsPercentage: number;
}

export interface CreatorProgramStatus {
  isApproved: boolean;
  revenueSharePercentage?: number | undefined;
}

// Platform fee structure
export const PLATFORM_FEES = {
  REGULAR_USER: 0.2, // 20% for non-Creator Program members
  CREATOR_PROGRAM: 0.15, // 15% for Creator Program members
  PAYMENT_PROCESSING: 0.029, // ~3% for payment processing (Stripe)
} as const;

/**
 * Calculate revenue breakdown based on user's Creator Program status
 */
export function calculateRevenueBreakdown(
  grossAmount: number,
  creatorProgramStatus: CreatorProgramStatus
): RevenueBreakdown {
  // Determine platform fee based on Creator Program status
  const platformFeePercentage = creatorProgramStatus.isApproved
    ? PLATFORM_FEES.CREATOR_PROGRAM
    : PLATFORM_FEES.REGULAR_USER;

  // Calculate fees
  const platformFee = grossAmount * platformFeePercentage;
  const paymentProcessingFee = grossAmount * PLATFORM_FEES.PAYMENT_PROCESSING;
  const creatorEarnings = grossAmount - platformFee - paymentProcessingFee;
  const creatorEarningsPercentage = (creatorEarnings / grossAmount) * 100;

  return {
    grossAmount,
    platformFee,
    platformFeePercentage: platformFeePercentage * 100, // Convert to percentage
    paymentProcessingFee,
    creatorEarnings,
    creatorEarningsPercentage,
  };
}

/**
 * Calculate the financial benefit of joining Creator Program
 */
export function calculateCreatorProgramBenefit(grossAmount: number): {
  regularUserEarnings: number;
  creatorProgramEarnings: number;
  additionalEarnings: number;
  additionalEarningsPercentage: number;
} {
  const regularBreakdown = calculateRevenueBreakdown(grossAmount, { isApproved: false });
  const creatorBreakdown = calculateRevenueBreakdown(grossAmount, { isApproved: true });

  const additionalEarnings = creatorBreakdown.creatorEarnings - regularBreakdown.creatorEarnings;
  const additionalEarningsPercentage = (additionalEarnings / grossAmount) * 100;

  return {
    regularUserEarnings: regularBreakdown.creatorEarnings,
    creatorProgramEarnings: creatorBreakdown.creatorEarnings,
    additionalEarnings,
    additionalEarningsPercentage,
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Calculate annual earnings difference for Creator Program members
 */
export function calculateAnnualBenefit(monthlyRevenue: number): {
  regularUserAnnual: number;
  creatorProgramAnnual: number;
  annualSavings: number;
} {
  const monthlyBenefit = calculateCreatorProgramBenefit(monthlyRevenue);

  return {
    regularUserAnnual: monthlyBenefit.regularUserEarnings * 12,
    creatorProgramAnnual: monthlyBenefit.creatorProgramEarnings * 12,
    annualSavings: monthlyBenefit.additionalEarnings * 12,
  };
}

/**
 * Example calculations for documentation
 */
export const EXAMPLE_CALCULATIONS = {
  // $100 ticket example
  ticket100: {
    amount: 100,
    regular: calculateRevenueBreakdown(100, { isApproved: false }),
    creator: calculateRevenueBreakdown(100, { isApproved: true }),
    benefit: calculateCreatorProgramBenefit(100),
  },

  // $10,000 monthly revenue example
  monthly10k: {
    amount: 10000,
    regular: calculateRevenueBreakdown(10000, { isApproved: false }),
    creator: calculateRevenueBreakdown(10000, { isApproved: true }),
    benefit: calculateCreatorProgramBenefit(10000),
    annual: calculateAnnualBenefit(10000),
  },
} as const;
