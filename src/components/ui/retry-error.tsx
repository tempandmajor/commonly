import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface RetryErrorProps {
  title?: string | undefined;
  message?: string | undefined;
  onRetry?: () => void | undefined;
  className?: string | undefined;
}

export const RetryError = ({
  title = 'Something went wrong',
  message = "We couldn't load the data you requested. Please try again.",
  onRetry,
  className = '',
}: RetryErrorProps) => {
  return (
    <Alert variant='destructive' className={`my-4 ${className}`}>
      <AlertCircle className='h-4 w-4' />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className='flex flex-col gap-4'>
        <p>{message}</p>
        {onRetry && (
          <Button
            size='sm'
            variant='outline'
            onClick={onRetry}
            className='flex items-center gap-2 self-start'
          >
            <RefreshCw className='h-4 w-4' />
            Try again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};
