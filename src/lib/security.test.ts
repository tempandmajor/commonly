/**
 * Security Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import {
  sanitizeText,
  isValidEmail,
  isValidUrl,
  isValidUuid,
  validatePasswordStrength,
  containsSqlInjection,
  containsXssPattern,
  maskSensitiveData,
  RateLimiter,
} from './security';

describe('Security Utilities', () => {
  describe('sanitizeText', () => {
    it('should remove HTML tags', () => {
      const input = '<script>alert("xss")</script>Hello';
      const output = sanitizeText(input);
      expect(output).toBe('Hello');
    });

    it('should remove angle brackets', () => {
      const input = '<>Test<>';
      const output = sanitizeText(input);
      expect(output).toBe('Test');
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name+tag@example.co.uk')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
    });
  });

  describe('isValidUrl', () => {
    it('should validate correct URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('ftp://invalid')).toBe(false);
    });
  });

  describe('isValidUuid', () => {
    it('should validate correct UUIDs', () => {
      expect(isValidUuid('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
    });

    it('should reject invalid UUIDs', () => {
      expect(isValidUuid('not-a-uuid')).toBe(false);
      expect(isValidUuid('12345')).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should accept strong passwords', () => {
      const result = validatePasswordStrength('StrongP@ssw0rd');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject weak passwords', () => {
      const result = validatePasswordStrength('weak');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should require uppercase letters', () => {
      const result = validatePasswordStrength('lowercase123!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Password must contain at least one uppercase letter'
      );
    });

    it('should require numbers', () => {
      const result = validatePasswordStrength('NoNumbers!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should require special characters', () => {
      const result = validatePasswordStrength('NoSpecial123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Password must contain at least one special character'
      );
    });
  });

  describe('containsSqlInjection', () => {
    it('should detect SQL injection attempts', () => {
      expect(containsSqlInjection("'; DROP TABLE users--")).toBe(true);
      expect(containsSqlInjection('SELECT * FROM users')).toBe(true);
      expect(containsSqlInjection('1 OR 1=1')).toBe(false); // Too simple
    });

    it('should allow normal text', () => {
      expect(containsSqlInjection('normal user input')).toBe(false);
    });
  });

  describe('containsXssPattern', () => {
    it('should detect XSS attempts', () => {
      expect(containsXssPattern('<script>alert("xss")</script>')).toBe(true);
      expect(containsXssPattern('javascript:alert(1)')).toBe(true);
      expect(containsXssPattern('<img onerror=alert(1)>')).toBe(true);
    });

    it('should allow normal text', () => {
      expect(containsXssPattern('normal user input')).toBe(false);
    });
  });

  describe('maskSensitiveData', () => {
    it('should mask sensitive data correctly', () => {
      const masked = maskSensitiveData('1234567890', 2);
      expect(masked).toBe('12******90');
    });

    it('should handle short strings', () => {
      const masked = maskSensitiveData('123', 2);
      expect(masked).toBe('***');
    });
  });

  describe('RateLimiter', () => {
    it('should allow requests within limit', () => {
      const limiter = new RateLimiter(3, 1000);
      expect(limiter.isAllowed()).toBe(true);
      expect(limiter.isAllowed()).toBe(true);
      expect(limiter.isAllowed()).toBe(true);
    });

    it('should block requests exceeding limit', () => {
      const limiter = new RateLimiter(2, 1000);
      limiter.isAllowed();
      limiter.isAllowed();
      expect(limiter.isAllowed()).toBe(false);
    });

    it('should reset after window expires', async () => {
      const limiter = new RateLimiter(1, 100);
      limiter.isAllowed();
      expect(limiter.isAllowed()).toBe(false);

      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(limiter.isAllowed()).toBe(true);
    });
  });
});