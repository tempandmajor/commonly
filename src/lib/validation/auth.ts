/**
 * Authentication Validation Schemas
 *
 * Type-safe validation for all authentication-related operations
 */

import { z } from 'zod';

/**
 * Email validation
 */
export const EmailSchema = z.string()
  .email('Invalid email address')
  .toLowerCase()
  .trim();

/**
 * Password validation with strength requirements
 */
export const PasswordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

/**
 * Username validation
 */
export const UsernameSchema = z.string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be less than 30 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
  .toLowerCase()
  .trim();

/**
 * User registration schema
 */
export const RegisterSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  username: UsernameSchema.optional(),
  firstName: z.string().min(1).max(50).trim().optional(),
  lastName: z.string().min(1).max(50).trim().optional(),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms and conditions' }),
  }),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

/**
 * User login schema
 */
export const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

export type LoginInput = z.infer<typeof LoginSchema>;

/**
 * Password reset request schema
 */
export const PasswordResetRequestSchema = z.object({
  email: EmailSchema,
});

export type PasswordResetRequest = z.infer<typeof PasswordResetRequestSchema>;

/**
 * Password reset confirmation schema
 */
export const PasswordResetSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: PasswordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type PasswordReset = z.infer<typeof PasswordResetSchema>;

/**
 * Change password schema (for logged-in users)
 */
export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: PasswordSchema,
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'Passwords do not match',
  path: ['confirmNewPassword'],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: 'New password must be different from current password',
  path: ['newPassword'],
});

export type ChangePassword = z.infer<typeof ChangePasswordSchema>;

/**
 * Two-factor authentication setup schema
 */
export const TwoFactorSetupSchema = z.object({
  userId: z.string().uuid(),
  secret: z.string().min(1),
  backupCodes: z.array(z.string()).length(10),
});

export type TwoFactorSetup = z.infer<typeof TwoFactorSetupSchema>;

/**
 * Two-factor authentication verification schema
 */
export const TwoFactorVerifySchema = z.object({
  userId: z.string().uuid(),
  code: z.string().length(6, 'Code must be 6 digits').regex(/^\d+$/, 'Code must contain only numbers'),
});

export type TwoFactorVerify = z.infer<typeof TwoFactorVerifySchema>;

/**
 * User role schema
 */
export const UserRoleSchema = z.enum(['user', 'admin', 'moderator', 'organizer']);
export type UserRole = z.infer<typeof UserRoleSchema>;

/**
 * User status schema
 */
export const UserStatusSchema = z.enum(['active', 'suspended', 'banned', 'pending_verification']);
export type UserStatus = z.infer<typeof UserStatusSchema>;

/**
 * User profile schema
 */
export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  email: EmailSchema,
  username: UsernameSchema.nullable().optional(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  role: UserRoleSchema.default('user'),
  status: UserStatusSchema.default('active'),
  emailVerified: z.boolean().default(false),
  twoFactorEnabled: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date().nullable().optional(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

/**
 * Session schema
 */
export const SessionSchema = z.object({
  userId: z.string().uuid(),
  sessionToken: z.string().min(1),
  expiresAt: z.date(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

export type Session = z.infer<typeof SessionSchema>;

/**
 * API key schema (for service accounts)
 */
export const ApiKeySchema = z.object({
  userId: z.string().uuid(),
  keyPrefix: z.string().length(8),
  hashedKey: z.string(),
  name: z.string().min(1).max(100),
  scopes: z.array(z.string()),
  expiresAt: z.date().nullable().optional(),
  lastUsedAt: z.date().nullable().optional(),
});

export type ApiKey = z.infer<typeof ApiKeySchema>;

/**
 * OAuth provider schema
 */
export const OAuthProviderSchema = z.enum(['google', 'github', 'facebook', 'twitter']);
export type OAuthProvider = z.infer<typeof OAuthProviderSchema>;

/**
 * OAuth connection schema
 */
export const OAuthConnectionSchema = z.object({
  userId: z.string().uuid(),
  provider: OAuthProviderSchema,
  providerUserId: z.string(),
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  expiresAt: z.date().nullable().optional(),
});

export type OAuthConnection = z.infer<typeof OAuthConnectionSchema>;

/**
 * Utility: Validate email format
 */
export function isValidEmail(email: string): boolean {
  return EmailSchema.safeParse(email).success;
}

/**
 * Utility: Validate password strength
 */
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const result = PasswordSchema.safeParse(password);
  if (result.success) {
    return { valid: true, errors: [] };
  }
  return {
    valid: false,
    errors: result.error.errors.map((e) => e.message),
  };
}

/**
 * Utility: Validate username format
 */
export function isValidUsername(username: string): boolean {
  return UsernameSchema.safeParse(username).success;
}

/**
 * Utility: Check if user has required role
 */
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  const hierarchy: Record<UserRole, number> = {
    user: 0,
    organizer: 1,
    moderator: 2,
    admin: 3,
  };

  return hierarchy[userRole] >= hierarchy[requiredRole];
}

/**
 * Utility: Check if user is active
 */
export function isUserActive(status: UserStatus): boolean {
  return status === 'active';
}

/**
 * Utility: Generate secure session token
 */
export function generateSessionToken(): string {
  const buffer = new Uint8Array(32);
  crypto.getRandomValues(buffer);

  return Array.from(buffer, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Utility: Hash API key for storage
 */
export async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hash = await crypto.subtle.digest('SHA-256', data);

  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Utility: Generate API key
 */
export function generateApiKey(prefix: string = 'sk'): string {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);

  const key = Array.from(randomBytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${prefix}_${key}`;
}