import { Card, CardContent } from '@/components/ui/card';
import { FeedItem as FeedItemType } from './types';

interface FeedItemProps {
  item: FeedItemType;
}

const FeedItem = ({ item }: FeedItemProps) => {
  return (
    <Card className='overflow-hidden'>
      <CardContent className='p-6'>
        <h3 className='font-semibold text-lg'>
          {item.type === 'event' ? 'Event Post' : item.type === 'update' ? 'Update' : 'User Post'}
        </h3>
        <p className='text-muted-foreground mt-2'>
          {JSON.stringify(item.content).substring(0, 100)}...
        </p>
      </CardContent>
    </Card>
  );
};

export default FeedItem;
