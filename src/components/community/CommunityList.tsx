import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Community {
  id: string;
  name: string;
  description: string;
  memberCount: number;
}

export interface CommunityListProps {
  communities: Community[];
  loading: boolean;
  onCreateClick: () => void;
}

const CommunityList = ({ communities, loading, onCreateClick }: CommunityListProps) => {
  if (loading) {
    return <div>Loading communities...</div>;
  }

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <h2 className='text-2xl font-bold'>Communities</h2>
        <Button onClick={onCreateClick}>Create Community</Button>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {communities.map(community => (
          <Card key={community.id}>
            <CardHeader>
              <CardTitle>{community.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-sm text-muted-foreground mb-2'>{community.description}</p>
              <p className='text-xs text-muted-foreground'>{community.memberCount} members</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {communities.length === 0 && (
        <Card>
          <CardContent className='text-center py-8'>
            <p className='text-muted-foreground'>No communities found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CommunityList;
