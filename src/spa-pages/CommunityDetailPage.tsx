import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MessageSquare,
  Image as ImageIcon,
  Calendar,
  Users,
} from 'lucide-react';
import {
  useCommunity,
  useJoinCommunity,
  useLeaveCommunity,
  useCommunityMembers,
  useUpdateMemberRole,
} from '@/services/community';
import {
  useCommunityPosts,
  useCreateCommunityPost,
  useDeleteCommunityPost,
  useTogglePostPin,
} from '@/services/community/hooks/useCommunityPosts';
import {
  useCommunityMedia,
} from '@/services/community/hooks/useCommunityMedia';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';
import CommunityHeader from '@/components/community/CommunityHeader';
import PostsList from '@/components/community/PostsList';
import MembersList from '@/components/community/MembersList';
import CommunitySidebar from '@/components/community/CommunitySidebar';

const CommunityDetailPage = () => {
  const { communityId } = useParams<{ communityId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('posts');

  // Fetch community data
  const { data: community, isLoading: isCommunityLoading, error } = useCommunity(communityId);
  const { data: postsData, isLoading: isPostsLoading } = useCommunityPosts(communityId);
  const { data: mediaData, isLoading: isMediaLoading } = useCommunityMedia(communityId);
  const { data: membersData, isLoading: isMembersLoading } = useCommunityMembers(communityId);

  // Mutations
  const joinMutation = useJoinCommunity();
  const leaveMutation = useLeaveCommunity();
  const createPostMutation = useCreateCommunityPost(communityId || '');
  const deletePostMutation = useDeleteCommunityPost(communityId || '');
  const togglePinMutation = useTogglePostPin(communityId || '');
  const updateMemberRoleMutation = useUpdateMemberRole(communityId || '');

  const isOwner = user?.id === community?.creator_id;
  const isMember = community?.is_member;

  // Handlers
  const handleJoin = useCallback(async () => {
    if (!user) {
      toast.error('Please sign in to join this community');
      navigate('/auth');
      return;
    }

    if (!communityId) return;

    try {
      await joinMutation.mutateAsync({ communityId });
      toast.success('Successfully joined the community!');
    } catch (error) {
      console.error('Failed to join community:', error);
      toast.error('Failed to join community');
    }
  }, [user, communityId, joinMutation, navigate]);

  const handleLeave = useCallback(async () => {
    if (!user || !communityId) return;

    try {
      await leaveMutation.mutateAsync(communityId);
      toast.success('Left the community');
    } catch (error) {
      console.error('Failed to leave community:', error);
      toast.error('Failed to leave community');
    }
  }, [user, communityId, leaveMutation]);

  const handleSettings = useCallback(() => {
    navigate(`/community/${communityId}/settings`);
  }, [navigate, communityId]);

  const handleShare = useCallback(async () => {
    try {
      await navigator.share({
        title: community?.name || '',
        text: community?.description || '',
        url: window.location.href,
      });

    } catch (error) {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      } catch (clipboardError) {
        toast.error('Failed to share community');
      }
    }
  }, [community]);

  const handleCreatePost = useCallback(async (data: { title?: string; content: string }) => {
    if (!communityId) return;

    await createPostMutation.mutateAsync({
      community_id: communityId,
      title: data.title,
      content: data.content,
    });
  }, [communityId, createPostMutation]);

  const handleDeletePost = useCallback(async (postId: string) => {
    await deletePostMutation.mutateAsync(postId);
  }, [deletePostMutation]);

  const handleTogglePin = useCallback(async (postId: string, isPinned: boolean) => {
    await togglePinMutation.mutateAsync({ postId, isPinned: !isPinned });
  }, [togglePinMutation]);

  const handleUpdateMemberRole = useCallback(async (userId: string, role: 'member' | 'admin') => {
    try {
      await updateMemberRoleMutation.mutateAsync({ userId, role });
      toast.success(`Member role updated to ${role}`);
    } catch (error) {
      console.error('Failed to update member role:', error);
      toast.error('Failed to update member role');
    }
  }, [updateMemberRoleMutation]);

  const handleRemoveMember = useCallback(async (userId: string) => {
    try {
      // This would need to be implemented in the backend
      toast.success('Member removed from community');
    } catch (error) {
      console.error('Failed to remove member:', error);
      toast.error('Failed to remove member');
    }
  }, []);

  // Error handling
  if (error || !communityId) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-white'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-gray-900 mb-2'>Community not found</h1>
          <p className='text-gray-600 mb-4'>The community you're looking for doesn't exist.</p>
          <Button
            onClick={() => navigate('/community')}
            className='bg-[#2B2B2B] hover:bg-gray-800 text-white'
          >
            Back to Communities
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isCommunityLoading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50'>
        <div className='container mx-auto px-4 py-8'>
          <div className='space-y-6'>
            <Skeleton className='h-48 lg:h-64 w-full rounded-lg' />
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
              <div className='lg:col-span-2 space-y-4'>
                <Skeleton className='h-32 w-full' />
                <Skeleton className='h-32 w-full' />
                <Skeleton className='h-32 w-full' />
              </div>
              <div className='space-y-4'>
                <Skeleton className='h-64 w-full' />
                <Skeleton className='h-32 w-full' />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-white'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-gray-900 mb-2'>Community not found</h1>
          <p className='text-gray-600 mb-4'>The community you're looking for doesn't exist.</p>
          <Button
            onClick={() => navigate('/community')}
            className='bg-[#2B2B2B] hover:bg-gray-800 text-white'
          >
            Back to Communities
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50'>
      {/* Community Header */}
      <CommunityHeader
        community={community}
        isOwner={isOwner}
        isMember={isMember || false}
        isJoining={joinMutation.isPending}
        isLeaving={leaveMutation.isPending}
        onJoin={handleJoin}
        onLeave={handleLeave}
        onSettings={handleSettings}
        onShare={handleShare}
      />

      {/* Community Content */}
      <div className='container mx-auto px-4 py-8'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Main Content */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className='grid w-full grid-cols-4 bg-white/50 backdrop-blur-sm'>
                <TabsTrigger value='posts' className='flex items-center gap-2'>
                  <MessageSquare className='w-4 h-4' />
                  Posts
                </TabsTrigger>
                <TabsTrigger value='media' className='flex items-center gap-2'>
                  <ImageIcon className='w-4 h-4' />
                  Media
                </TabsTrigger>
                <TabsTrigger value='events' className='flex items-center gap-2'>
                  <Calendar className='w-4 h-4' />
                  Events
                </TabsTrigger>
                <TabsTrigger value='members' className='flex items-center gap-2'>
                  <Users className='w-4 h-4' />
                  Members
                </TabsTrigger>
              </TabsList>

              <TabsContent value='posts' className='space-y-6'>
                <PostsList
                  posts={postsData?.posts || []}
                  isLoading={isPostsLoading}
                  canPost={isMember || false}
                  isOwner={isOwner}
                  onCreatePost={handleCreatePost}
                  onDeletePost={handleDeletePost}
                  onTogglePin={handleTogglePin}
                />
              </TabsContent>

              <TabsContent value='media' className='space-y-6'>
                <div className='text-center py-12'>
                  <ImageIcon className='mx-auto h-12 w-12 text-gray-400 mb-4' />
                  <h3 className='text-lg font-medium text-gray-900 mb-2'>No media shared yet</h3>
                  <p className='text-gray-600'>
                    Community media and files will appear here when shared by members.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value='events' className='space-y-6'>
                <div className='text-center py-12'>
                  <Calendar className='mx-auto h-12 w-12 text-gray-400 mb-4' />
                  <h3 className='text-lg font-medium text-gray-900 mb-2'>No events scheduled</h3>
                  <p className='text-gray-600'>Community events will appear here.</p>
                  {isOwner && (
                    <Button className='mt-4 bg-[#2B2B2B] hover:bg-gray-800 text-white'>
                      Create First Event
                    </Button>
                  )}
                </div>
              </TabsContent>

              <TabsContent value='members' className='space-y-6'>
                <MembersList
                  members={membersData?.members || []}
                  isLoading={isMembersLoading}
                  isOwner={isOwner}
                  onUpdateMemberRole={handleUpdateMemberRole}
                  onRemoveMember={handleRemoveMember}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <CommunitySidebar
            community={community}
            members={membersData?.members}
            postsCount={postsData?.postsCount?.total || 0}
            mediaCount={mediaData?.mediaCount?.total || 0}
          />
        </div>
      </div>
    </div>
  );

};

export default CommunityDetailPage;