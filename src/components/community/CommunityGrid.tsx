import React, { memo } from 'react';
import { CommunityCard } from './CommunityCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { CommunityWithMemberStatus } from '@/services/community/types';

interface CommunityGridProps {
  communities: CommunityWithMemberStatus[];
  isLoading: boolean;
  viewMode: 'grid' | 'list';
  onJoinCommunity?: (communityId: string) => void | undefined;
  emptyStateTitle?: string | undefined;
  emptyStateDescription?: string | undefined;
  showCreateButton?: boolean | undefined;
}

const CommunityGrid = memo<CommunityGridProps>(({
  communities,
  isLoading,
  viewMode,
  onJoinCommunity,
  emptyStateTitle = 'No communities found',
  emptyStateDescription = 'Try adjusting your search or filters, or be the first to create one!',
  showCreateButton = true,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (isLoading) {
    return (
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className='overflow-hidden border border-gray-200'>
            <Skeleton className='h-32 w-full' />
            <div className='p-4 space-y-3'>
              <Skeleton className='h-4 w-3/4' />
              <Skeleton className='h-3 w-full' />
              <Skeleton className='h-3 w-2/3' />
              <div className='flex gap-2'>
                <Skeleton className='h-5 w-16' />
                <Skeleton className='h-5 w-20' />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!communities || communities.length === 0) {
    return (
      <div className='text-center py-12'>
        <Users className='mx-auto h-12 w-12 text-gray-400 mb-4' />
        <h3 className='text-lg font-medium text-[#2B2B2B] mb-2'>{emptyStateTitle}</h3>
        <p className='text-gray-600 mb-6 max-w-md mx-auto'>
          {emptyStateDescription}
        </p>
        {showCreateButton && user && (
          <Button
            onClick={() => navigate('/community/create')}
            className='bg-[#2B2B2B] hover:bg-gray-800 text-white'
          >
            <Plus className='w-4 h-4 mr-2' />
            Create Community
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
      {communities.map(community => (
        <CommunityCard
          key={community.id}
          community={community}
          onJoin={onJoinCommunity}
          viewMode={viewMode}
        />
      ))}
    </div>
  );
});

CommunityGrid.displayName = 'CommunityGrid';

export default CommunityGrid;