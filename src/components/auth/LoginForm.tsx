import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Form } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { LogIn, Mail } from 'lucide-react';
import { FormField, FormActions } from '@/components/forms/shared';
import { PasswordField } from './PasswordField';
import { SocialAuth } from './SocialAuth';
import { loginSchema, LoginFormValues, loginFormDefaults } from '@/lib/validations/authValidation';
import { useAuth } from '@/providers/AuthProvider';
import { useWalkthrough } from '@/hooks/useWalkthrough';
import { toast } from 'sonner';

interface LoginFormProps {
  onSuccess?: () => void | undefined;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { signIn } = useAuth();
  const { setRecentLogin } = useWalkthrough();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: loginFormDefaults,
  });

  // Load remembered email
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberEmail');
    if (rememberedEmail) {
      form.setValue('email', rememberedEmail);
      form.setValue('rememberMe', true);
    }
  }, [form]);

  const handleSubmit = async (values: LoginFormValues) => {
    try {
      setIsLoading(true);
      const result = await signIn(values.email, values.password);

      if (!result?.error) {
        setRecentLogin(true);

        // Store remember me preference
        if (values.rememberMe) {
          localStorage.setItem('rememberEmail', values.email);
        } else {
          localStorage.removeItem('rememberEmail');
        }

        toast.success('Welcome back!');
        onSuccess?.();
      } else {
        toast.error('Invalid email or password. Please try again.');
      }
    } catch (error) {
      toast.error('Login failed. Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SocialAuth mode="login" onLoading={setIsLoading} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            form={form}
            name="email"
            label="Email"
            type="email"
            placeholder="name@example.com"
            icon={<Mail className="h-4 w-4" />}
            required
            autoComplete="email"
            autoFocus
          />

          <PasswordField
            form={form}
            name="password"
            label="Password"
            placeholder="Enter your password"
            required
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={form.watch('rememberMe')}
                onCheckedChange={(checked) =>
                  form.setValue('rememberMe', checked as boolean)
                }
              />
              <Label
                htmlFor="remember"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Remember me
              </Label>
            </div>
            <Link
              to="/reset-password"
              className="text-sm text-primary hover:underline font-medium"
            >
              Forgot password?
            </Link>
          </div>

          <FormActions
            isSubmitting={isLoading}
            submitLabel="Sign In"
            submitIcon={<LogIn className="h-4 w-4" />}
            className="w-full"
          />
        </form>
      </Form>
    </div>
  );
};