import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import App from './App.tsx';
import './index.css';
import { runHealthCheck, quickHealthCheck } from '@/utils/healthCheck';
import { performanceMonitor, logPerformanceSummary } from '@/utils/performanceMonitor';
import { env } from '@/config/environment';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { HelmetProvider } from 'react-helmet-async';
import { TooltipProvider } from '@/components/ui/tooltip';

// Initialize Sentry if configured
import * as Sentry from '@sentry/react';
if (env.sentry?.dsn) {
  Sentry.init({
    dsn: env.sentry.dsn,
    environment: env.sentry.environment,
    release: env.sentry.release,
    tracesSampleRate: 0.05,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.1,
  });
}

// Initialize performance monitoring
import './utils/performance';

// PRODUCTION MODE: No mocks, no MSW
// Production mode: Using real implementations only

// Initialize logging system
import { createLogger } from '@/utils/logger';
const logger = createLogger('main');

// Create a client with production-optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as { status: number }).status;
          if (status >= 400 && status < 500) {
            return false;
          }
        }
        return failureCount < 3;
      },
    },
  },
});

// Enhanced error handling for uncaught errors
window.addEventListener('error', event => {
  // Check for subscription errors and handle them gracefully
  if (event.error.message?.includes('subscribe multiple times')) {
    // Prevent the error from crashing the app
    event.preventDefault();
    return;
  }

  // Filter out development tool errors that don't affect functionality
  if (env.isDevelopment) {
    const errorMessage = event.error.message || event.message || '';
    const shouldIgnore = [
      '_sandbox/dev-server',
      'lovableproject.com',
      'componentTagger',
      'WebSocket connection failed',
      'Failed to fetch chrome-extension',
      'Non-Error promise rejection captured',
      // Storage bucket creation errors (non-critical)
      'storage/v1/bucket',
      'Payload too large',
      'exceeded the maximum allowed size',
      '413',
      // Table not found errors (happens during development)
      'saved_events',
      'public.saved_events?select=*',
      '404 (Not Found)',
    ].some(pattern => errorMessage.includes(pattern));

    if (shouldIgnore) {
      // Log as debug info instead of error for development tools
      console.debug('Development tool notice (non-critical):', errorMessage);
      event.preventDefault();
      return;
    }
  }

  logger.error('Uncaught error:', event.error);
});

window.addEventListener('unhandledrejection', event => {
  // Filter out development-specific promise rejections
  if (env.isDevelopment) {
    const reason = event.reason?.message || event.reason?.toString() || '';
    const shouldIgnore = [
      '_sandbox/dev-server',
      'lovableproject.com',
      'WebSocket connection',
      'Failed to fetch',
      // Storage bucket creation errors (non-critical)
      'storage/v1/bucket',
      'Payload too large',
      'exceeded the maximum allowed size',
      '413',
      // Table not found errors (happens during development)
      'saved_events',
      'public.saved_events?select=*',
      '404 (Not Found)',
    ].some(pattern => reason.includes(pattern));

    if (shouldIgnore) {
      console.debug('Development tool rejection (non-critical):', reason);
      event.preventDefault();
      return;
    }
  }

  logger.error('Unhandled promise rejection:', event.reason);
});

// Initialize performance monitoring
const initStartTime = performance.now();

// Initialize app with health checks
async function initializeApp() {
  try {
    // Quick health check for critical services
    const isHealthy = await quickHealthCheck();

    if (!isHealthy && env.isProduction) {
      logger.warn('Health check failed in production, continuing with degraded functionality');
    }

    // Run full health check in background
    if (env.isDevelopment) {
      runHealthCheck()
        .then(health => {
          if (health.overall !== 'healthy') {
            logger.warn('Some services are not fully healthy:', { healthStatus: health.overall });
          }
        })
        .catch(error => {
          logger.warn('Health check failed:', error);
        });
    }

    // Record initialization time
    const initTime = performance.now() - initStartTime;
    performanceMonitor.recordMetric('app:initialization', initTime);

    logger.info(`App initialized successfully in ${initTime.toFixed(2)}ms`);

    // Log performance summary in development after 10 seconds
    if (env.isDevelopment) {
      setTimeout(() => {
        logPerformanceSummary(1); // Last 1 minute
      }, 10000);
    }
  } catch (error) {
    logger.error('App initialization failed:', error);
    // Continue anyway - the app might still work with degraded functionality
  }
}

// Initialize the app
initializeApp();

try {
  const rootElement = document.getElementById('root') as HTMLElement;
  if (!rootElement) {
    throw new Error('Root element not found');
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <ErrorBoundary>
      <HelmetProvider>
        <TooltipProvider>
          <QueryClientProvider client={queryClient}>
            <App />
            <Toaster />
          </QueryClientProvider>
        </TooltipProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
} catch (error) {
  logger.error('Failed to render app:', error);
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: monospace; max-width: 600px; margin: 50px auto; border: 1px solid #ccc; border-radius: 8px;">
      <h1 style="color: #d32f2f;">Application Error</h1>
      <p>We're sorry, but the application encountered an error and couldn't start properly.</p>
      <details style="margin: 20px 0;">
        <summary style="cursor: pointer; font-weight: bold;">Error Details</summary>
        <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; overflow: auto;">${error}</pre>
      </details>
      <p>Please try refreshing the page. If the problem persists, contact support.</p>
      <button onclick="window.location.reload()" style="background: #1976d2; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">
        Refresh Page
      </button>
    </div>
  `;
}
