export interface Notification {
  id: string;
  userId: string;
  user: {
    name: string;
    avatar: string;
    initials: string;
  };
  action: string;
  time: Date;
  read: boolean;
  type: 'event' | 'follow' | 'comment' | 'share' | 'mention';
  relatedId?: string;
  metadata?: Record<string, unknown>;
}
