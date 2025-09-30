import {
  calculateFees,
  calculateStripePlatformFee,
  PLATFORM_FEE_PERCENT,
  CREATOR_PROGRAM_FEE_PERCENT,
} from '@/services/fees/feeCalculator';
import { PaymentOptions, PaymentResult } from './types';
import { supabase } from '@/integrations/supabase/client';
import { safeToast } from '@/services/api/utils/safeToast';
import { createCheckoutSession as createCheckoutSessionHelper } from '@/services/supabase/edge-functions';

/**
 * Enhanced Payment Service with comprehensive fee handling and Creator Program support
 */
export class EnhancedPaymentService {
  /**
   * Check if a creator is in the Creator Program
   */
  static async checkCreatorProgramStatus(creatorId: string): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('creator_program')
        .select('status')
        .eq('user_id', creatorId)
        .eq('status', 'approved')
        .maybeSingle();

      return !!data;
    } catch (error) {
      return false;
    }
  }

  /**
   * Create a payment with proper fee calculation including Creator Program benefits
   */
  static async createPayment(options: PaymentOptions): Promise<PaymentResult> {
    try {
      // Check Creator Program status if creator ID is provided
      let isCreatorProgram = false;
      if (options.creatorId) {
        isCreatorProgram = await this.checkCreatorProgramStatus(options.creatorId);
      }

      // Calculate fees using the centralized fee calculator with Creator Program status
      const feeBreakdown = calculateFees({
        amount: options.amount,
        isPlatformFee: options.isPlatformFee,
        includeStripeFees: true,
        isCreatorProgram,
      });

      // Prepare payment data with fee information
      const paymentData = {
        user_id: options.userId,
        amount: options.amount,
        currency: options.currency || 'USD',
        payment_type: options.paymentType,
        description: options.description,
        platform_fee: feeBreakdown.platformFee,
        stripe_fee: feeBreakdown.stripeFee,
        total_fees: feeBreakdown.totalFees,
        net_to_creator: feeBreakdown.netToCreator,
        total_amount: feeBreakdown.total,
        is_platform_fee: options.isPlatformFee || false,
        metadata: {
          ...options.metadata,
          feeBreakdown: JSON.stringify(feeBreakdown),
          platformFeePercent: feeBreakdown.platformFeePercentage,
          isCreatorProgram: isCreatorProgram.toString(),
        },
        status: 'pending',
        created_at: new Date().toISOString(),
      };

      // Store payment record
      const { data: paymentRecord, error: dbError } = await supabase
        .from('PaymentsTest')
        .insert(paymentData)
        .select('*')
        .single();

      if (dbError) {
        throw new Error('Failed to create payment record');
      }

      // Stripe checkout session (covers both regular and connect flows behind helper)
      const session = await createCheckoutSessionHelper({
        amount: feeBreakdown.total,
        currency: options.currency || 'USD',
        description: options.description,
        metadata: {
          ...options.metadata,
          originalAmount: options.amount,
          platformFee: feeBreakdown.platformFee,
          stripeFee: feeBreakdown.stripeFee,
          platformFeePercent: feeBreakdown.platformFeePercentage,
          isCreatorProgram: isCreatorProgram.toString(),
        },
        successUrl: options.successUrl,
        cancelUrl: options.cancelUrl,
        userId: options.userId,
      } as any);

      return {
        success: true,
        ...(session && {
          redirectUrl: session.url || null,
          url: session.url || undefined,
        }),
      };
    } catch (error) {
      safeToast.error('Payment processing failed');
      throw error;
    }
  }

  /**
   * Get payment details including fee breakdown
   */
  static async getPaymentDetails(paymentId: string) {
    try {
      const { data, error } = await supabase
        .from('PaymentsTest')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (error) throw error;

      return {
          ...data,
        feeBreakdown: data.metadata?.feeBreakdown ? JSON.parse(data.metadata.feeBreakdown): null,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Calculate fees for display purposes with Creator Program support
   */
  static async calculateDisplayFees(amount: number, isPlatformFee = false, creatorId?: string) {
    let isCreatorProgram = false;
    if (creatorId) {
      isCreatorProgram = await this.checkCreatorProgramStatus(creatorId);
    }

    return calculateFees({
      amount,
      isPlatformFee,
      includeStripeFees: true,
      isCreatorProgram,
    });
  }

  /**
   * Get Creator Program benefit for a specific amount
   */
  static getCreatorProgramBenefit(amount: number) {
    const regularFees = calculateFees({ amount, isCreatorProgram: false });
    const creatorFees = calculateFees({ amount, isCreatorProgram: true });

    return {
      regularEarnings: regularFees.netToCreator,
      creatorEarnings: creatorFees.netToCreator,
      savings: regularFees.platformFee - creatorFees.platformFee,
      savingsPercentage: ((regularFees.platformFee - creatorFees.platformFee) / amount) * 100,
      regularFeePercent: PLATFORM_FEE_PERCENT,
      creatorFeePercent: CREATOR_PROGRAM_FEE_PERCENT,
    };
  }

  /**
   * Update payment status
   */
  static async updatePaymentStatus(paymentId: string, status: string, stripeData?: unknown) {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (stripeData) {
        const sd = stripeData as Record<string, any>;
        updateData.stripe_payment_intent_id = sd.paymentIntentId;
        updateData.stripe_session_id = sd.sessionId;
      }

      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase.from('PaymentsTest').update(updateData).eq('id', paymentId);

      if (error) throw error;

      return true;
    } catch (error) {
      return false;
    }
  }
}
