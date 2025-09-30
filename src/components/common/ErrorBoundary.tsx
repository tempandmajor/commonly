import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Home, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  children: ReactNode;
  fallback?: ReactNode | undefined;
  onError?: (error: Error, errorInfo: ErrorInfo) => void | undefined;
  navigate?: (path: string) => void | undefined; // For navigation from HOC wrapper
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to monitoring service
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, send to error reporting service
    if ((import.meta as any).env?.MODE === 'production') {
      // TODO: Integrate with error reporting service (Sentry, LogRocket, etc.)
      this.reportError(error, errorInfo);
    }
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // Placeholder for error reporting service integration
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    console.error('Error Report:', errorReport);
    // In real implementation, send to your error tracking service
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    // Use the navigate prop if provided (from HOC), otherwise fall back to window.location
    if (this.props.navigate) {
      this.props.navigate('/');
    } else {
      // Fallback for when React Router context is not available
      window.location.href = '/';
    }
  };

  handleReportIssue = () => {
    const subject = encodeURIComponent('Error Report - Commonly App');
    const body = encodeURIComponent(
      `I encountered an error on Commonly:\n\n` +
        `Error: ${this.state.error?.message}\n` +
        `Page: ${window.location.href}\n` +
        `Time: ${new Date().toISOString()}\n\n` +
        `Please describe what you were doing when this error occurred:`
    );
    window.open(`mailto:support@commonly.app?subject=${subject}&body=${body}`);
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
          <Card className='max-w-lg w-full'>
            <CardHeader className='text-center'>
              <div className='mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4'>
                <AlertTriangle className='h-6 w-6 text-gray-600' />
              </div>
              <CardTitle className='text-xl text-gray-900'>Something went wrong</CardTitle>
              <CardDescription>
                We're sorry, but something unexpected happened. Our team has been notified.
              </CardDescription>
            </CardHeader>

            <CardContent className='space-y-4'>
              <Alert>
                <AlertTriangle className='h-4 w-4' />
                <AlertTitle>Error Details</AlertTitle>
                <AlertDescription className='text-sm font-mono bg-gray-50 p-2 rounded mt-2'>
                  {this.state.error?.message || 'Unknown error occurred'}
                </AlertDescription>
              </Alert>

              <div className='flex flex-col sm:flex-row gap-3'>
                <Button onClick={this.handleRetry} className='flex-1'>
                  <RefreshCw className='h-4 w-4 mr-2' />
                  Try Again
                </Button>

                <Button onClick={this.handleGoHome} className='flex-1 border'>
                  <Home className='h-4 w-4 mr-2' />
                  Go Home
                </Button>
              </div>

              <Button onClick={this.handleReportIssue} className='w-full border h-8 text-sm'>
                <Mail className='h-4 w-4 mr-2' />
                Report this issue
              </Button>

              {(import.meta as any).env?.MODE === 'development' && this.state.errorInfo && (
                <details className='mt-4'>
                  <summary className='cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-800'>
                    Technical Details (Development)
                  </summary>
                  <pre className='mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40'>
                    {this.state.error?.stack}
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

// Higher-order component for easier usage
export function withErrorBoundary<P>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
): React.ComponentType<P> {
  const displayName = Component.displayName || Component.name || 'Component';

  function WithErrorBoundary(props: P): JSX.Element {
    // Use React Router's navigation hook
    const navigate = useNavigate();

    return (
      <ErrorBoundary {...errorBoundaryProps} navigate={path => navigate(path)}>
        <Component {...(props as any)} />
      </ErrorBoundary>
    );
  }

  WithErrorBoundary.displayName = `WithErrorBoundary(${displayName})`;
  return WithErrorBoundary;
}
