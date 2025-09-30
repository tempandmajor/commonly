import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Form } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { UserPlus, Mail, User } from 'lucide-react';
import { FormField, FormSection, FormActions } from '@/components/forms/shared';
import { PasswordField } from './PasswordField';
import { SocialAuth } from './SocialAuth';
import { registerSchema, RegisterFormValues, registerFormDefaults } from '@/lib/validations/authValidation';
import { useAuth } from '@/providers/AuthProvider';
import { useWalkthrough } from '@/hooks/useWalkthrough';
import { toast } from 'sonner';

interface RegisterFormProps {
  onSuccess?: () => void | undefined;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const { signUp } = useAuth();
  const { setRecentLogin } = useWalkthrough();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: registerFormDefaults,
  });

  const handleSubmit = async (values: RegisterFormValues) => {
    try {
      setIsLoading(true);

      // Ensure all validation passes before proceeding
      const isValid = await form.trigger();
      if (!isValid) {
        toast.error('Please fix the validation errors before continuing.');
        return;
      }

      // Additional client-side validation
      if (!values.acceptTerms || !values.acceptPrivacy) {
        toast.error('You must accept the Terms of Service and Privacy Policy to continue.');
        return;
      }

      const { error } = await signUp(values.email, values.password, {
        name: values.name,
        display_name: values.name,
        username: values.username,
        subscribeNewsletter: values.subscribeNewsletter,
        allowMarketingEmails: values.allowMarketingEmails,
      });

      if (!error) {
        setRecentLogin(true);
        toast.success(
          'Account created successfully! Please check your email to confirm your account.'
        );
        onSuccess?.();
      }
    } catch (error) {
      toast.error('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SocialAuth mode="register" onLoading={setIsLoading} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FormSection title="Account Information" description="Your login credentials">
            <div className="space-y-4">
              <FormField
                form={form}
                name="email"
                label="Email"
                type="email"
                placeholder="name@example.com"
                icon={<Mail className="h-4 w-4" />}
                required
                autoComplete="email"
              />

              <PasswordField
                form={form}
                name="password"
                label="Password"
                placeholder="Create a strong password"
                required
                showStrengthIndicator
              />

              <PasswordField
                form={form}
                name="confirmPassword"
                label="Confirm Password"
                placeholder="Confirm your password"
                required
              />
            </div>
          </FormSection>

          <FormSection title="Profile Information" description="Tell us about yourself">
            <div className="space-y-4">
              <FormField
                form={form}
                name="name"
                label="Full Name"
                placeholder="John Doe"
                icon={<User className="h-4 w-4" />}
                required
                autoComplete="name"
              />

              <FormField
                form={form}
                name="username"
                label="Username"
                placeholder="johndoe"
                helpText="Choose a unique username (optional)"
                autoComplete="username"
              />
            </div>
          </FormSection>

          <FormSection title="Terms & Preferences" description="Review and accept our policies">
            <div className="space-y-4">
              {/* Required Terms */}
              <div className="space-y-3 p-4 rounded-lg border bg-muted/20">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={form.watch('acceptTerms')}
                    onCheckedChange={(checked) =>
                      form.setValue('acceptTerms', checked as boolean)
                    }
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="terms"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      I accept the{' '}
                      <Link to="/terms" className="text-primary hover:underline font-semibold">
                        Terms of Service
                      </Link>{' '}
                      <span className="text-destructive">*</span>
                    </Label>
                    {form.formState.errors.acceptTerms && (
                      <p className="text-sm text-destructive mt-1">
                        {String(form.formState.errors.acceptTerms.message || 'This field is required')}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="privacy"
                    checked={form.watch('acceptPrivacy')}
                    onCheckedChange={(checked) =>
                      form.setValue('acceptPrivacy', checked as boolean)
                    }
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="privacy"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      I accept the{' '}
                      <Link to="/privacy" className="text-primary hover:underline font-semibold">
                        Privacy Policy
                      </Link>{' '}
                      <span className="text-destructive">*</span>
                    </Label>
                    {form.formState.errors.acceptPrivacy && (
                      <p className="text-sm text-destructive mt-1">
                        {String(form.formState.errors.acceptPrivacy.message || 'This field is required')}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Optional Preferences */}
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="newsletter"
                    checked={form.watch('subscribeNewsletter')}
                    onCheckedChange={(checked) =>
                      form.setValue('subscribeNewsletter', checked as boolean)
                    }
                  />
                  <Label
                    htmlFor="newsletter"
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Subscribe to our newsletter for product updates
                  </Label>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="marketing"
                    checked={form.watch('allowMarketingEmails')}
                    onCheckedChange={(checked) =>
                      form.setValue('allowMarketingEmails', checked as boolean)
                    }
                  />
                  <Label
                    htmlFor="marketing"
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Receive promotional emails and special offers
                  </Label>
                </div>
              </div>
            </div>
          </FormSection>

          <FormActions
            isSubmitting={isLoading}
            submitLabel="Create Account"
            submitIcon={<UserPlus className="h-4 w-4" />}
            className="w-full"
          />
        </form>
      </Form>
    </div>
  );
};