import { supabase } from '@/integrations/supabase/client';
import { safeToast } from '@/services/api/utils/safeToast';

export const getPaymentDoc = async (paymentId: string) => {
  try {
    const { data, error } = await supabase
      .from('PaymentsTest')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    return null;
  }
};

export const verifyPaymentStatus = async (paymentId: string) => {
  try {
    const { data, error } = await supabase
      .from('PaymentsTest')
      .select('status')
      .eq('id', paymentId)
      .single();

    if (error) throw error;
    return data?.status === 'completed';
  } catch (error) {
    return false;
  }
};

export const updatePaymentStatus = async (paymentId: string, status: string) => {
  try {
    const { error } = await supabase
      .from('PaymentsTest')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', paymentId);

    if (error) throw error;
    return true;
  } catch (error) {
    return false;
  }
};

export const processPaymentVerification = async (paymentId: string) => {
  try {
    const payment = await getPaymentDoc(paymentId);
    if (!payment) {
      safeToast.error('Payment not found');
      return false;
    }

    if (payment.status === 'completed') {
      safeToast.success('Payment already verified');
      return true;
    }

    const updated = await updatePaymentStatus(paymentId, 'completed');
    if (updated) {
      safeToast.success('Payment verified successfully');
      return true;
    } else {
      safeToast.error('Failed to verify payment');
      return false;
    }
  } catch (error) {
    safeToast.error('Payment verification failed');
    return false;
  }
};
