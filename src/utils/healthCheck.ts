/**
 * Health Check System
 * Monitors the health of all critical services and dependencies
 */

import { supabase } from '@/integrations/supabase/client';
import { env } from '@/config/environment';

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  error?: string | undefined;
  details?: Record<string, unknown> | undefined;
  timestamp: number;
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  services: HealthCheckResult[];
  timestamp: number;
}

/**
 * Check Supabase connection health
 */
async function checkSupabaseHealth(): Promise<HealthCheckResult> {
  const startTime = performance.now();

  try {
    // Use a simpler connection test that doesn't require table access
    // Test the auth service instead of querying tables
    const { data, error } = await supabase.auth.getSession();

    const responseTime = performance.now() - startTime;

    if (error && error.message !== 'Auth session missing!') {
      // Only treat real errors as unhealthy, not missing sessions
      return {
        service: 'supabase',
        status: 'unhealthy',
        responseTime,
        error: error!.message,
        timestamp: Date.now(),
      };
    }

    return {
      service: 'supabase',
      status: responseTime > 5000 ? 'degraded' : 'healthy',
      responseTime,
      details: {
        connected: true,
        sessionExists: !!data?.session,
      },
      timestamp: Date.now(),
    };
  } catch (error) {
    return {
      service: 'supabase',
      status: 'unhealthy',
      responseTime: performance.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now(),
    };
  }
}

/**
 * Check authentication service health
 */
async function checkAuthHealth(): Promise<HealthCheckResult> {
  const startTime = performance.now();

  try {
    const { data, error } = await supabase.auth.getSession();
    const responseTime = performance.now() - startTime;

    if (error) {
      return {
        service: 'auth',
        status: 'unhealthy',
        responseTime,
        error: error.message,
        timestamp: Date.now(),
      };
    }

    return {
      service: 'auth',
      status: responseTime > 3000 ? 'degraded' : 'healthy',
      responseTime,
      details: { sessionActive: !!data.session },
      timestamp: Date.now(),
    };
  } catch (error) {
    return {
      service: 'auth',
      status: 'unhealthy',
      responseTime: performance.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now(),
    };
  }
}

/**
 * Check environment configuration health
 */
async function checkEnvironmentHealth(): Promise<HealthCheckResult> {
  const startTime = performance.now();

  try {
    const errors: string[] = [];

    // Check required environment variables
    if (!env.supabase.url) errors.push('Missing Supabase URL');
    if (!env.supabase.anonKey) errors.push('Missing Supabase anon key');
    if (env.isProduction && !env.stripe.publishableKey)
      errors.push('Missing Stripe key in production');

    const responseTime = performance.now() - startTime;

    if (errors.length > 0) {
      return {
        service: 'environment',
        status: 'unhealthy',
        responseTime,
        error: errors.join(', '),
        timestamp: Date.now(),
      };
    }

    return {
      service: 'environment',
      status: 'healthy',
      responseTime,
      details: {
        environment: env.environment,
        version: env.build.version,
      },
      timestamp: Date.now(),
    };
  } catch (error) {
    return {
      service: 'environment',
      status: 'unhealthy',
      responseTime: performance.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now(),
    };
  }
}

/**
 * Check external services health (optional)
 */
async function checkExternalServicesHealth(): Promise<HealthCheckResult> {
  const startTime = performance.now();

  try {
    const checks: Promise<boolean>[] = [];

    // Skip external service checks in development to avoid unnecessary errors
    if (env.isDevelopment) {
      const responseTime = performance.now() - startTime;
      return {
        service: 'external',
        status: 'healthy',
        responseTime,
        details: {
          stripe: 'skipped_in_development',
          note: 'External checks disabled in development',
        },
        timestamp: Date.now(),
      };
    }

    // Check if we can reach Stripe (if configured) - use a more reliable endpoint
    if (env.stripe.publishableKey) {
      checks.push(
        fetch('https://js.stripe.com/v3/', { method: 'HEAD', mode: 'no-cors' })
          .then(() => true) // no-cors mode doesn't give us response status, so assume success
          .catch(() => false)
      );
    }

    const results = await Promise.all(checks);
    const responseTime = performance.now() - startTime;
    const allHealthy = results.length === 0 || results.every(r => r);

    return {
      service: 'external',
      status: allHealthy ? 'healthy' : 'degraded',
      responseTime,
      details: {
        stripe: env.stripe.publishableKey
          ? results[0]
            ? 'reachable'
            : 'unreachable'
          : 'not_configured',
      },
      timestamp: Date.now(),
    };
  } catch (error) {
    return {
      service: 'external',
      status: 'degraded',
      responseTime: performance.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now(),
    };
  }
}

/**
 * Run comprehensive health check with detailed logging
 */
export async function runHealthCheck(): Promise<SystemHealth> {
  const checks = await Promise.all([
    checkEnvironmentHealth(),
    checkSupabaseHealth(),
    checkAuthHealth(),
    checkExternalServicesHealth(),
  ]);

  // Determine overall health
  const unhealthyCount = checks.filter(c => c.status === 'unhealthy').length;
  const degradedCount = checks.filter(c => c.status === 'degraded').length;

  let overall: 'healthy' | 'degraded' | 'unhealthy';
  if (unhealthyCount > 0) {
    overall = 'unhealthy';
  } else if (degradedCount > 0) {
    overall = 'degraded';
  } else {
    overall = 'healthy';
  }

  const result: SystemHealth = {
    overall,
    services: checks,
    timestamp: Date.now(),
  };

  // Enhanced logging with detailed diagnostics

  checks.forEach(check => {
    const emoji = check.status === 'healthy' ? '✅' : check.status === 'degraded' ? '⚠️' : '❌';

    if (check.error) {
    }

    if (check.details) {
    }

    // Service-specific diagnostics
    if (check.service === 'supabase' && check.status !== 'healthy') {
    }

    if (check.service === 'auth' && check.status !== 'healthy') {
    }

    if (check.service === 'external' && check.status !== 'healthy') {
    }
  });

  // Additional environment diagnostics if degraded
  if (overall !== 'healthy') {
  }

  return result;
}

/**
 * Quick health check for startup
 */
export async function quickHealthCheck(): Promise<boolean> {
  try {
    const envCheck = await checkEnvironmentHealth();
    const supabaseCheck = await checkSupabaseHealth();

    return envCheck.status !== 'unhealthy' && supabaseCheck.status !== 'unhealthy';
  } catch (error) {
    return false;
  }
}

/**
 * Get health status color for UI display
 */
export function getHealthStatusColor(status: HealthCheckResult['status']): string {
  switch (status) {
    case 'healthy':
      return 'green';
    case 'degraded':
      return 'yellow';
    case 'unhealthy':
      return 'red';
    default:
      return 'gray';
  }
}

/**
 * Format health check results for logging
 */
export function formatHealthReport(health: SystemHealth): string {
  const lines = [
    `Overall Health: ${health.overall.toUpperCase()}`,
    `Timestamp: ${new Date(health.timestamp).toISOString()}`,
    '',
    'Service Details:',
  ];

  health.services.forEach(check => {
    const responseTime = check.responseTime ? ` (${Math.round(check.responseTime)}ms)` : '';
    const error = check.error ? ` - ${check.error}` : '';
    lines.push(`  ${check.service}: ${check.status.toUpperCase()}${responseTime}${error}`);
  });

  return lines.join('\n');
}
