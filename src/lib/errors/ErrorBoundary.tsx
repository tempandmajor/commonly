/**
 * Enhanced Error Boundary with centralized error handling
 */

import React, { Component, ReactNode } from 'react';
import { ErrorHandler } from './ErrorHandler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode | undefined;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void | undefined;
}

interface State {
  hasError: boolean;
  error?: Error | undefined;
}

export class ErrorBoundary extends Component<Props, State> {
  private errorHandler: ErrorHandler;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
    this.errorHandler = ErrorHandler.getInstance();
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Handle the error with our centralized system
    const appError = this.errorHandler.handleError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Update state with error
    this.setState({ error });
  }

  render() {
    if (this.state.hasError) {
      // Show custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className='min-h-screen flex items-center justify-center bg-gray-50'>
          <div className='max-w-md w-full bg-white shadow-lg rounded-lg p-6'>
            <div className='flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full'>
              <svg
                className='w-6 h-6 text-red-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z'
                />
              </svg>
            </div>
            <div className='mt-4 text-center'>
              <h3 className='text-lg font-medium text-gray-900'>Something went wrong</h3>
              <p className='mt-2 text-sm text-gray-500'>
                We're sorry, but something unexpected happened. Please try refreshing the page.
              </p>
              <div className='mt-6'>
                <button
                  onClick={() => window.location.reload()}
                  className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                >
                  Refresh Page
                </button>
              </div>
              {process.env.NODE_ENV as string === 'development' && this.state.error && (
                <details className='mt-4 text-left'>
                  <summary className='cursor-pointer text-sm text-gray-600'>
                    Error Details (Development)
                  </summary>
                  <pre className='mt-2 text-xs text-red-600 bg-red-50 p-3 rounded overflow-auto'>
                    {this.state.error.message}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook for handling async errors in function components
 */
export const useAsyncError = () => {
  const [, setError] = React.useState();

  return React.useCallback(
    (error: unknown) => {
      setError(() => {
        throw error;
      });
    },
    [setError]
  );
};
