/**
 * Centralized Error Handling System
 * Provides consistent error handling, logging, and user feedback
 */

export interface AppError {
  code: string;
  message: string;
  details?: unknown | undefined;
  timestamp: Date;
  userId?: string | undefined;
  context?: Record<string, unknown> | undefined;
}

export enum ErrorCode {
  // Authentication errors
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  AUTH_INVALID = 'AUTH_INVALID',
  AUTH_EXPIRED = 'AUTH_EXPIRED',

  // User errors
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_INVALID_DATA = 'USER_INVALID_DATA',

  // Database errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  DATABASE_TIMEOUT = 'DATABASE_TIMEOUT',

  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',

  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',

  // Generic errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: AppError[] = [];

  private constructor() {}

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle and log an error
   */
  public handleError(error: unknown, context?: Record<string, unknown>): AppError {
    const appError = this.createAppError(error, context);
    this.logError(appError);
    return appError;
  }

  /**
   * Create a standardized AppError from any error type
   */
  private createAppError(error: unknown, context?: Record<string, unknown>): AppError {
    const timestamp = new Date();

    if (error instanceof Error) {
      return {
        code: this.mapErrorToCode(error),
        message: error.message,
        details: error.stack,
        timestamp,
        context,
      };
    }

    if (typeof error === 'string') {
      return {
        code: ErrorCode.UNKNOWN_ERROR,
        message: error,
        timestamp,
        context,
      };
    }

    return {
      code: ErrorCode.UNKNOWN_ERROR,
      message: 'An unexpected error occurred',
      details: error,
      timestamp,
      context,
    };
  }

  /**
   * Map specific error types to error codes
   */
  private mapErrorToCode(error: Error): string {
    const message = error.message.toLowerCase();

    if (message.includes('unauthorized') || message.includes('auth')) {
      return ErrorCode.AUTH_REQUIRED;
    }

    if (message.includes('not found')) {
      return ErrorCode.USER_NOT_FOUND;
    }

    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorCode.VALIDATION_ERROR;
    }

    if (message.includes('network') || message.includes('fetch')) {
      return ErrorCode.NETWORK_ERROR;
    }

    if (message.includes('timeout')) {
      return ErrorCode.NETWORK_TIMEOUT;
    }

    return ErrorCode.UNKNOWN_ERROR;
  }

  /**
   * Log error to console and store in memory
   */
  private logError(error: AppError): void {
    // Store in memory (limited to last 100 errors)
    this.errorLog.push(error);
    if (this.errorLog.length > 100) {
      this.errorLog.shift();
    }

    // Console logging
    console.error('ErrorHandler:', {
      code: error.code,
      message: error.message,
      timestamp: error.timestamp,
      context: error.context,
    });

    // In production, you might want to send to external logging service
    if (process.env.NODE_ENV as string === 'production') {
      // Send to logging service (Sentry, LogRocket, etc.)
      this.sendToLoggingService(error);
    }
  }

  /**
   * Send error to external logging service
   */
  private sendToLoggingService(error: AppError): void {
    // Implementation would depend on your logging service
    // Example: Sentry, LogRocket, etc.
    try {
      // Placeholder for external service
      console.log('Sending to logging service:', error.code);
    } catch (loggingError) {
      // Don't let logging errors break the app
      console.warn('Failed to send error to logging service:', loggingError);
    }
  }

  /**
   * Get user-friendly error message
   */
  public getUserMessage(error: AppError): string {
    switch (error.code) {
      case ErrorCode.AUTH_REQUIRED:
        return 'Please log in to continue';
      case ErrorCode.AUTH_INVALID:
        return 'Invalid credentials. Please try again';
      case ErrorCode.USER_NOT_FOUND:
        return 'User not found';
      case ErrorCode.NETWORK_ERROR:
        return 'Network connection issue. Please check your internet connection';
      case ErrorCode.VALIDATION_ERROR:
        return 'Please check your input and try again';
      case ErrorCode.DATABASE_TIMEOUT:
        return 'The request is taking longer than expected. Please try again';
      default:
        return 'Something went wrong. Please try again';
    }
  }

  /**
   * Get recent errors (for debugging)
   */
  public getRecentErrors(limit = 10): AppError[] {
    return this.errorLog.slice(-limit);
  }

  /**
   * Clear error log
   */
  public clearErrorLog(): void {
    this.errorLog = [];
  }
}

/**
 * Utility function for easy error handling
 */
export const handleError = (error: unknown, context?: Record<string, unknown>): AppError => {
  return ErrorHandler.getInstance().handleError(error, context);
};

/**
 * Utility function to get user-friendly error message
 */
export const getUserErrorMessage = (error: AppError): string => {
  return ErrorHandler.getInstance().getUserMessage(error);
};

/**
 * React hook for error handling
 */
export const useErrorHandler = () => {
  const errorHandler = ErrorHandler.getInstance();

  return {
    handleError: errorHandler.handleError.bind(errorHandler),
    getUserMessage: errorHandler.getUserMessage.bind(errorHandler),
    getRecentErrors: errorHandler.getRecentErrors.bind(errorHandler),
  };
};
