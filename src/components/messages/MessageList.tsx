import { ScrollArea } from '@/components/ui/scroll-area';
import { Message } from '@/types/message';
import { formatDistanceToNow } from 'date-fns';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
}

const MessageList = ({ messages, currentUserId }: MessageListProps) => {
  const formatMessageTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  return (
    <ScrollArea className='flex-1 p-4'>
      <div className='space-y-4'>
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                msg.senderId === currentUserId
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary'
              }`}
            >
              <p className='text-sm'>{msg.content}</p>
              <p className='text-xs text-right mt-1 opacity-70'>
                {formatMessageTime(msg.timestamp)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default MessageList;
