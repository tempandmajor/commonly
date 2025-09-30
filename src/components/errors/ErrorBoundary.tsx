/**
 * React Error Boundary Component
 *
 * Catches JavaScript errors anywhere in the component tree,
 * logs them, and displays a fallback UI instead of crashing.
 *
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  fallback?: ReactNode | undefined;
  onError?: (error: Error, errorInfo: ErrorInfo) => void | undefined;
  showDetails?: boolean | undefined;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 *
 * Automatically reports errors to Sentry if configured
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught an error:', error, errorInfo);
    }

    // Report to Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Update state with error info
    this.setState({
      errorInfo,
    });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <div className="max-w-md w-full space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription>
                We're sorry, but something unexpected happened. The error has been
                reported to our team.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button onClick={this.handleReset} className="flex-1">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button
                onClick={() => (window.location.href = '/')}
                variant="outline"
                className="flex-1"
              >
                Go Home
              </Button>
            </div>

            {(this.props.showDetails || (process.env.NODE_ENV as string) === 'development') &&
              this.state.error && (
                <details className="mt-4 p-4 bg-gray-100 rounded-md text-sm">
                  <summary className="cursor-pointer font-semibold mb-2">
                    Error Details (Development Only)
                  </summary>
                  <pre className="overflow-auto text-xs text-red-600">
                    {this.state.error.toString()}
                  </pre>
                  {this.state.errorInfo && (
                    <pre className="overflow-auto text-xs mt-2">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </details>
              )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Route Error Boundary
 *
 * Specialized error boundary for route-level errors
 * Shows a more user-friendly message with navigation options
 */
export function RouteErrorBoundary({ children }: { children: ReactNode }): JSX.Element {
  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="flex justify-center">
              <AlertTriangle className="h-16 w-16 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold">Page Error</h1>
            <p className="text-gray-600">
              This page encountered an error and couldn't be displayed.
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => window.location.reload()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reload Page
              </Button>
              <Button onClick={() => (window.location.href = '/')} variant="outline">
                Go Home
              </Button>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Feature Error Boundary
 *
 * Specialized error boundary for optional features
 * Gracefully degrades when a feature fails
 */
export function FeatureErrorBoundary({
  children,
  featureName,
}: {
  children: ReactNode;
  featureName: string;
}): JSX.Element {
  return (
    <ErrorBoundary
      fallback={
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Feature Unavailable</AlertTitle>
          <AlertDescription>
            The {featureName} feature is temporarily unavailable. Please try again later.
          </AlertDescription>
        </Alert>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

export default ErrorBoundary;