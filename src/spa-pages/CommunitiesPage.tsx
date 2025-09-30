import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Plus,
  TrendingUp,
  Star,
  Zap,
  Shield,
  HelpCircle,
  Info,
  Heart,
  MessageCircle,
  Calendar,
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { useFeaturedCommunities, useUserMemberships } from '@/services/community';
import { useCommunitySearch } from '@/hooks/useCommunitySearch';
import CommunityGrid from '@/components/community/CommunityGrid';
import CommunityFilters from '@/components/community/CommunityFilters';

const CommunitiesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showInfo, setShowInfo] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const {
    filters,
    searchResults,
    isLoading: isSearching,
    updateSearch,
    updateCategory,
    updateSort,
    updatePrivacy,
    loadMore,
  } = useCommunitySearch();

  const { data: featuredCommunities, isLoading: isFeaturedLoading } = useFeaturedCommunities(6);
  const { data: userMemberships, isLoading: isMembershipsLoading } = useUserMemberships();

  const handleJoinCommunity = useCallback((communityId: string) => {
    // Trigger refetch of search results and user memberships
    window.location.reload(); // Simple solution - in production you'd want proper cache invalidation
  }, []);

  const handleCreateCommunity = () => {
    navigate('/community/create');
  };

  const handleAuth = () => {
    navigate('/auth');
  };

  const scrollToDiscover = () => {
    const discoverTab = document.querySelector('[value="discover"]') as HTMLElement;
    discoverTab?.click();
  };

  return (
    <div className='min-h-screen bg-white text-[#2B2B2B]'>
      {/* Header */}
      <div className='bg-white border-b sticky top-0 z-40'>
        <div className='container mx-auto px-4 py-6'>
          <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
            <div className='flex-1'>
              <div className='flex items-center gap-3 mb-2'>
                <h1 className='text-3xl font-bold text-[#2B2B2B]'>Communities</h1>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setShowInfo(!showInfo)}
                  className='text-gray-500 hover:text-[#2B2B2B]'
                >
                  <HelpCircle className='h-4 w-4' />
                </Button>
              </div>
              <p className='text-gray-600'>
                Connect with like-minded people and grow together in spaces built around your
                passions
              </p>
            </div>

            <div className='flex gap-3'>
              {user ? (
                <Button
                  onClick={handleCreateCommunity}
                  className='bg-[#2B2B2B] hover:bg-gray-800 text-white'
                >
                  <Plus className='w-4 h-4 mr-2' />
                  Create Community
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleAuth}
                    className='bg-[#2B2B2B] hover:bg-gray-800 text-white'
                  >
                    Sign Up
                  </Button>
                  <Button
                    variant='outline'
                    onClick={handleAuth}
                    className='border-gray-300 text-[#2B2B2B] hover:bg-gray-50'
                  >
                    Sign In
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Collapsible Info Section */}
          {showInfo && (
            <div className='mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200'>
              <div className='flex items-start gap-3 mb-3'>
                <Info className='h-5 w-5 text-[#2B2B2B] mt-0.5 flex-shrink-0' />
                <div>
                  <h3 className='font-semibold text-[#2B2B2B] mb-2'>What are Communities?</h3>
                  <p className='text-gray-600 text-sm leading-relaxed mb-4'>
                    Communities are dedicated spaces where members engage in ongoing conversations,
                    share resources, attend exclusive events, and build meaningful connections
                    around shared interests or goals.
                  </p>

                  <div className='grid md:grid-cols-3 gap-3'>
                    <div className='flex items-center gap-2 text-sm'>
                      <MessageCircle className='h-4 w-4 text-[#2B2B2B]' />
                      <span>Ongoing discussions</span>
                    </div>
                    <div className='flex items-center gap-2 text-sm'>
                      <Calendar className='h-4 w-4 text-[#2B2B2B]' />
                      <span>Exclusive events</span>
                    </div>
                    <div className='flex items-center gap-2 text-sm'>
                      <Heart className='h-4 w-4 text-[#2B2B2B]' />
                      <span>Meaningful connections</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className='container mx-auto px-4 py-8'>
        {/* Benefits Section - Only show for non-authenticated users */}
        {!user && (
          <div className='mb-8'>
            <div className='grid md:grid-cols-3 gap-4'>
              <Card className='text-center p-4 border border-gray-200'>
                <Users className='h-6 w-6 text-[#2B2B2B] mx-auto mb-2' />
                <h3 className='font-medium text-[#2B2B2B] mb-1'>Connect & Network</h3>
                <p className='text-xs text-gray-600'>Meet people who share your interests</p>
              </Card>
              <Card className='text-center p-4 border border-gray-200'>
                <Zap className='h-6 w-6 text-[#2B2B2B] mx-auto mb-2' />
                <h3 className='font-medium text-[#2B2B2B] mb-1'>Learn & Grow</h3>
                <p className='text-xs text-gray-600'>Access exclusive content and discussions</p>
              </Card>
              <Card className='text-center p-4 border border-gray-200'>
                <Shield className='h-6 w-6 text-[#2B2B2B] mx-auto mb-2' />
                <h3 className='font-medium text-[#2B2B2B] mb-1'>Safe Spaces</h3>
                <p className='text-xs text-gray-600'>Moderated communities with clear guidelines</p>
              </Card>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <CommunityFilters
          searchQuery={filters.searchQuery}
          selectedCategory={filters.selectedCategory}
          sortBy={filters.sortBy}
          showPrivate={filters.showPrivate}
          viewMode={viewMode}
          onSearchChange={updateSearch}
          onCategoryChange={updateCategory}
          onSortChange={updateSort}
          onPrivacyChange={updatePrivacy}
          onViewModeChange={setViewMode}
        />

        <Tabs defaultValue='discover' className='space-y-6'>
          <TabsList className='grid w-full lg:w-auto lg:grid-cols-3 h-auto'>
            <TabsTrigger value='discover' className='flex flex-col items-center gap-1 p-4'>
              <div className='flex items-center gap-2'>
                <TrendingUp className='w-4 h-4' />
                <span>Discover</span>
              </div>
              <span className='text-xs text-gray-500 font-normal'>Explore all communities</span>
            </TabsTrigger>
            {user && (
              <TabsTrigger value='my-communities' className='flex flex-col items-center gap-1 p-4'>
                <div className='flex items-center gap-2'>
                  <Users className='w-4 h-4' />
                  <span>My Communities</span>
                </div>
                <span className='text-xs text-gray-500 font-normal'>Communities you've joined</span>
              </TabsTrigger>
            )}
            <TabsTrigger value='featured' className='flex flex-col items-center gap-1 p-4'>
              <div className='flex items-center gap-2'>
                <Star className='w-4 h-4' />
                <span>Featured</span>
              </div>
              <span className='text-xs text-gray-500 font-normal'>Staff picks & trending</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value='discover' className='space-y-6'>
            <div className='flex justify-between items-center'>
              <div>
                <h2 className='text-xl font-semibold text-[#2B2B2B]'>
                  {filters.searchQuery ? `Search results for "${filters.searchQuery}"` : 'All Communities'}
                </h2>
                <p className='text-sm text-gray-600 mt-1'>
                  {filters.searchQuery
                    ? 'Find communities matching your interests'
                    : 'Browse all available communities and find your perfect match'}
                </p>
              </div>
              {searchResults && (
                <div className='text-right'>
                  <p className='text-sm font-medium text-[#2B2B2B]'>
                    {searchResults.total || 0} communities
                  </p>
                  <p className='text-xs text-gray-500'>
                    {(searchResults.total || 0) === 1 ? 'result' : 'results'} found
                  </p>
                </div>
              )}
            </div>

            <CommunityGrid
              communities={searchResults?.communities || []}
              isLoading={isSearching}
              viewMode={viewMode}
              onJoinCommunity={handleJoinCommunity}

            />

            {/* Pagination */}
            {searchResults && searchResults.hasMore && (
              <div className='flex justify-center'>
                <Button
                  variant='outline'
                  onClick={loadMore}
                  disabled={isSearching}
                  className='border-gray-300 text-[#2B2B2B] hover:bg-gray-50'
                >
                  {isSearching ? 'Loading...' : 'Load More Communities'}
                </Button>
              </div>
            )}
          </TabsContent>

          {user && (
            <TabsContent value='my-communities' className='space-y-6'>
              <div className='flex justify-between items-center'>
                <div>
                  <h2 className='text-xl font-semibold text-[#2B2B2B]'>My Communities</h2>
                  <p className='text-sm text-gray-600 mt-1'>
                    Communities where you're an active member
                  </p>
                </div>
                <div className='text-right'>
                  <p className='text-sm font-medium text-[#2B2B2B]'>
                    {userMemberships?.length || 0} communities
                  </p>
                  <p className='text-xs text-gray-500'>joined</p>
                </div>
              </div>

              <CommunityGrid
                communities={userMemberships || []}
                isLoading={isMembershipsLoading}
                viewMode={viewMode}
                onJoinCommunity={handleJoinCommunity}
                emptyStateTitle='No communities joined yet'
                emptyStateDescription='Start building connections by joining communities that align with your interests and goals.'
                showCreateButton={false}
              />

              {(!userMemberships || userMemberships.length === 0) && !isMembershipsLoading && (
                <div className='text-center mt-6'>
                  <Button
                    onClick={scrollToDiscover}
                    variant='outline'
                    className='border-gray-300 text-[#2B2B2B] hover:bg-gray-50'
                  >
                    <TrendingUp className='w-4 h-4 mr-2' />
                    Discover Communities
                  </Button>
                </div>
              )}
            </TabsContent>
          )}

          <TabsContent value='featured' className='space-y-6'>
            <div className='flex justify-between items-center'>
              <div>
                <h2 className='text-xl font-semibold text-[#2B2B2B]'>Featured Communities</h2>
                <p className='text-sm text-gray-600 mt-1'>
                  Curated selection of the most active and engaging communities
                </p>
              </div>
              <div className='text-right'>
                <p className='text-sm font-medium text-[#2B2B2B]'>Staff Picks</p>
                <p className='text-xs text-gray-500'>Updated weekly</p>
              </div>
            </div>

            <CommunityGrid
              communities={featuredCommunities || []}
              isLoading={isFeaturedLoading}
              viewMode={viewMode}
              onJoinCommunity={handleJoinCommunity}
              emptyStateTitle='No featured communities yet'
              emptyStateDescription='Our team is working on curating the best communities for you. Check back soon!'
              showCreateButton={false}
            />

            {(!featuredCommunities || featuredCommunities.length === 0) && !isFeaturedLoading && (
              <div className='text-center mt-6'>
                <Button
                  onClick={scrollToDiscover}
                  className='bg-[#2B2B2B] hover:bg-gray-800 text-white'
                >
                  <TrendingUp className='w-4 h-4 mr-2' />
                  Explore All Communities
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Call to Action for Non-Authenticated Users */}
        {!user && (
          <Card className='mt-12 bg-gray-50 border border-gray-200'>
            <CardContent className='text-center py-12'>
              <Users className='mx-auto h-16 w-16 text-[#2B2B2B] mb-6' />
              <h3 className='text-2xl font-bold text-[#2B2B2B] mb-4'>Ready to Connect?</h3>
              <p className='text-gray-600 mb-8 max-w-2xl mx-auto'>
                Join thousands of people building meaningful connections in communities around the
                world. Create your account to start joining conversations, attending events, and
                growing your network.
              </p>
              <div className='flex flex-col sm:flex-row gap-4 justify-center'>
                <Button
                  onClick={handleAuth}
                  className='bg-[#2B2B2B] hover:bg-gray-800 text-white'
                  size='lg'
                >
                  Sign Up - It's Free
                </Button>
                <Button
                  variant='outline'
                  onClick={handleAuth}
                  className='border-gray-300 text-[#2B2B2B] hover:bg-gray-50'
                  size='lg'
                >
                  Sign In
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CommunitiesPage;