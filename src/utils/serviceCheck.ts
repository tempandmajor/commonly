/**
 * Utility functions to validate service configuration and connectivity
 */

import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Define a consistent structure for all service check results
export interface ServiceCheckResult {
  success: boolean;
  message: string;
  duration?: number | undefined;
  timestamp?: number | undefined;
}

// Define the environment configuration check result type
export interface EnvironmentCheckResult extends ServiceCheckResult {
  missingVars?: string[];
}

// Define the network check result type
export interface NetworkCheckResult extends ServiceCheckResult {
  latency?: number;
}

// Define the comprehensive service check result
export interface ComprehensiveCheckResult {
  supabase: ServiceCheckResult;
  auth: ServiceCheckResult;
  storage: ServiceCheckResult;
  stripe: ServiceCheckResult;
  environment: EnvironmentCheckResult;
  network: NetworkCheckResult;
  allValid: boolean;
  timestamp: number;
  duration: number;
}

// Performance tracking helpers
const startTimeMeasure = () => performance.now();
const endTimeMeasure = (startTime: number) => Math.round(performance.now() - startTime);

/**
 * Checks if Supabase is properly initialized and connected
 */
export async function checkSupabaseConnection(): Promise<ServiceCheckResult> {
  const startTime = startTimeMeasure();
  try {
    // Test Supabase connection by attempting to query a small collection
    const { error } = await supabase.from('users').select('id').limit(1);

    if (error) throw error;

    const duration = endTimeMeasure(startTime);

    return {
      success: true,
      message: 'Supabase connection successful',
      duration,
      timestamp: Date.now(),
    };
  } catch (error) {
    const duration = endTimeMeasure(startTime);

    return {
      success: false,
      message: `Supabase connection failed: ${error instanceof Error ? error.message : String(error) as string}`,
      duration,
      timestamp: Date.now(),
    };
  }
}

/**
 * Checks if Supabase Auth is properly initialized
 */
export async function checkAuthConnection(): Promise<ServiceCheckResult> {
  const startTime = startTimeMeasure();
  try {
    // Check if we can access the auth session
    const { data: session } = await supabase.auth.getSession();
    const authStatus = session?.session ? 'authenticated' : 'not authenticated';

    const duration = endTimeMeasure(startTime);

    return {
      success: true,
      message: `Supabase Auth connection successful (user: ${authStatus})`,
      duration,
      timestamp: Date.now(),
    };
  } catch (error) {
    const duration = endTimeMeasure(startTime);

    return {
      success: false,
      message: `Supabase Auth connection failed: ${error instanceof Error ? error.message : String(error) as string}`,
      duration,
      timestamp: Date.now(),
    };
  }
}

/**
 * Checks if Supabase Storage is properly initialized and connected
 */
export async function checkStorageConnection(): Promise<ServiceCheckResult> {
  const startTime = startTimeMeasure();
  try {
    // List buckets to test the storage connection
    const { error } = await supabase.storage.listBuckets();

    if (error) throw error;

    const duration = endTimeMeasure(startTime);

    return {
      success: true,
      message: 'Supabase Storage connection successful',
      duration,
      timestamp: Date.now(),
    };
  } catch (error) {
    const duration = endTimeMeasure(startTime);

    return {
      success: false,
      message: `Supabase Storage connection failed: ${error instanceof Error ? error.message : String(error) as string}`,
      duration,
      timestamp: Date.now(),
    };
  }
}

/**
 * Checks if Stripe environment variables are properly configured
 */
export function checkStripeConfiguration(): ServiceCheckResult {
  const startTime = startTimeMeasure();

  // Next.js uses process.env with NEXT_PUBLIC_ prefix for client-side vars
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  if (!publishableKey) {
    const duration = endTimeMeasure(startTime);

    return {
      success: false,
      message: 'Stripe publishable key is missing. Please check your environment variables.',
      duration,
      timestamp: Date.now(),
    };
  }

  // Check if the key format is valid (basic check)
  if (!publishableKey.startsWith('pk_')) {
    const duration = endTimeMeasure(startTime);

    return {
      success: false,
      message: "Stripe publishable key appears to be invalid. It should start with 'pk_'.",
      duration,
      timestamp: Date.now(),
    };
  }

  const duration = endTimeMeasure(startTime);

  return {
    success: true,
    message: 'Stripe configuration appears valid',
    duration,
    timestamp: Date.now(),
  };
}

/**
 * Checks if essential environment variables are configured
 */
export function checkEnvironmentConfiguration(): EnvironmentCheckResult {
  const startTime = startTimeMeasure();

  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'NEXT_PUBLIC_LIVEKIT_URL',
    'NEXT_PUBLIC_LIVEKIT_API_KEY',
    'NEXT_PUBLIC_LIVEKIT_API_SECRET',
  ] as const;

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  const duration = endTimeMeasure(startTime);

  if (missingVars.length > 0) {
    return {
      success: false,
      message: `Missing required environment variables: ${missingVars.join(', ')}`,
      missingVars,
      duration,
      timestamp: Date.now(),
    };
  }

  return {
    success: true,
    message: 'All required environment variables are configured',
    duration,
    timestamp: Date.now(),
  };
}

/**
 * Performs a network connectivity check
 */
export async function checkNetworkConnectivity(): Promise<NetworkCheckResult> {
  const startTime = startTimeMeasure();
  try {
    // Use Google as a reliable endpoint to check connectivity
    const response = await fetch('https://www.google.com', {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store',
    });

    const latency = endTimeMeasure(startTime);

    return {
      success: true,
      message: `Network connectivity test successful, latency: ${latency}ms`,
      latency,
      timestamp: Date.now(),
    };
  } catch (error) {
    const duration = endTimeMeasure(startTime);

    return {
      success: false,
      message: 'Network connectivity test failed. Please check your internet connection.',
      latency: duration, // Use duration as latency for failed request
      timestamp: Date.now(),
    };
  }
}

/**
 * Comprehensive check of all service integrations
 */
export async function checkAllServices(): Promise<ComprehensiveCheckResult> {
  const overallStartTime = startTimeMeasure();

  // Run all checks in parallel for efficiency
  const [supabaseCheck, authCheck, storageCheck, networkCheck] = await Promise.allSettled([
    checkSupabaseConnection(),
    checkAuthConnection(),
    checkStorageConnection(),
    checkNetworkConnectivity(),
  ]);

  // These don't need to be async
  const stripeCheck = checkStripeConfiguration();
  const envCheck = checkEnvironmentConfiguration();

  // Process results, handling any rejected promises
  const getResult = <T extends ServiceCheckResult>(
    result: PromiseSettledResult<T>,
    fallbackMessage: string
  ): T => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        success: false,
        message: `${fallbackMessage}: ${result.reason instanceof Error ? result.reason.message : String(result.reason) as string}`,
        timestamp: Date.now(),
      } as unknown as T;
    }
  };

  const supabase = getResult(supabaseCheck, 'Supabase check failed');
  const auth = getResult(authCheck, 'Auth check failed');
  const storage = getResult(storageCheck, 'Storage check failed');
  const network = getResult(networkCheck, 'Network check failed') as NetworkCheckResult;

  const allValid =
    supabase.success &&
    auth.success &&
    storage.success &&
    stripeCheck.success &&
    envCheck.success &&
    network.success;

  const overallDuration = endTimeMeasure(overallStartTime);

  // Return comprehensive results
  return {
    supabase,
    auth,
    storage,
    stripe: stripeCheck,
    environment: envCheck,
    network,
    allValid,
    timestamp: Date.now(),
    duration: overallDuration,
  };
}

/**
 * Displays service check results as toast notifications
 */
export function displayServiceCheckResults(
  results: ComprehensiveCheckResult,
  showSuccessToasts = false
): void {
  const environment = process.env.NODE_ENV;
  const isDev = environment !== 'production';

  // Always log the full results

  if (!results.allValid) {
    // For failed checks, always show errors
    if (!results.supabase.success) {
      toast.error(`Supabase: ${results.supabase.message}`);
    }

    if (!results.auth.success) {
      toast.error(`Auth: ${results.auth.message}`);
    }

    if (!results.storage.success) {
      toast.error(`Storage: ${results.storage.message}`);
    }

    if (!results.stripe.success) {
      toast.error(`Stripe: ${results.stripe.message}`);
    }

    if (!results.environment.success) {
      toast.error(`Environment: ${results.environment.message}`);
    }

    if (!results.network.success) {
      toast.error(`Network: ${results.network.message}`);
    }
  } else if (showSuccessToasts && isDev) {
    // In development, optionally show success toasts
    toast.success(`All services are running correctly! (${results.duration}ms)`);
  }

  // Show a warning for high latency even if the check passed
  if (results.network.success && results.network.latency && results.network.latency > 500) {
    toast.warning(`High network latency (${results.network.latency}ms) may affect performance.`);
  }

  // Log performance metrics for specific services
  const performanceThresholds = {
    supabase: 300, // ms
    auth: 200, // ms
    storage: 250, // ms
    network: 500, // ms
  };

  if (results.supabase.duration && results.supabase.duration > performanceThresholds.supabase) {
    // Optionally emit a warning or log
  }

  if (results.auth.duration && results.auth.duration > performanceThresholds.auth) {
    // Optionally emit a warning or log
  }

  if (results.storage.duration && results.storage.duration > performanceThresholds.storage) {
    // Optionally emit a warning or log
  }
}
