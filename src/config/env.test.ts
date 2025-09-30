/**
 * Environment Configuration Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';

describe('Environment Configuration', () => {
  beforeEach(() => {
    // Ensure test environment variables are set
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    process.env.NEXT_PUBLIC_GOOGLE_API_KEY = 'test-google-key';
    process.env.NEXT_PUBLIC_CLOUDINARY_PRESET = 'test-preset';
    process.env.NEXT_PUBLIC_CLOUDINARY_NAME = 'test-cloud';
    process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY = 'test-key';
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_123';
  });

  it('should validate required environment variables', () => {
    // This will be tested by importing the env module
    // If validation fails, it will throw an error
    expect(() => require('./env')).not.toThrow();
  });

  it('should have valid Supabase URL format', () => {
    const { env } = require('./env');
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toMatch(/^https?:\/\//);
  });

  it('should have Stripe key in correct format', () => {
    const { env } = require('./env');
    expect(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY).toMatch(/^pk_/);
  });
});