/**
 * Configuration values for Stripe Connect with Creator Program support
 */

// Platform fee percentage - now supports Creator Program
export const PLATFORM_FEE_PERCENT = 20; // Default for regular users (20%)
export const CREATOR_PROGRAM_FEE_PERCENT = 15; // Reduced fee for Creator Program members (15%)

// Stripe processing fees
export const STRIPE_FEE_PERCENT = 2.9;
export const STRIPE_FIXED_FEE = 0.3;

/**
 * Get platform fee percentage based on Creator Program status
 */
export const getPlatformFeePercent = (isCreatorProgram: boolean = false): number => {
  return isCreatorProgram ? CREATOR_PROGRAM_FEE_PERCENT : PLATFORM_FEE_PERCENT;
};

/**
 * Calculate platform fee amount
 */
export const calculatePlatformFee = (amount: number, isCreatorProgram: boolean = false): number => {
  const feePercent = getPlatformFeePercent(isCreatorProgram);
  return Math.round(amount * 100 * (feePercent / 100)); // Return in cents
};
