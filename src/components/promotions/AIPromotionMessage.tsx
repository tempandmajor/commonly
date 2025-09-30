import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, ThumbsUp } from 'lucide-react';
import { trackPromotionEngagement, trackPromotionImpression } from '@/services/promotionUtils';

interface AIPromotionMessageProps {
  promotion: {
    id: string;
    title: string;
    description: string;
    targetId: string;
    targetType: string;
    messageContent: string;
  };
  recipientName?: string;
  onAction?: () => void;
}

const AIPromotionMessage: React.FC<AIPromotionMessageProps> = ({
  promotion,
  recipientName = 'User',
  onAction,
}) => {
  const [impressionTracked, setImpressionTracked] = useState(false);

  useEffect(() => {
    const trackImpression = async () => {
      if (!impressionTracked) {
        await trackPromotionImpression(promotion.id);
        setImpressionTracked(true);
      }
    };

    trackImpression();
  }, [promotion.id, impressionTracked]);

  const handleClick = async () => {
    await trackPromotionEngagement(promotion.id, 'click');
    if (onAction) onAction();
  };

  return (
    <Card className='mb-4 border-blue-200 bg-blue-50/30'>
      <CardHeader className='pb-2'>
        <div className='flex items-center justify-between'>
          <Badge variant='outline' className='bg-blue-100 text-blue-800'>
            Suggested
          </Badge>
        </div>
        <CardTitle className='text-lg font-medium mt-2'>{promotion.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className='text-sm text-muted-foreground'>{promotion.messageContent}</p>
      </CardContent>
      <CardFooter className='pt-1 flex justify-between'>
        <Button variant='ghost' size='sm' className='text-xs' onClick={handleClick}>
          <ThumbsUp className='h-3.5 w-3.5 mr-1' />
          Helpful
        </Button>
        <Button variant='outline' size='sm' className='text-xs' onClick={handleClick}>
          <ExternalLink className='h-3.5 w-3.5 mr-1' />
          Learn More
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AIPromotionMessage;
