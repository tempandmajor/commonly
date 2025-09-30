import { PromotionSettings } from '@/lib/types/promotion';

export interface FeedItem {
  id: string;
  type: 'post' | 'event' | 'update' | 'promotion';
  content: unknown;
  promotion?: PromotionSettings | undefined;
}

export interface FeedWithPromotionsProps {
  items: FeedItem[];
  isLoading?: boolean | undefined;
  onLoadMore?: () => void | undefined;
  hasMore?: boolean | undefined;
}
