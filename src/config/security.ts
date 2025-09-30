/**
 * Security Configuration
 * Centralized security settings for the application
 */

export const SECURITY_CONFIG = {
  // Rate limiting
  rateLimit: {
    maxRequests: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
    payment: {
      maxRequests: 10,
      windowMs: 60 * 1000, // 1 minute
    },
  },

  // Content Security Policy
  csp: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://js.stripe.com'],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      fontSrc: ["'self'", 'data:'],
      connectSrc: [
        "'self'",
        'https://*.supabase.co',
        'wss://*.supabase.co',
        'https://api.stripe.com',
      ],
      frameSrc: ["'self'", 'https://js.stripe.com', 'https://hooks.stripe.com'],
    },
  },

  // Input validation
  validation: {
    maxInputLength: 10000,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    maxImageSize: 5 * 1024 * 1024, // 5MB
  },

  // Session management
  session: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    refreshThreshold: 24 * 60 * 60 * 1000, // 1 day
  },

  // Password requirements
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
  },
} as const;

/**
 * Sanitize user input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';

  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate input length
 */
export function validateInputLength(input: string, maxLength?: number): boolean {
  const max = maxLength || SECURITY_CONFIG.validation.maxInputLength;
  return input.length <= max;
}

/**
 * Check if a file type is allowed
 */
export function isAllowedFileType(fileType: string): boolean {
  return SECURITY_CONFIG.validation.allowedImageTypes.includes(fileType);
}

/**
 * Check if a file size is within limits
 */
export function isValidFileSize(fileSize: number): boolean {
  return fileSize <= SECURITY_CONFIG.validation.maxFileSize;
}
