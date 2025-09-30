import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Search, UserPlus, Shield, Crown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { reportError } from '@/utils/errorReporting';
import { Community } from '@/lib/types/community';
import { Skeleton } from '@/components/ui/skeleton';

interface MemberListProps {
  community: Community;
  isAdmin: boolean;
}

interface Member {
  id: string;
  displayName: string;
  photoURL: string;
  isAdmin: boolean;
  isCreator: boolean;
  joinDate: string;
}

const MemberList: React.FC<MemberListProps> = ({ community, isAdmin }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const fetchMembers = async () => {
      if (!community.members || community.members.length === 0) {
        setMembers([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const memberPromises = community.members.map(async memberId => {
          try {
            const { data: userData, error } = await supabase
              .from('users')
              .select('*')
              .eq('id', memberId)
              .single();

            if (error) throw error;

            if (userData) {
              return {
                id: memberId,
                displayName:
                  userData.display_name || userData.email?.split('@')[0] || 'Anonymous User',
                photoURL: userData.avatar_url || '',
                isAdmin: community.admins?.includes(memberId) || false,
                isCreator: community.creatorId === memberId,
                joinDate: userData.created_at || '',
              };
            }
            return null;
          } catch (error) {
            return null;
          }
        });

        const resolvedMembers = await Promise.all(memberPromises);
        setMembers(resolvedMembers.filter(Boolean) as Member[]);
      } catch (error) {
        reportError(error instanceof Error ? error : new Error('Failed to fetch members'), {
          component: 'MemberList',
          action: 'fetchMembers',
          communityId: community.id,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [community]);

  const filteredMembers = members.filter(member =>
    member.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const adminMembers = filteredMembers.filter(member => member.isAdmin);
  const regularMembers = filteredMembers.filter(member => !member.isAdmin);

  const displayMembers =
    activeTab === 'admins'
      ? adminMembers
      : activeTab === 'members'
        ? regularMembers
        : filteredMembers;

  return (
    <div className='space-y-4'>
      <div className='flex gap-2'>
        <div className='relative flex-1'>
          <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Search members...'
            className='pl-8'
            value={searchQuery}
            onChange={e => setSearchQuery((e.target as HTMLInputElement).value)}
          />
        </div>
        {isAdmin && (
          <Button variant='outline'>
            <UserPlus className='h-4 w-4 mr-2' />
            Invite
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
        <TabsList>
          <TabsTrigger value='all'>All ({filteredMembers.length})</TabsTrigger>
          <TabsTrigger value='admins'>Admins ({adminMembers.length})</TabsTrigger>
          <TabsTrigger value='members'>Members ({regularMembers.length})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className='mt-4'>
          {loading ? (
            <div className='space-y-3'>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className='flex items-center space-x-4'>
                  <Skeleton className='h-12 w-12 rounded-full' />
                  <div className='space-y-2'>
                    <Skeleton className='h-4 w-[200px]' />
                    <Skeleton className='h-4 w-[160px]' />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ScrollArea className='h-[400px] pr-4'>
              {displayMembers.length === 0 ? (
                <div className='text-center py-8 text-muted-foreground'>No members found</div>
              ) : (
                <div className='space-y-2'>
                  {displayMembers.map(member => (
                    <Card key={member.id} className='hover:bg-muted/50'>
                      <CardContent className='p-4'>
                        <div className='flex items-center'>
                          <Avatar className='h-10 w-10'>
                            <AvatarImage src={member.photoURL} />
                            <AvatarFallback>
                              {member.displayName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className='ml-4 flex-1'>
                            <div className='font-medium flex items-center'>
                              {member.displayName}
                              {member.isCreator && (
                                <span className='ml-2 inline-flex items-center text-amber-500'>
                                  <Crown className='h-3.5 w-3.5' />
                                </span>
                              )}
                              {member.isAdmin && !member.isCreator && (
                                <span className='ml-2 inline-flex items-center text-blue-500'>
                                  <Shield className='h-3.5 w-3.5' />
                                </span>
                              )}
                            </div>
                            <div className='text-sm text-muted-foreground'>
                              {member.isCreator ? 'Creator' : member.isAdmin ? 'Admin' : 'Member'}
                            </div>
                          </div>
                          {isAdmin && !member.isCreator && (
                            <Button variant='ghost' size='sm'>
                              Manage
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MemberList;
