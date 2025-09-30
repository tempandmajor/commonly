/**
 * Service initialization and health check
 */

import { toast } from 'sonner';
import {
  checkAllServices,
  displayServiceCheckResults,
  ComprehensiveCheckResult,
  EnvironmentCheckResult,
} from '@/utils/serviceCheck';
import { initializeErrorTracking } from '@/utils/environmentCheck';
import { getCurrentEnvironment } from '@/utils/environmentConfig';
import { getBuildInfo } from '@/utils/buildConfig';

// Track initialization state
let servicesInitialized = false;
let initializationInProgress = false;
let lastHealthCheckTime: number | null = null;
const HEALTH_CHECK_INTERVAL = 15 * 60 * 1000; // 15 minutes

/**
 * Initialize all required services for the application
 * @returns Promise resolving to initialization success status
 */
export async function initializeServices(): Promise<boolean> {
  // Prevent multiple concurrent initialization attempts
  if (initializationInProgress) {
    return new Promise(resolve => {
      const checkInterval = setInterval(() => {
        if (servicesInitialized || !initializationInProgress) {
          clearInterval(checkInterval);
          resolve(servicesInitialized);
        }
      }, 500);
    });
  }

  // If already initialized, just return the success status
  if (servicesInitialized) {
    return true;
  }

  initializationInProgress = true;
  const environment = getCurrentEnvironment();
  const buildInfo = getBuildInfo();

  try {
    const initStartTime = performance.now();

    // Initialize error tracking if in production or staging
    initializeErrorTracking();

    // Check all third-party services with timeout protection
    const serviceCheckPromise = checkAllServices();

    // Add timeout to prevent hanging if a service check never resolves
    const timeoutPromise = new Promise<ComprehensiveCheckResult>((_, reject) => {
      setTimeout(() => reject(new Error('Service check timeout exceeded')), 10000); // 10-second timeout
    });

    // Race between service check and timeout
    const serviceStatus = await Promise.race([serviceCheckPromise, timeoutPromise]).catch(error => {
      toast.error(
        'Some services failed to respond in time. The app will try to function with limited features.'
      );

      // Return a partial result with failures indicated - ensuring all required fields are present
      return {
        supabase: { success: false, message: 'Check timed out', timestamp: Date.now() },
        auth: { success: false, message: 'Check timed out', timestamp: Date.now() },
        storage: { success: false, message: 'Check timed out', timestamp: Date.now() },
        stripe: { success: false, message: 'Check timed out', timestamp: Date.now() },
        environment: {
          success: true,
          message: 'Environment variables loaded',
          timestamp: Date.now(),
        } as EnvironmentCheckResult,
        network: {
          success: true,
          message: 'Network available',
          latency: 999,
          timestamp: Date.now(),
        },
        allValid: false,
        timestamp: Date.now(),
        duration: 0,
      } as ComprehensiveCheckResult;
    });

    // Display results based on environment
    const showSuccessToasts = environment === 'development';
    displayServiceCheckResults(serviceStatus, showSuccessToasts);

    // Record the initialization time
    const initEndTime = performance.now();
    const initDuration = Math.round(initEndTime - initStartTime);
    if (initDuration > 3000) {
    }

    if (!serviceStatus.allValid) {
      // Critical failures that prevent the app from functioning properly
      const hasMissingVars =
        serviceStatus.environment &&
        !serviceStatus.environment.success &&
        serviceStatus.environment.missingVars;

      const criticalMissingVars =
        hasMissingVars &&
        (serviceStatus.environment.missingVars?.includes('VITE_SUPABASE_URL') ||
          serviceStatus.environment.missingVars?.includes('VITE_SUPABASE_ANON_KEY'));

      const criticalFailures = [
        serviceStatus.supabase.success === false,
        serviceStatus.auth.success === false,
        hasMissingVars && criticalMissingVars,
      ];

      if (criticalFailures.some(failure => failure === true)) {
        if (environment !== 'production') {
          toast.error(
            'Critical service failures detected. Application may not function correctly.'
          );
        }

        servicesInitialized = false;
        initializationInProgress = false;
        return false;
      }

      // Non-critical failures - application can still run with reduced functionality
      if (environment !== 'production') {
        toast.warning('Some services are unavailable. Certain features may not work correctly.');
      }
    }

    // Check for high network latency
    if (serviceStatus.network.latency && serviceStatus.network.latency > 1000) {
      if (environment === 'development') {
        toast.warning(
          `High network latency (${serviceStatus.network.latency}ms) may affect performance`
        );
      }
    }

    // Schedule periodic health checks in production and staging
    if (environment === 'production' || environment === 'staging') {
      setupPeriodicHealthChecks();
    }

    lastHealthCheckTime = Date.now();
    servicesInitialized = true;
    initializationInProgress = false;

    return true;
  } catch (error) {
    toast.error('Failed to initialize services. The app may not function correctly.');

    servicesInitialized = false;
    initializationInProgress = false;
    return false;
  }
}

/**
 * Setup periodic health checks in production environments
 */
function setupPeriodicHealthChecks() {
  // Use regular interval for health checks
  setInterval(async () => {
    try {
      const quietCheck = true; // Don't show toasts for periodic checks
      const serviceStatus = await checkAllServices();

      // Only log results, don't show toasts to users
      if (!serviceStatus.allValid) {
        // Only show toast in case of critical failures
        const hasCriticalFailures = !serviceStatus.supabase.success || !serviceStatus.auth.success;

        if (hasCriticalFailures) {
          toast.error(
            'Some critical services are unavailable. Please contact support if problems persist.'
          );
        }
      }

      lastHealthCheckTime = Date.now();
    } catch (error) {}
  }, HEALTH_CHECK_INTERVAL);
}

/**
 * A health check function that can be called at any time to verify service status
 * @param showToasts Whether to display toast notifications with results
 * @returns Promise resolving to health check success status
 */
export async function performHealthCheck(showToasts: boolean = true): Promise<boolean> {
  if (showToasts) {
    toast.info('Running health check...');
  }

  try {
    const serviceStatus = await checkAllServices();
    displayServiceCheckResults(serviceStatus, showToasts);

    lastHealthCheckTime = Date.now();
    return serviceStatus.allValid;
  } catch (error) {
    if (showToasts) {
      toast.error('Health check failed. Some services may be unavailable.');
    }

    return false;
  }
}

/**
 * Get information about service initialization status
 */
export function getServiceStatus() {
  return {
    initialized: servicesInitialized,
    initializationInProgress,
    lastHealthCheck: lastHealthCheckTime ? new Date(lastHealthCheckTime) : null,
  };
}
