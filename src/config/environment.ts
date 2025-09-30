/**
 * Environment Configuration
 * Centralized configuration with validation for all environment variables
 * Rebuilt with proper TypeScript types and syntax
 */

export type Environment = 'development' | 'staging' | 'production';

export interface EnvironmentConfig {
  // Supabase Configuration
  supabase: {
    url: string;
    anonKey: string;
    projectId: string;
  };

  // Application URLs
  app: {
    url: string;
    apiUrl: string;
    baseUrl: string;
    frontendUrl: string;
  };

  // Third-party Services
  google: {
    apiKey: string;
  };

  openai?: {
    apiKey: string;
  };

  cloudinary: {
    preset: string;
    name: string;
    apiKey: string;
  };

  stripe?: {
    publishableKey: string;
    secretKey?: string;
    webhookSecret?: string;
  };

  livekit: {
    url: string;
    apiKey: string;
    apiSecret: string;
  };

  // Feature Flags
  features: {
    useMocks: boolean;
    enableAnalytics: boolean;
    enableDebugMode: boolean;
  };

  // Admin
  admin: {
    accessCode: string;
  };

  // Build Information
  build: {
    version: string;
    timestamp: string;
    commitHash: string;
  };

  // Sentry
  sentry?: {
    dsn: string;
    environment: string;
    release: string;
  };

  // Environment
  environment: Environment;
  isDevelopment: boolean;
  isProduction: boolean;
  isStaging: boolean;
}

interface ValidationResult {
  errors: string[];
  warnings: string[];
}

/**
 * Get environment variable with type safety
 */
function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  return value ?? defaultValue ?? '';
}

/**
 * Get boolean environment variable
 */
function getBooleanEnvVar(key: string, defaultValue: boolean = false): boolean {
  const value = process.env[key];
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
}

/**
 * Check if we're running in a browser environment
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Get the current origin if in browser, empty string otherwise
 */
function getCurrentOrigin(): string {
  return isBrowser() ? window.location.origin : '';
}

/**
 * Validates that required environment variables are present
 * Returns warnings instead of errors in production to prevent build failures
 */
function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const currentEnv = getEnvVar('NODE_ENV', 'development');
  const isProduction = currentEnv === 'production';

  // Core required variables (critical for app functionality)
  const coreRequired = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ] as const;

  for (const key of coreRequired) {
    const value = getEnvVar(key);
    if (!value) {
      const message = `Missing critical environment variable: ${key}`;
      if (isProduction) {
        // In production, treat as error so we can surface misconfiguration
        errors.push(message);
      } else {
        // In development, log as warning but don't fail
        warnings.push(message);
      }
    }
  }

  // Optional but recommended variables
  const recommended = [
    'NEXT_PUBLIC_SUPABASE_PROJECT_ID',
    'NEXT_PUBLIC_GOOGLE_API_KEY',
    'NEXT_PUBLIC_APP_URL',
    'NEXT_PUBLIC_SENTRY_DSN',
  ] as const;

  for (const key of recommended) {
    const value = getEnvVar(key);
    if (!value && isProduction) {
      warnings.push(
        `Missing recommended environment variable: ${key} (some features may be disabled)`
      );
    }
  }

  // Validate URL formats for critical URLs
  const urlVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_APP_URL',
    'NEXT_PUBLIC_LIVEKIT_URL',
  ] as const;

  for (const key of urlVars) {
    const value = getEnvVar(key);
    if (value && !isValidUrl(value)) {
      warnings.push(`Invalid URL format for ${key}: ${value}`);
    }
  }

  return { errors, warnings };
}

/**
 * Simple URL validation
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Create optional configuration object
 */
function createOptionalConfig<T>(condition: boolean, config: T): T | undefined {
  return condition ? config : undefined;
}

