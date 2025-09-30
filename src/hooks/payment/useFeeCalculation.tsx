import { useMemo } from 'react';
import { calculateFees, formatFeeBreakdown } from '@/services/fees/feeCalculator';

interface UseFeeCalculationProps {
  amount: number;
  isPlatformFee?: boolean | undefined;
  includeStripeFees?: boolean | undefined;
  tax?: number | undefined;
  tipAmount?: number | undefined;
  discount?: number | undefined;
  isCreatorProgram?: boolean | undefined;
}

export const useFeeCalculation = ({
  amount,
  isPlatformFee = false,
  includeStripeFees = true,
  tax = 0,
  tipAmount = 0,
  discount = 0,
  isCreatorProgram = false,
}: UseFeeCalculationProps) => {
  const feeBreakdown = useMemo(() => {
    const fees = calculateFees({
      amount,
      isPlatformFee,
      includeStripeFees,
      isCreatorProgram,
    });

    // Calculate final total including tax, tip, and discount
    const finalTotal = fees.subtotal + fees.stripeFee + tax + tipAmount - discount;

    return {
          ...fees,
      tax,
      tipAmount,
      discount,
      finalTotal: Math.round(finalTotal * 100) / 100,
    };
  }, [amount, isPlatformFee, includeStripeFees, tax, tipAmount, discount, isCreatorProgram]);

  const formattedBreakdown = useMemo(() => {
    return {
          ...formatFeeBreakdown(feeBreakdown),
      tax: `$${feeBreakdown.tax.toFixed(2)}`,
      tipAmount: `$${feeBreakdown.tipAmount.toFixed(2)}`,
      discount: `$${feeBreakdown.discount.toFixed(2)}`,
      finalTotal: `$${feeBreakdown.finalTotal.toFixed(2)}`,
    };
  }, [feeBreakdown]);

  // Calculate Creator Program benefit if not already a Creator Program member
  const creatorProgramBenefit = useMemo(() => {
    if (isCreatorProgram) return null;

    const regularFees = calculateFees({
      amount,
      isPlatformFee,
      includeStripeFees,
      isCreatorProgram: false,
    });
    const creatorFees = calculateFees({
      amount,
      isPlatformFee,
      includeStripeFees,
      isCreatorProgram: true,
    });

    return {
      savings: regularFees.platformFee - creatorFees.platformFee,
      savingsPercentage: ((regularFees.platformFee - creatorFees.platformFee) / amount) * 100,
      creatorEarnings: creatorFees.netToCreator,
      regularEarnings: regularFees.netToCreator,
    };
  }, [amount, isPlatformFee, includeStripeFees, isCreatorProgram]);

  return {
    feeBreakdown,
    formattedBreakdown,
    creatorProgramBenefit,
    // Convenience getters
    subtotal: feeBreakdown.subtotal,
    platformFee: feeBreakdown.platformFee,
    platformFeePercentage: feeBreakdown.platformFeePercentage,
    stripeFee: feeBreakdown.stripeFee,
    totalFees: feeBreakdown.totalFees,
    finalTotal: feeBreakdown.finalTotal,
    netToCreator: feeBreakdown.netToCreator,
    isCreatorProgram: feeBreakdown.isCreatorProgram,
  };
};
