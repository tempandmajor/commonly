/**
 * Authentication Validation Tests
 */

import { describe, it, expect } from 'vitest';
import {
  EmailSchema,
  PasswordSchema,
  UsernameSchema,
  RegisterSchema,
  LoginSchema,
  ChangePasswordSchema,
  TwoFactorVerifySchema,
  isValidEmail,
  validatePassword,
  isValidUsername,
  hasRole,
  isUserActive,
  generateSessionToken,
  generateApiKey,
  type UserRole,
  type UserStatus,
} from './auth';

describe('Authentication Validation', () => {
  describe('EmailSchema', () => {
    it('should validate correct email addresses', () => {
      expect(EmailSchema.safeParse('test@example.com').success).toBe(true);
      expect(EmailSchema.safeParse('user+tag@example.co.uk').success).toBe(true);
      expect(EmailSchema.safeParse('name.surname@company.com').success).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(EmailSchema.safeParse('invalid').success).toBe(false);
      expect(EmailSchema.safeParse('@example.com').success).toBe(false);
      expect(EmailSchema.safeParse('test@').success).toBe(false);
      expect(EmailSchema.safeParse('test @example.com').success).toBe(false);
    });

    it('should convert email to lowercase', () => {
      const result = EmailSchema.parse('TEST@EXAMPLE.COM');
      expect(result).toBe('test@example.com');
    });
  });

  describe('PasswordSchema', () => {
    it('should validate strong passwords', () => {
      expect(PasswordSchema.safeParse('StrongP@ssw0rd').success).toBe(true);
      expect(PasswordSchema.safeParse('MyP@ssword123').success).toBe(true);
      expect(PasswordSchema.safeParse('C0mpl3x!Pass').success).toBe(true);
    });

    it('should reject passwords that are too short', () => {
      expect(PasswordSchema.safeParse('Short1!').success).toBe(false);
    });

    it('should reject passwords without uppercase', () => {
      expect(PasswordSchema.safeParse('lowercase123!').success).toBe(false);
    });

    it('should reject passwords without lowercase', () => {
      expect(PasswordSchema.safeParse('UPPERCASE123!').success).toBe(false);
    });

    it('should reject passwords without numbers', () => {
      expect(PasswordSchema.safeParse('NoNumbers!').success).toBe(false);
    });

    it('should reject passwords without special characters', () => {
      expect(PasswordSchema.safeParse('NoSpecial123').success).toBe(false);
    });

    it('should reject passwords that are too long', () => {
      const longPassword = 'A1!' + 'a'.repeat(130);
      expect(PasswordSchema.safeParse(longPassword).success).toBe(false);
    });
  });

  describe('UsernameSchema', () => {
    it('should validate correct usernames', () => {
      expect(UsernameSchema.safeParse('john_doe').success).toBe(true);
      expect(UsernameSchema.safeParse('user-123').success).toBe(true);
      expect(UsernameSchema.safeParse('testuser').success).toBe(true);
    });

    it('should reject usernames that are too short', () => {
      expect(UsernameSchema.safeParse('ab').success).toBe(false);
    });

    it('should reject usernames with special characters', () => {
      expect(UsernameSchema.safeParse('user@name').success).toBe(false);
      expect(UsernameSchema.safeParse('user name').success).toBe(false);
      expect(UsernameSchema.safeParse('user.name').success).toBe(false);
    });

    it('should convert username to lowercase', () => {
      const result = UsernameSchema.parse('TestUser');
      expect(result).toBe('testuser');
    });
  });

  describe('RegisterSchema', () => {
    it('should validate correct registration data', () => {
      const data = {
        email: 'test@example.com',
        password: 'StrongP@ssw0rd',
        username: 'testuser',
        firstName: 'John',
        lastName: 'Doe',
        acceptTerms: true,
      };

      expect(RegisterSchema.safeParse(data).success).toBe(true);
    });

    it('should require terms acceptance', () => {
      const data = {
        email: 'test@example.com',
        password: 'StrongP@ssw0rd',
        acceptTerms: false,
      };

      expect(RegisterSchema.safeParse(data).success).toBe(false);
    });

    it('should allow optional fields', () => {
      const data = {
        email: 'test@example.com',
        password: 'StrongP@ssw0rd',
        acceptTerms: true,
      };

      expect(RegisterSchema.safeParse(data).success).toBe(true);
    });
  });

  describe('LoginSchema', () => {
    it('should validate correct login data', () => {
      const data = {
        email: 'test@example.com',
        password: 'anypassword',
      };

      expect(LoginSchema.safeParse(data).success).toBe(true);
    });

    it('should default rememberMe to false', () => {
      const data = {
        email: 'test@example.com',
        password: 'anypassword',
      };

      const result = LoginSchema.parse(data);
      expect(result.rememberMe).toBe(false);
    });
  });

  describe('ChangePasswordSchema', () => {
    it('should validate correct password change data', () => {
      const data = {
        currentPassword: 'OldP@ssw0rd',
        newPassword: 'NewP@ssw0rd',
        confirmNewPassword: 'NewP@ssw0rd',
      };

      expect(ChangePasswordSchema.safeParse(data).success).toBe(true);
    });

    it('should reject when passwords do not match', () => {
      const data = {
        currentPassword: 'OldP@ssw0rd',
        newPassword: 'NewP@ssw0rd',
        confirmNewPassword: 'Different123!',
      };

      expect(ChangePasswordSchema.safeParse(data).success).toBe(false);
    });

    it('should reject when new password equals current password', () => {
      const data = {
        currentPassword: 'SameP@ssw0rd',
        newPassword: 'SameP@ssw0rd',
        confirmNewPassword: 'SameP@ssw0rd',
      };

      expect(ChangePasswordSchema.safeParse(data).success).toBe(false);
    });
  });

  describe('TwoFactorVerifySchema', () => {
    it('should validate correct 2FA code', () => {
      const data = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        code: '123456',
      };

      expect(TwoFactorVerifySchema.safeParse(data).success).toBe(true);
    });

    it('should reject codes that are not 6 digits', () => {
      const data = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        code: '12345',
      };

      expect(TwoFactorVerifySchema.safeParse(data).success).toBe(false);
    });

    it('should reject codes with non-numeric characters', () => {
      const data = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        code: '12345a',
      };

      expect(TwoFactorVerifySchema.safeParse(data).success).toBe(false);
    });
  });

  describe('Utility Functions', () => {
    describe('isValidEmail', () => {
      it('should return true for valid emails', () => {
        expect(isValidEmail('test@example.com')).toBe(true);
      });

      it('should return false for invalid emails', () => {
        expect(isValidEmail('invalid')).toBe(false);
      });
    });

    describe('validatePassword', () => {
      it('should return valid: true for strong passwords', () => {
        const result = validatePassword('StrongP@ssw0rd');
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should return errors for weak passwords', () => {
        const result = validatePassword('weak');
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    describe('isValidUsername', () => {
      it('should return true for valid usernames', () => {
        expect(isValidUsername('validuser')).toBe(true);
      });

      it('should return false for invalid usernames', () => {
        expect(isValidUsername('ab')).toBe(false);
        expect(isValidUsername('user@name')).toBe(false);
      });
    });

    describe('hasRole', () => {
      it('should return true if user has required role', () => {
        expect(hasRole('admin', 'user')).toBe(true);
        expect(hasRole('admin', 'admin')).toBe(true);
        expect(hasRole('moderator', 'user')).toBe(true);
      });

      it('should return false if user lacks required role', () => {
        expect(hasRole('user', 'admin')).toBe(false);
        expect(hasRole('user', 'moderator')).toBe(false);
      });
    });

    describe('isUserActive', () => {
      it('should return true for active users', () => {
        expect(isUserActive('active')).toBe(true);
      });

      it('should return false for non-active users', () => {
        expect(isUserActive('suspended')).toBe(false);
        expect(isUserActive('banned')).toBe(false);
        expect(isUserActive('pending_verification')).toBe(false);
      });
    });

    describe('generateSessionToken', () => {
      it('should generate a token', () => {
        const token = generateSessionToken();
        expect(typeof token).toBe('string');
        expect(token.length).toBeGreaterThan(0);
      });

      it('should generate unique tokens', () => {
        const token1 = generateSessionToken();
        const token2 = generateSessionToken();
        expect(token1).not.toBe(token2);
      });
    });

    describe('generateApiKey', () => {
      it('should generate an API key with prefix', () => {
        const key = generateApiKey('pk');
        expect(key).toMatch(/^pk_/);
      });

      it('should generate unique API keys', () => {
        const key1 = generateApiKey();
        const key2 = generateApiKey();
        expect(key1).not.toBe(key2);
      });
    });
  });
});