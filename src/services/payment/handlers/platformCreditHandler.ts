import { ConnectedPaymentOptions, PaymentResult } from '../types';
import { CreditPaymentOptions } from '../creditTypes';
import {
  canUsePlatformCredit,
  getPlatformCreditBalance,
  processPlatformCredit,
} from '@/services/platformCredit';

/**
 * Handles payment using platform credit if applicable
 *
 * @param options Payment options
 * @returns Payment result or null if platform credit shouldn't or can't be used
 */
export const handlePlatformCredit = async (
  options: ConnectedPaymentOptions
): Promise<PaymentResult | null> => {
  // If platform credit is not being used, return null to proceed with regular checkout
  if (!options.usePlatformCredit) {
    return null;
  }

  // Check if the user has a userId
  if (!options.userId) {
    return null;
  }

  // Convert to CreditPaymentOptions format
  const creditOptions: CreditPaymentOptions = {
    amount: options.amount,
    currency: options.currency,
    paymentType: options.paymentType,
    description: options.description || 'Platform payment',
    isPlatformFee: options.isPlatformFee || false,
    metadata: options.metadata,
    customerId: options.customerId,
    userId: options.userId,
    status: 'pending',
    title: options.title,
  };

  // Check if payment is eligible for platform credit
  const isEligible = canUsePlatformCredit(creditOptions);
  if (!isEligible) {
    return null;
  }

  // Check if user has enough credit
  const creditBalance = await getPlatformCreditBalance(options.userId);
  if (creditBalance < options.amount) {
    return null;
  }

  // Process the payment with platform credit
  const result = await processPlatformCredit(creditOptions);

  if (result && result.success) {
    return result;
  }

  return null; // Return null to indicate platform credit was not used
};
