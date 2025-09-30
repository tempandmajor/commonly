'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import CommentsSection from '@/components/comments/CommentsSection';
import { formatCommentTime } from '@/lib/validations/commentValidation';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Globe,
  Users,
  Lock,
  UserCheck,
  MapPin,
  Calendar,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PostDisplayProps {
  post: {
    id: string;
    type: 'text' | 'image' | 'video' | 'audio' | 'poll' | 'event' | 'product';
    content: string;
    author: {
      id: string;
      name: string;
      avatar?: string | undefined;
      badge?: string | undefined;
    };
    createdAt: Date;
    updatedAt?: Date;
    isEdited?: boolean;
    visibility: 'public' | 'followers' | 'friends' | 'private';
    location?: {
      name: string;
      latitude?: number;
      longitude?: number;
    };
    tags?: string[];
    mentions?: string[];
    attachments?: {
      type: 'image' | 'video' | 'audio';
      url: string;
      thumbnail?: string;
      caption?: string;
    }[];
    stats: {
      likes: number;
      comments: number;
      shares: number;
      views?: number;
    };
    userInteraction?: {
      liked: boolean;
      bookmarked: boolean;
      shared: boolean;
    };
    isPinned?: boolean;
    allowComments?: boolean;
    allowReactions?: boolean;
    allowSharing?: boolean;
  };
  currentUser?: {
    id: string;
    name: string;
    avatar?: string;
  };
  showComments?: boolean;
  onLike?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onBookmark?: (postId: string) => void;
  className?: string;
}

const visibilityIcons = {
  public: Globe,
  followers: Users,
  friends: UserCheck,
  private: Lock,
};

export const PostDisplay: React.FC<PostDisplayProps> = ({
  post,
  currentUser,
  showComments = false,
  onLike,
  onShare,
  onBookmark,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCommentsSection, setShowCommentsSection] = useState(showComments);

  const VisibilityIcon = visibilityIcons[post.visibility];
  const isAuthor = currentUser?.id === post.author.id;

  const toggleComments = () => {
    setShowCommentsSection(!showCommentsSection);
  };

  return (
    <div className={cn('space-y-4', className)}>
      <Card>
        <CardHeader className='pb-3'>
          <div className='flex items-start justify-between'>
            <div className='flex items-center gap-3'>
              <Avatar>
                <AvatarImage src={post.author.avatar} alt={post.author.name} />
                <AvatarFallback>{post.author.name[0]}</AvatarFallback>
              </Avatar>

              <div>
                <div className='flex items-center gap-2'>
                  <h4 className='font-medium'>{post.author.name}</h4>
                  {post.author.badge && (
                    <Badge variant='secondary' className='text-xs'>
                      {post.author.badge}
                    </Badge>
                  )}
                  {post.isPinned && (
                    <Badge variant='outline' className='text-xs'>
                      Pinned
                    </Badge>
                  )}
                </div>

                <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                  <span>{formatCommentTime(post.createdAt)}</span>
                  {post.isEdited && <span>(edited)</span>}
                  <VisibilityIcon className='w-3 h-3' />
                  {post.location && (
                    <>
                      <span>·</span>
                      <div className='flex items-center gap-1'>
                        <MapPin className='w-3 h-3' />
                        <span>{post.location.name}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
              <MoreHorizontal className='w-4 h-4' />
            </Button>
          </div>
        </CardHeader>

        <CardContent className='pb-3'>
          {/* Post content */}
          <div className='space-y-3'>
            <p className='text-sm whitespace-pre-wrap'>
              {isExpanded || post.content.length <= 280
                ? post.content
                : `${post.content.slice(0, 280)}...`}
            </p>

            {post.content.length > 280 && !isExpanded && (
              <Button
                variant='link'
                size='sm'
                className='p-0 h-auto'
                onClick={() => setIsExpanded(true)}
              >
                Show more
              </Button>
            )}

            {/* Attachments */}
            {post.attachments && post.attachments.length > 0 && (
              <div className='grid grid-cols-1 md:grid-cols-2 gap-2 mt-3'>
                {post.attachments.map((attachment, index) => (
                  <div key={index} className='relative'>
                    {attachment.type === 'image' && (
                      <img
                        src={attachment.url}
                        alt={attachment.caption || ''}
                        className='w-full rounded-lg object-cover cursor-pointer hover:opacity-95 transition-opacity'
                      />
                    )}
                    {attachment.type === 'video' && (
                      <video
                        src={attachment.url}
                        poster={attachment.thumbnail}
                        controls
                        className='w-full rounded-lg'
                      />
                    )}
                    {attachment.caption && (
                      <p className='text-xs text-muted-foreground mt-1'>{attachment.caption}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className='flex flex-wrap gap-2 mt-3'>
                {post.tags.map((tag, index) => (
                  <Badge key={index} variant='secondary' className='text-xs'>
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className='flex-col gap-3 pt-3'>
          {/* Stats */}
          <div className='flex items-center justify-between w-full text-sm text-muted-foreground'>
            <div className='flex items-center gap-4'>
              {post.stats.likes > 0 && (
                <span>
                  {post.stats.likes} {post.stats.likes === 1 ? 'like' : 'likes'}
                </span>
              )}
              {post.stats.comments > 0 && (
                <span>
                  {post.stats.comments} {post.stats.comments === 1 ? 'comment' : 'comments'}
                </span>
              )}
              {post.stats.shares > 0 && (
                <span>
                  {post.stats.shares} {post.stats.shares === 1 ? 'share' : 'shares'}
                </span>
              )}
            </div>
            {post.stats.views && (
              <div className='flex items-center gap-1'>
                <Eye className='w-4 h-4' />
                <span>{post.stats.views.toLocaleString()} views</span>
              </div>
            )}
          </div>

          <Separator className='w-full' />

          {/* Actions */}
          <div className='flex items-center justify-around w-full'>
            {post.allowReactions !== false && (
              <Button
                variant='ghost'
                size='sm'
                className={cn('flex-1', post.userInteraction?.liked && 'text-red-500')}
                onClick={() => onLike?.(post.id)}
              >
                <Heart
                  className={cn('w-4 h-4 mr-2', post.userInteraction?.liked && 'fill-current')}
                />
                Like
              </Button>
            )}

            {post.allowComments !== false && (
              <Button variant='ghost' size='sm' className='flex-1' onClick={toggleComments}>
                <MessageCircle className='w-4 h-4 mr-2' />
                Comment
              </Button>
            )}

            {post.allowSharing !== false && (
              <Button
                variant='ghost'
                size='sm'
                className={cn('flex-1', post.userInteraction?.shared && 'text-primary')}
                onClick={() => onShare?.(post.id)}
              >
                <Share2 className='w-4 h-4 mr-2' />
                Share
              </Button>
            )}

            <Button
              variant='ghost'
              size='sm'
              className={cn('flex-1', post.userInteraction?.bookmarked && 'text-primary')}
              onClick={() => onBookmark?.(post.id)}
            >
              <Bookmark
                className={cn('w-4 h-4 mr-2', post.userInteraction?.bookmarked && 'fill-current')}
              />
              Save
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Comments Section */}
      {showCommentsSection && post.allowComments !== false && (
        <CommentsSection
          entityType='post'
          entityId={post.id}
          currentUser={currentUser}
          allowComments={true}
          allowReviews={false}
          totalCount={post.stats.comments}
          className='mt-4'
        />
      )}
    </div>
  );
};

export default PostDisplay;
