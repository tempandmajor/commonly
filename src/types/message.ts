export interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  timestamp: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  user: {
    id: string;
    name: string;
    avatar?: string | undefined;
    initials: string;
  };
  lastMessage?: Message;
  isOnline: boolean;
  updatedAt: string;
  messages: Message[];
  unreadCount?: number; // Adding this property to fix the error
}
