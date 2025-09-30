import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const ConnectLoading: React.FC = () => {
  return (
    <div className='max-w-md mx-auto mt-8'>
      <Card>
        <CardHeader>
          <CardTitle>Loading Account Status</CardTitle>
        </CardHeader>
        <CardContent className='flex items-center justify-center py-8'>
          <Loader2 className='h-8 w-8 animate-spin' />
        </CardContent>
      </Card>
    </div>
  );
};

export default ConnectLoading;
