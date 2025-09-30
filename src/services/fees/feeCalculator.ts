/**
 * Fee Calculator Service
 * Handles all fee calculations for the platform including platform fees and Stripe fees
 * Now supports Creator Program dynamic fee structure
 */

// Platform fee configuration - now supports Creator Program
export const PLATFORM_FEE_PERCENT = 20; // Default for regular users (20%)
export const CREATOR_PROGRAM_FEE_PERCENT = 15; // Reduced fee for Creator Program members (15%)
export const STRIPE_FEE_PERCENT = 2.9;
export const STRIPE_FIXED_FEE = 0.3;

export interface FeeBreakdown {
  subtotal: number;
  platformFee: number;
  platformFeePercentage: number;
  stripeFee: number;
  totalFees: number;
  total: number;
  netToCreator: number;
  isCreatorProgram: boolean;
}

export interface FeeCalculationOptions {
  amount: number;
  currency?: string | undefined;
  isPlatformFee?: boolean | undefined; // If true, this is already a platform fee payment
  includeStripeFees?: boolean | undefined; // Whether to include Stripe processing fees
  isCreatorProgram?: boolean | undefined; // Whether user is in Creator Program
  creatorId?: string | undefined; // Creator ID to check program status
}

/**
 * Calculate comprehensive fee breakdown for a transaction
 */
export const calculateFees = (options: FeeCalculationOptions): FeeBreakdown => {
  const {
    amount,
    isPlatformFee = false,
    includeStripeFees = true,
    isCreatorProgram = false,
  } = options;

  // Determine platform fee percentage based on Creator Program status
  const platformFeePercentage = isCreatorProgram
    ? CREATOR_PROGRAM_FEE_PERCENT
    : PLATFORM_FEE_PERCENT;

  // If this is already a platform fee payment, don't add additional platform fees
  const platformFee = isPlatformFee ? 0 : (amount * platformFeePercentage) / 100;

  // Calculate Stripe fees if requested
  const stripeFee = includeStripeFees ? (amount * STRIPE_FEE_PERCENT) / 100 + STRIPE_FIXED_FEE : 0;

  const totalFees = platformFee + stripeFee;
  const total = amount + totalFees;
  const netToCreator = amount - platformFee; // Creator gets amount minus platform fee

  return {
    subtotal: amount,
    platformFee: Math.round(platformFee * 100) / 100, // Round to 2 decimal places
    platformFeePercentage,
    stripeFee: Math.round(stripeFee * 100) / 100,
    totalFees: Math.round(totalFees * 100) / 100,
    total: Math.round(total * 100) / 100,
    netToCreator: Math.round(netToCreator * 100) / 100,
    isCreatorProgram,
  };
};

/**
 * Calculate platform fee for Stripe Connect with Creator Program support
 * This is the amount that goes to the platform from a connected account transaction
 */
export const calculateStripePlatformFee = (amount: number, isCreatorProgram = false): number => {
  const feePercentage = isCreatorProgram ? CREATOR_PROGRAM_FEE_PERCENT : PLATFORM_FEE_PERCENT;
  const feeAmount = (amount * feePercentage) / 100;
  return Math.round(feeAmount * 100); // Return in cents for Stripe
};

/**
 * Calculate total amount including all fees that customer will pay
 */
export const calculateTotalWithFees = (
  baseAmount: number,
  isPlatformFee = false,
  isCreatorProgram = false
): number => {
  const fees = calculateFees({ amount: baseAmount, isPlatformFee, isCreatorProgram });
  return fees.total;
};

/**
 * Calculate what the creator will receive after platform fees
 */
export const calculateCreatorEarnings = (grossAmount: number, isCreatorProgram = false): number => {
  const fees = calculateFees({ amount: grossAmount, includeStripeFees: false, isCreatorProgram });
  return fees.netToCreator;
};

/**
 * Format fee breakdown for display
 */
export const formatFeeBreakdown = (breakdown: FeeBreakdown) => {
  return {
    subtotal: `$${breakdown.subtotal.toFixed(2)}`,
    platformFee: `$${breakdown.platformFee.toFixed(2)} (${breakdown.platformFeePercentage}%)`,
    stripeFee: `$${breakdown.stripeFee.toFixed(2)} (${STRIPE_FEE_PERCENT}% + $${STRIPE_FIXED_FEE})`,
    totalFees: `$${breakdown.totalFees.toFixed(2)}`,
    total: `$${breakdown.total.toFixed(2)}`,
    netToCreator: `$${breakdown.netToCreator.toFixed(2)}`,
    creatorProgramStatus: breakdown.isCreatorProgram ? 'Creator Program Member' : 'Regular User',
  };
};

/**
 * Validate fee calculations
 */
export const validateFeeCalculation = (breakdown: FeeBreakdown): boolean => {
  const expectedTotal = breakdown.subtotal + breakdown.totalFees;
  const expectedNetToCreator = breakdown.subtotal - breakdown.platformFee;

  return (
    Math.abs(breakdown.total - expectedTotal) < 0.01 &&
    Math.abs(breakdown.netToCreator - expectedNetToCreator) < 0.01
  );
};

/**
 * Get Creator Program benefit comparison
 */
export const getCreatorProgramBenefit = (amount: number) => {
  const regularFees = calculateFees({ amount, isCreatorProgram: false });
  const creatorFees = calculateFees({ amount, isCreatorProgram: true });

  const savings = regularFees.platformFee - creatorFees.platformFee;
  const savingsPercentage = (savings / amount) * 100;

  return {
    regularEarnings: regularFees.netToCreator,
    creatorEarnings: creatorFees.netToCreator,
    savings,
    savingsPercentage,
    additionalEarningsPercentage: savingsPercentage,
  };
};
