/**
 * Centralized Production-Ready Logger
 * Replaces scattered console.log/error statements with structured logging
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any> | undefined;
  error?: Error | undefined;
  userId?: string | undefined;
  sessionId?: string | undefined;
}

class Logger {
  private static instance: Logger;
  private readonly environment: string;
  private readonly isProduction: boolean;
  private readonly isDevelopment: boolean;
  private logBuffer: LogEntry[] = [];
  private readonly maxBufferSize = 100;

  private constructor() {
    this.environment = process.env.NODE_ENV as string || 'development';
    this.isProduction = this.environment === 'production';
    this.isDevelopment = this.environment === 'development';
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Debug level logging - only in development
   */
  public debug(message: string, context?: Record<string, any>): void {
    if (this.isDevelopment) {
      this.log(LogLevel.DEBUG, message, context);
    }
  }

  /**
   * Info level logging
   */
  public info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Warning level logging
   */
  public warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Error level logging
   */
  public error(message: string, error?: Error | unknown, context?: Record<string, any>): void {
    const errorObj = error instanceof Error ? error : undefined;
    this.log(LogLevel.ERROR, message, context, errorObj);
  }

  /**
   * Fatal level logging - critical errors that require immediate attention
   */
  public fatal(message: string, error?: Error | unknown, context?: Record<string, any>): void {
    const errorObj = error instanceof Error ? error : undefined;
    this.log(LogLevel.FATAL, message, context, errorObj);

    // In production, you might want to send alerts for fatal errors
    if (this.isProduction) {
      this.sendAlert(message, errorObj, context);
    }
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
    };

    // Add to buffer
    this.addToBuffer(entry);

    // Console output (formatted for readability)
    this.outputToConsole(entry);

    // Send to external service in production
    if (this.isProduction && (level === LogLevel.ERROR || level === LogLevel.FATAL)) {
      this.sendToLoggingService(entry);
    }
  }

  /**
   * Add log entry to buffer
   */
  private addToBuffer(entry: LogEntry): void {
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }
  }

  /**
   * Output to console with proper formatting
   */
  private outputToConsole(entry: LogEntry): void {
    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`;
    const message = `${prefix} ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.context || '');
        break;
      case LogLevel.INFO:
        console.info(message, entry.context || '');
        break;
      case LogLevel.WARN:
        console.warn(message, entry.context || '');
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(message, entry.error || entry.context || '');
        if (entry.error?.stack && this.isDevelopment) {
          console.error(entry.error.stack);
        }
        break;
    }
  }

  /**
   * Send logs to external logging service (Sentry, DataDog, etc.)
   */
  private sendToLoggingService(entry: LogEntry): void {
    try {
      // Implement your logging service integration here
      // Example: Sentry.captureException, DataDog API, etc.

      // For now, we'll use a simple fetch to a logging endpoint
      // This should be replaced with your actual logging service
      if (typeof window !== 'undefined' && window.navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(entry)], { type: 'application/json' });
        // navigator.sendBeacon('/api/logs', blob);
      }
    } catch (error) {
      // Fail silently - don't break the app if logging fails
      console.error('Failed to send log to external service:', error);
    }
  }

  /**
   * Send alert for critical errors
   */
  private sendAlert(message: string, error?: Error, context?: Record<string, any>): void {
    try {
      // Implement alert system (PagerDuty, Slack, email, etc.)
      // This is a placeholder for your alerting logic
      console.error('CRITICAL ALERT:', message, error, context);
    } catch (alertError) {
      console.error('Failed to send alert:', alertError);
    }
  }

  /**
   * Get recent logs for debugging
   */
  public getRecentLogs(count = 50): LogEntry[] {
    return this.logBuffer.slice(-count);
  }

  /**
   * Clear log buffer
   */
  public clearLogs(): void {
    this.logBuffer = [];
  }

  /**
   * Create a child logger with default context
   */
  public child(defaultContext: Record<string, any>): ChildLogger {
    return new ChildLogger(this, defaultContext);
  }
}

/**
 * Child logger with inherited context
 */
class ChildLogger {
  constructor(
    private parent: Logger,
    private defaultContext: Record<string, any>
  ) {}

  public debug(message: string, context?: Record<string, any>): void {
    this.parent.debug(message, { ...this.defaultContext, ...context });
  }

  public info(message: string, context?: Record<string, any>): void {
    this.parent.info(message, { ...this.defaultContext, ...context });
  }

  public warn(message: string, context?: Record<string, any>): void {
    this.parent.warn(message, { ...this.defaultContext, ...context });
  }

  public error(message: string, error?: Error | unknown, context?: Record<string, any>): void {
    this.parent.error(message, error, { ...this.defaultContext, ...context });
  }

  public fatal(message: string, error?: Error | unknown, context?: Record<string, any>): void {
    this.parent.fatal(message, error, { ...this.defaultContext, ...context });
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export typed logger for specific domains
export const createLogger = (domain: string) => {
  return logger.child({ domain });
};

// Common domain loggers
export const authLogger = createLogger('auth');
export const dbLogger = createLogger('database');
export const apiLogger = createLogger('api');
export const paymentLogger = createLogger('payment');

// Export types
export type { ChildLogger };