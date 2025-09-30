import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';
import { toast } from 'sonner';
import { Mail, ArrowLeft, KeyRound } from 'lucide-react';
import { AuthCard } from '@/components/auth/AuthCard';
import { PasswordField } from '@/components/auth/PasswordField';
import { FormField, FormActions } from '@/components/forms/shared';
import { forgotPasswordSchema, resetPasswordSchema, ForgotPasswordFormValues, ResetPasswordFormValues } from '@/lib/validations/authValidation';
import { supabase } from '@/integrations/supabase/client';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  const isResetMode = searchParams.has('access_token') || searchParams.has('token_hash');
  const token = searchParams.get('access_token') || searchParams.get('token_hash') || '';

  // Form for requesting password reset
  const forgotForm = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  // Form for setting new password
  const resetForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '', token },
  });

  const handleRequestReset = async (values: ForgotPasswordFormValues) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast.success('Password reset email sent! Check your inbox and spam folder.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send password reset email');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (values: ResetPasswordFormValues) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });

      if (error) throw error;

      toast.success('Password updated successfully!');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/30 relative overflow-hidden'>
      {/* Background decorative elements */}
      <div className='absolute inset-0 overflow-hidden'>
        <div className='absolute -top-1/2 -right-1/2 w-96 h-96 rounded-full bg-gradient-to-br from-primary/5 to-primary/10 blur-3xl' />
        <div className='absolute -bottom-1/2 -left-1/2 w-96 h-96 rounded-full bg-gradient-to-tr from-secondary/5 to-secondary/10 blur-3xl' />
      </div>

      <div className='relative z-10 w-full max-w-md space-y-6'>
        {/* Header with back button */}
        <div className='flex items-center justify-center'>
          <Link
            to='/login'
            className='absolute left-0 flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors'
          >
            <ArrowLeft className='h-4 w-4 mr-1' />
            Back to Login
          </Link>
          <div className='mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg'>
            <KeyRound className='h-6 w-6 text-primary-foreground' />
          </div>
        </div>

        {!isResetMode ? (
          /* Forgot Password Form */
          <AuthCard
            title='Reset Password'
            description="Enter your email address and we'll send you a link to reset your password"
          >
            <Form {...forgotForm}>
              <form onSubmit={forgotForm.handleSubmit(handleRequestReset)} className='space-y-4'>
                <FormField
                  form={forgotForm}
                  name='email'
                  label='Email'
                  type='email'
                  placeholder='name@example.com'
                  icon={<Mail className='h-4 w-4' />}
                  required
                  autoComplete='email'
                  autoFocus
                />

                <div className='rounded-lg border border-border bg-secondary p-4'>
                  <p className='text-sm text-muted-foreground'>
                    We'll send you a secure link to reset your password. Make sure to check your spam folder if you don't see it.
                  </p>
                </div>

                <FormActions
                  isSubmitting={isLoading}
                  submitLabel='Send Reset Link'
                  submitIcon={<Mail className='h-4 w-4' />}
                  className='w-full'
                />
              </form>
            </Form>
          </AuthCard>
        ) : (
          /* Set New Password Form */
          <AuthCard
            title='Set New Password'
            description='Enter your new password below'
          >
            <Form {...resetForm}>
              <form onSubmit={resetForm.handleSubmit(handlePasswordReset)} className='space-y-4'>
                <PasswordField
                  form={resetForm}
                  name='password'
                  label='New Password'
                  placeholder='Create a strong password'
                  required
                  showStrengthIndicator
                />

                <PasswordField
                  form={resetForm}
                  name='confirmPassword'
                  label='Confirm New Password'
                  placeholder='Confirm your password'
                  required
                />

                <div className='rounded-lg border border-border bg-secondary p-4'>
                  <p className='text-sm text-muted-foreground'>
                    Your new password must be at least 8 characters and include uppercase, lowercase, number, and special character.
                  </p>
                </div>

                <FormActions
                  isSubmitting={isLoading}
                  submitLabel='Update Password'
                  submitIcon={<KeyRound className='h-4 w-4' />}
                  className='w-full'
                />
              </form>
            </Form>
          </AuthCard>
        )}

        {/* Footer */}
        <div className='text-center'>
          <p className='text-sm text-muted-foreground'>
            Remember your password?{' '}
            <Link to='/login' className='text-primary hover:underline font-medium transition-colors'>
              Sign in instead
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;