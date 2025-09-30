/**
 * Security Utilities
 *
 * Provides security utilities for input validation, sanitization,
 * and protection against common vulnerabilities.
 */

import DOMPurify from 'dompurify';
import { z } from 'zod';

/**
 * Sanitize HTML input to prevent XSS attacks
 *
 * @param dirty - Potentially unsafe HTML string
 * @param options - DOMPurify configuration options
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(
  dirty: string,
  options?: DOMPurify.Config
): string {
  if (typeof window === 'undefined') {
    // Server-side: return empty string (DOMPurify requires DOM)
    return '';
  }

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'a', 'blockquote', 'code', 'pre',
    ],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
          ...options,
  });
}

/**
 * Sanitize plain text input
 *
 * Removes all HTML tags and special characters
 */
export function sanitizeText(input: string): string {
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim();
}

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  const emailSchema = z.string().email();
  return emailSchema.safeParse(email).success;
}

/**
 * Validate URL
 */
export function isValidUrl(url: string): boolean {
  const urlSchema = z.string().url();
  return urlSchema.safeParse(url).success;
}

/**
 * Validate UUID
 */
export function isValidUuid(uuid: string): boolean {
  const uuidSchema = z.string().uuid();
  return uuidSchema.safeParse(uuid).success;
}

/**
 * Sanitize URL to prevent open redirects
 *
 * Only allows relative URLs or URLs from the same origin
 */
export function sanitizeRedirectUrl(url: string, allowedOrigins: string[]): string | null {
  try {
    // Allow relative URLs
    if (url.startsWith('/') && !url.startsWith('//')) {
      return url;
    }

    // Check if URL is from allowed origin
    const urlObj = new URL(url);
    if (allowedOrigins.includes(urlObj.origin)) {
      return url;
    }

    // Not safe - return null
    return null;
  } catch {
    // Invalid URL
    return null;
  }
}

/**
 * Rate limiting helper for client-side
 *
 * Tracks request timestamps and prevents too many requests
 */
export class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Check if request is allowed
   *
   * @returns true if request is allowed, false if rate limited
   */
  isAllowed(): boolean {
    const now = Date.now();

    // Remove old requests outside the window
    this.requests = this.requests.filter(
      (timestamp) => now - timestamp < this.windowMs
    );

    // Check if we've exceeded the limit
    if (this.requests.length >= this.maxRequests) {
      return false;
    }

    // Add current request
    this.requests.push(now);
    return true;
  }

  /**
   * Get time until next request is allowed (in ms)
   */
  getTimeUntilReset(): number {
    if (this.requests.length < this.maxRequests) {
      return 0;
    }

    const oldest = this.requests[0];
    const resetTime = oldest + this.windowMs;
    return Math.max(0, resetTime - Date.now());
  }

  /**
   * Reset the rate limiter
   */
  reset(): void {
    this.requests = [];
  }
}

/**
 * Validate and sanitize file upload
 */
export interface FileValidationOptions {
  maxSize?: number | undefined; // in bytes
  allowedTypes?: string[] | undefined; // MIME types
  allowedExtensions?: string[] | undefined;
}

export function validateFile(
  file: File,
  options: FileValidationOptions = {}
): { valid: boolean; error?: string } {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = [],
    allowedExtensions = [],
  } = options;

  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${maxSize / 1024 / 1024}MB limit`,
    };
  }

  // Check MIME type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`,
    };
  }

  // Check file extension
  if (allowedExtensions.length > 0) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !allowedExtensions.includes(ext)) {
      return {
        valid: false,
        error: `File extension .${ext} is not allowed`,
      };
    }
  }

  return { valid: true };
}

/**
 * Generate a secure random string
 *
 * Useful for generating tokens, IDs, etc.
 */

export function generateSecureRandomString(length: number = 32): string {
  if (typeof window === 'undefined') {
    // Server-side: use crypto module
    const crypto = require('crypto');
    return crypto.randomBytes(length).toString('hex');
  }

  // Client-side: use Web Crypto API
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);

  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Mask sensitive data for logging
 *
 * @param data - Data to mask
 * @param visibleChars - Number of characters to show at start/end
 */
export function maskSensitiveData(
  data: string,
  visibleChars: number = 4
): string {
  if (data.length <= visibleChars * 2) {
    return '*'.repeat(data.length);
  }

  const start = data.slice(0, visibleChars);
  const end = data.slice(-visibleChars);
  const masked = '*'.repeat(data.length - visibleChars * 2);

  return `${start}${masked}${end}`;
}

/**
 * Detect potential SQL injection patterns
 *
 * This is not a complete solution, but catches obvious attempts
 */
export function containsSqlInjection(input: string): boolean {
  const sqlPatterns = [
    /(\bselect\b|\binsert\b|\bupdate\b|\bdelete\b|\bdrop\b|\bcreate\b|\balter\b)/i,
    /(\bexec\b|\bexecute\b|\bunion\b)/i,
    /(--|;|\/\*|\*\/|xp_)/i,
  ];

  return sqlPatterns.some((pattern) => pattern.test(input));
}

/**
 * Detect potential XSS patterns
 */
export function containsXssPattern(input: string): boolean {
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/i,
    /javascript:/i,
    /on\w+\s*=/i, // Event handlers like onclick=
    /<iframe/i,
    /<object/i,
    /<embed/i,
  ];

  return xssPatterns.some((pattern) => pattern.test(input));
}

/**
 * Validate password strength
 *
 * Returns validation result with specific requirements
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Calculate strength
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  if (errors.length === 0) {
    if (password.length >= 12) {
      strength = 'strong';
    } else {
      strength = 'medium';
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    strength,
  };
}

/**
 * Content Security Policy (CSP) directives generator
 *
 * Use this to generate CSP headers for your API routes
 */
export function generateCSP(): string {
  const directives = {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Adjust as needed
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'https:'],
    'font-src': ["'self'", 'data:'],
    'connect-src': ["'self'"],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
  };

  return Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
}

export default {
  sanitizeHtml,
  sanitizeText,
  isValidEmail,
  isValidUrl,
  isValidUuid,
  sanitizeRedirectUrl,
  RateLimiter,
  validateFile,
  generateSecureRandomString,
  maskSensitiveData,
  containsSqlInjection,
  containsXssPattern,
  validatePasswordStrength,
  generateCSP,
};