/**
 * Get validated environment configuration with graceful fallbacks
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const { errors, warnings } = validateEnvironment();

  // Log warnings in all environments
  if (warnings.length > 0) {
    console.warn('Environment validation warnings:');
    warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  // Never throw on client; log as errors but allow app to continue with degraded functionality
  if (errors.length > 0) {
    console.error('Environment validation errors:');
    errors.forEach(error => console.error(`  - ${error}`));

    // In production with critical errors, we might want to show a fallback UI
    if (process.env.NODE_ENV === 'production') {
      console.error('Critical environment variables missing. Some features may not work correctly.');
    }
  }

  const environment = (getEnvVar('NODE_ENV', 'development')) as Environment;

  // Determine environment with proper fallbacks
  const normalizedEnv: Environment =
    environment === 'production' ? 'production' :
    environment === 'staging' ? 'staging' :
    'development';

  const isDevelopment = normalizedEnv === 'development';
  const isProduction = normalizedEnv === 'production';
  const isStaging = normalizedEnv === 'staging';

  // Build configuration object with proper type safety
  const config: EnvironmentConfig = {
    supabase: {
      url: getEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
      anonKey: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
      projectId: getEnvVar('NEXT_PUBLIC_SUPABASE_PROJECT_ID'),
    },

    app: {
      url: getEnvVar('NEXT_PUBLIC_APP_URL') || getCurrentOrigin(),
      apiUrl: getEnvVar('NEXT_PUBLIC_API_URL'),
      baseUrl: getEnvVar('NEXT_PUBLIC_BASE_URL') || getCurrentOrigin(),
      frontendUrl: getEnvVar('NEXT_PUBLIC_FRONTEND_URL') || getCurrentOrigin(),
    },

    google: {
      apiKey: getEnvVar('NEXT_PUBLIC_GOOGLE_API_KEY'),
    },

    openai: createOptionalConfig(
      !!getEnvVar('NEXT_PUBLIC_OPENAI_API_KEY'),
      {
        apiKey: getEnvVar('NEXT_PUBLIC_OPENAI_API_KEY'),
      }
    ),

    cloudinary: {
      preset: getEnvVar('NEXT_PUBLIC_CLOUDINARY_PRESET'),
      name: getEnvVar('NEXT_PUBLIC_CLOUDINARY_NAME'),
      apiKey: getEnvVar('NEXT_PUBLIC_CLOUDINARY_API_KEY'),
    },

    stripe: createOptionalConfig(
      !!getEnvVar('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'),
      {
        publishableKey: getEnvVar('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'),
        secretKey: getEnvVar('STRIPE_SECRET_KEY'),
        webhookSecret: getEnvVar('STRIPE_WEBHOOK_SECRET'),
      }
    ),

    livekit: {
      url: getEnvVar('NEXT_PUBLIC_LIVEKIT_URL'),
      apiKey: getEnvVar('NEXT_PUBLIC_LIVEKIT_API_KEY'),
      apiSecret: getEnvVar('NEXT_PUBLIC_LIVEKIT_API_SECRET'),
    },

    features: {
      useMocks: getBooleanEnvVar('NEXT_PUBLIC_USE_MOCKS', isDevelopment),
      enableAnalytics: getBooleanEnvVar('NEXT_PUBLIC_ENABLE_ANALYTICS', isProduction),
      enableDebugMode: getBooleanEnvVar('NEXT_PUBLIC_DEBUG_MODE', isDevelopment),
    },

    admin: {
      accessCode: getEnvVar('NEXT_PUBLIC_ADMIN_ACCESS_CODE', 'COMMONLY-ADMIN-2024'),
    },

    build: {
      version: getEnvVar('NEXT_PUBLIC_APP_VERSION', '1.0.0'),
      timestamp: getEnvVar('NEXT_PUBLIC_BUILD_TIMESTAMP', new Date().toISOString()),
      commitHash: getEnvVar('NEXT_PUBLIC_COMMIT_HASH', 'local'),
    },

    sentry: createOptionalConfig(
      !!getEnvVar('NEXT_PUBLIC_SENTRY_DSN'),
      {
        dsn: getEnvVar('NEXT_PUBLIC_SENTRY_DSN'),
        environment: normalizedEnv,
        release: getEnvVar('NEXT_PUBLIC_APP_VERSION', '1.0.0'),
      }
    ),

    environment: normalizedEnv,
    isDevelopment,
    isProduction,
    isStaging,
  };

  return config;
}

/**
 * Check if all required environment variables are present
 */
export function hasRequiredEnvironmentVars(): boolean {
  const { errors } = validateEnvironment();
  return errors.length === 0;
}

/**
 * Get environment-specific configuration
 */
export function getEnvironmentSpecificConfig() {
  const config = getEnvironmentConfig();

  return {
    // API URLs
    apiBaseUrl: config.app.apiUrl || `${config.app.baseUrl}/api`,

    // Feature flags
    shouldUseMocks: config.features.useMocks,
    shouldTrackAnalytics: config.features.enableAnalytics,
    isDebugModeEnabled: config.features.enableDebugMode,

    // Service availability
    hasOpenAI: !!config.openai,
    hasStripe: !!config.stripe,
    hasSentry: !!config.sentry,

    // Environment checks
    isClientSide: isBrowser(),
    isServerSide: !isBrowser(),
  };
}

// Export singleton instance with lazy initialization
let environmentConfig: EnvironmentConfig | null = null;

export function getEnvironment(): EnvironmentConfig {
  if (!environmentConfig) {
    environmentConfig = getEnvironmentConfig();
  }
  return environmentConfig;
}

// Export common environment variables for convenient access
export const env = getEnvironment();

// Export individual environment flags for convenience
export const isProduction = env.isProduction;
export const isDevelopment = env.isDevelopment;
export const isStaging = env.isStaging;

// Export validation function for use in startup checks
export { validateEnvironment };

// Re-export types for external use
export type { ValidationResult };