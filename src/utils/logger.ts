/**
 * Comprehensive logging utility for the application
 * Provides structured logging with different levels and context
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  component?: string | undefined;
  userId?: string | undefined;
  sessionId?: string | undefined;
  action?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
  [key: string]: unknown; // Allow any additional properties
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context: LogContext;
  stack?: string | undefined;
}

class Logger {
  private context: LogContext;
  private isEnabled: boolean;

  constructor(component?: string, baseContext?: LogContext) {
    this.context = {
      component,
          ...baseContext,
    };
    this.isEnabled =
      process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ENABLE_LOGGING === 'true';
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    additionalContext?: LogContext
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: {
          ...this.context,
          ...additionalContext,
      },
          ...(level === 'error' ? { stack: new Error().stack } : {}),
    };
  }

  private formatMessage(entry: LogEntry): string {
    const { level, message, timestamp, context } = entry;
    const hasContext = Object.keys(context).length > 0;
    const contextStr = hasContext ? ` [${JSON.stringify(context)}]` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
  }

  private sendToAnalytics(entry: LogEntry) {
    // Send to external logging service in production
    if (
      process.env.NODE_ENV === 'production' &&
      process.env.NEXT_PUBLIC_LOGGING_ENDPOINT
    ) {
      fetch(process.env.NEXT_PUBLIC_LOGGING_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      }).catch(() => {
        // Silently fail - don't break the app if logging fails
      });
    }
  }

  debug(message: string, context?: LogContext) {
    if (!this.isEnabled) return;

    const entry = this.createLogEntry('debug', message, context);

    this.sendToAnalytics(entry);
  }

  info(message: string, context?: LogContext) {
    if (!this.isEnabled) return;

    const entry = this.createLogEntry('info', message, context);
    console.info(this.formatMessage(entry));
    this.sendToAnalytics(entry);
  }

  warn(message: string, context?: LogContext) {
    const entry = this.createLogEntry('warn', message, context);

    this.sendToAnalytics(entry);
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    const entry = this.createLogEntry('error', message, {
          ...context,
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : error,
    });

    this.sendToAnalytics(entry);
  }

  withContext(additionalContext: LogContext): Logger {
    return new Logger(this.context.component, {
          ...this.context,
          ...additionalContext,
    });
  }
}

// Create logger factory
export const createLogger = (component?: string, context?: LogContext): Logger => {
  return new Logger(component, context);
};

// Default logger instance
export const logger = createLogger('app');

// Performance logging utilities
export const logPerformance = (name: string, duration: number, context?: LogContext) => {
  const performanceLogger = createLogger('performance');
  performanceLogger.info(`${name} completed in ${duration.toFixed(2)}ms`, context);
};

export const logPerformanceSummary = (timeWindowMinutes: number = 5) => {
  const performanceLogger = createLogger('performance');
  performanceLogger.info(`Performance summary for last ${timeWindowMinutes} minutes`, {
    action: 'performance_summary',
    timeWindow: timeWindowMinutes,
  });
};

// Error boundary logging
export const logErrorBoundary = (error: Error, errorInfo: unknown, component?: string) => {
  const errorLogger = createLogger('error-boundary');
  errorLogger.error(`Error boundary caught error in ${component || 'unknown component'}`, error, {
    errorInfo,
    component,
  });
};

// API logging utilities
export const logApiCall = (
  method: string,
  url: string,
  duration: number,
  status: number,
  context?: LogContext
) => {
  const apiLogger = createLogger('api');
  const level = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'info';

  apiLogger[level](`${method} ${url} - ${status} (${duration}ms)`, {
          ...context,
    method,
    url,
    status,
    duration,
  });
};

// User action logging
export const logUserAction = (
  action: string,
  userId?: string,
  metadata?: Record<string, unknown>
) => {
  const userLogger = createLogger('user-action');
  userLogger.info(`User action: ${action}`, {
    action,
    userId,
    metadata,
  });
};

export default Logger;
