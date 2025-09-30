import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageSquare, Share, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { trackPromotionEngagement, trackPromotionImpression } from '@/services/promotionUtils';
import { toast } from 'sonner';

interface PromotedPostProps {
  id: string;
  title: string;
  content: string;
  image?: string | undefined;
  authorName: string;
  authorAvatar?: string | undefined;
  authorId: string;
  createdAt: Date;
  promotionId: string;
  onDismiss?: (id: string) => void | undefined;
}

const PromotedPost: React.FC<PromotedPostProps> = ({
  id,
  title,
  content,
  image,
  authorName,
  authorAvatar,
  authorId,
  createdAt,
  promotionId,
  onDismiss,
}) => {
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    trackPromotionImpression(promotionId).catch(err => {});
  }, [promotionId]);

  const handleEngagement = async (type: 'share' | 'click' | 'conversion') => {
    setIsLoading(true);
    try {
      await trackPromotionEngagement(promotionId, type);
      toast.success(
        `${type === 'click' ? 'Liked' : type === 'share' ? 'Comment added' : 'Shared'} successfully`
      );
    } catch (_error) {
      // Error handling silently ignored
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = async () => {
    try {
      await trackPromotionEngagement(promotionId, 'click');
    } catch (_error) {
      // Error handling silently ignored
    }
  };

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss(id);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(date);
  };

  return (
    <Card className='overflow-hidden border-2 border-primary/10 relative'>
      <Badge className='absolute top-2 right-10 z-10' variant='outline'>
        Promoted
      </Badge>
      <Button
        size='icon'
        variant='ghost'
        className='absolute top-2 right-2 z-10 h-7 w-7'
        onClick={handleDismiss}
      >
        <X className='h-4 w-4' />
      </Button>

      {image && (
        <div className='h-48 overflow-hidden'>
          <img
            src={image}
            alt={title}
            className='w-full h-full object-cover transition-transform hover:scale-105'
          />
        </div>
      )}

      <CardHeader className='pb-2 pt-4 flex flex-row items-center gap-3'>
        <Avatar>
          <AvatarImage src={authorAvatar} alt={authorName} />
          <AvatarFallback>{authorName.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className='flex flex-col'>
          <Link
            to={`/profile/${authorId}`}
            className='font-semibold hover:underline'
            onClick={handleClick}
          >
            {authorName}
          </Link>
          <span className='text-xs text-muted-foreground'>{formatDate(createdAt)}</span>
        </div>
      </CardHeader>

      <CardContent className='py-2'>
        <h3 className='font-semibold text-lg mb-2'>{title}</h3>
        <p className='text-sm text-muted-foreground'>{content}</p>
      </CardContent>

      <CardFooter className='pt-2 pb-4 gap-2 flex justify-between'>
        <div className='flex space-x-2'>
          <Button
            size='sm'
            variant='ghost'
            className='text-muted-foreground hover:text-primary flex items-center gap-1'
            onClick={() => handleEngagement('click')}
            disabled={isLoading}
          >
            <Heart className='h-4 w-4' />
            <span>Like</span>
          </Button>
          <Button
            size='sm'
            variant='ghost'
            className='text-muted-foreground hover:text-primary flex items-center gap-1'
            onClick={() => handleEngagement('conversion')}
            disabled={isLoading}
          >
            <MessageSquare className='h-4 w-4' />
            <span>Comment</span>
          </Button>
        </div>

        <Button
          size='sm'
          variant='ghost'
          className='text-muted-foreground hover:text-primary'
          onClick={() => handleEngagement('share')}
          disabled={isLoading}
        >
          <Share className='h-4 w-4 mr-1' />
          Share
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PromotedPost;
