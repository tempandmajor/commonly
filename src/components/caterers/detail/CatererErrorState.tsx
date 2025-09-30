import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

interface CatererErrorStateProps {
  error?: Error | undefined| unknown;
  refetch?: () => void | undefined;
}

export const CatererErrorState: React.FC<CatererErrorStateProps> = ({ error, refetch }) => {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

  return (
    <Card className='max-w-md mx-auto my-12'>
      <CardContent className='pt-6 text-center'>
        <AlertCircle className='h-12 w-12 text-destructive mx-auto mb-4' />
        <h2 className='text-2xl font-bold mb-2'>Caterer not found</h2>
        <p className='text-muted-foreground mb-6'>
          {error && errorMessage.includes('not found')
            ? "The caterer you're looking for doesn't exist or has been removed."
            : `We encountered a problem loading this caterer${error ? `: ${errorMessage}` : ''}`}
        </p>
      </CardContent>
      <CardFooter className='flex justify-center space-x-4'>
        {refetch && (
          <Button variant='outline' onClick={() => refetch()}>
            Try Again
          </Button>
        )}
        <Button asChild>
          <Link to='/caterers'>Browse Available Caterers</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CatererErrorState;
