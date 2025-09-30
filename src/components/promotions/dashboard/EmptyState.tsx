import { Card, CardContent, CardHeader, CardDescription, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EmptyState = () => {
  const navigate = useNavigate();

  return (
    <Card className='w-full'>
      <CardHeader>
        <CardTitle>Promotions</CardTitle>
        <CardDescription>You don't have any active promotions yet</CardDescription>
      </CardHeader>
      <CardContent className='flex flex-col items-center justify-center py-10'>
        <div className='rounded-full bg-muted p-6 mb-4'>
          <BarChart3 className='h-10 w-10 text-muted-foreground' />
        </div>
        <h3 className='text-xl font-medium mb-2'>Start promoting your content</h3>
        <p className='text-muted-foreground text-center max-w-md mb-6'>
          Get more visibility for your events, venues, or services by creating a promotion campaign.
        </p>
        <Button onClick={() => navigate('/create-promotion')}>
          <Plus className='mr-2 h-4 w-4' />
          Create Promotion
        </Button>
      </CardContent>
    </Card>
  );
};

export default EmptyState;
