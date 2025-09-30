import * as z from 'zod';
import { commonValidations } from './shared';

// Password strength requirements
const passwordValidation = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// Login schema
export const loginSchema = z.object({
  email: commonValidations.email,
  password: z.string().min(1, 'Password is required'),
  rememberMe: commonValidations.booleanWithDefault(false),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

// Registration schema
export const registerSchema = z
  .object({
    // Account information
    email: commonValidations.email,
    password: passwordValidation,
    confirmPassword: z.string(),

    // Profile information
    name: commonValidations.requiredString('Full name', 2, 50) as string,
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username must be less than 30 characters')
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        'Username can only contain letters, numbers, underscores, and hyphens'
      )
      .optional(),

    // Terms and conditions
    acceptTerms: z.boolean().refine(val => val === true, {
      message: 'You must accept the terms and conditions',
    }),
    acceptPrivacy: z.boolean().refine(val => val === true, {
      message: 'You must accept the privacy policy',
    }),

    // Marketing preferences
    subscribeNewsletter: commonValidations.booleanWithDefault(false),
    allowMarketingEmails: commonValidations.booleanWithDefault(false),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

// Forgot password schema
export const forgotPasswordSchema = z.object({
  email: commonValidations.email,
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

// Reset password schema
export const resetPasswordSchema = z
  .object({
    password: passwordValidation,
    confirmPassword: z.string(),
    token: z.string().min(1, 'Reset token is required'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

// Change password schema (for authenticated users)
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordValidation,
    confirmNewPassword: z.string(),
  })
  .refine(data => data.newPassword !== data.currentPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  })
  .refine(data => data.newPassword === data.confirmNewPassword, {
    message: "Passwords don't match",
    path: ['confirmNewPassword'],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

// Two-factor authentication schemas
export const enableTwoFactorSchema = z.object({
  password: z.string().min(1, 'Password is required for security'),
  phoneNumber: commonValidations.phone.optional(),
  preferredMethod: z.enum(['sms', 'app']).default('app'),
});

export type EnableTwoFactorFormValues = z.infer<typeof enableTwoFactorSchema>;

export const verifyTwoFactorSchema = z.object({
  code: z
    .string()
    .length(6, 'Verification code must be 6 digits')
    .regex(/^\d+$/, 'Verification code must contain only numbers'),
  trustDevice: commonValidations.booleanWithDefault(false),
});

export type VerifyTwoFactorFormValues = z.infer<typeof verifyTwoFactorSchema>;

// Social login schema
export const socialLoginSchema = z.object({
  provider: z.enum(['google', 'facebook', 'twitter', 'github']),
  email: commonValidations.email.optional(),
  name: z.string().optional(),
  avatar: commonValidations.imageUrl.optional(),
  providerId: z.string(),
});

export type SocialLoginFormValues = z.infer<typeof socialLoginSchema>;

// Default values for forms
export const loginFormDefaults: LoginFormValues = {
  email: '',
  password: '',
  rememberMe: false,
};

export const registerFormDefaults: Partial<RegisterFormValues> = {
  email: '',
  password: '',
  confirmPassword: '',
  name: '',
  username: '',
  acceptTerms: false,
  acceptPrivacy: false,
  subscribeNewsletter: false,
  allowMarketingEmails: false,
};
