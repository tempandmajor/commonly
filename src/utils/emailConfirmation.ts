import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Resend confirmation email for a user
 */
export const resendConfirmationEmail = async (email: string) => {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    });

    if (error) {
      toast.error(error.message || 'Failed to resend confirmation email');
      return { error };
    }

    toast.success('Confirmation email sent! Please check your inbox.');
    return { error: null };
  } catch (error: unknown) {
    toast.error('An unexpected error occurred');
    return { error };
  }
};

/**
 * Check if a user's email is confirmed
 */
export const checkEmailConfirmation = async () => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { isConfirmed: false, user: null };
    }

    // Check if email is confirmed
    const isConfirmed = user.email_confirmed_at !== null;

    return { isConfirmed, user };
  } catch (error: unknown) {
    return { isConfirmed: false, user: null };
  }
};
