import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Conversation } from '@/types/message';
import { formatDistanceToNow } from 'date-fns';

interface ConversationListProps {
  conversations: Conversation[];
  activeConversation: number | null;
  onSelectConversation: (index: number) => void;
}

const ConversationList = ({
  conversations,
  activeConversation,
  onSelectConversation,
}: ConversationListProps) => {
  const formatMessageTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  return (
    <div className='border-r'>
      <div className='p-4 border-b'>
        <h2 className='font-semibold'>Conversations</h2>
      </div>
      <ScrollArea className='h-[540px]'>
        {conversations.map((conversation, index) => (
          <div
            key={conversation.id}
            className={`flex items-start gap-3 p-4 cursor-pointer hover:bg-secondary/50 ${
              activeConversation === index ? 'bg-secondary' : ''
            }`}
            onClick={() => onSelectConversation(index)}
          >
            <div className='relative'>
              <Avatar className='h-10 w-10'>
                <AvatarImage src={conversation.user.avatar} />
                <AvatarFallback>{conversation.user.initials}</AvatarFallback>
              </Avatar>
              {conversation.isOnline && (
                <span className='absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background'></span>
              )}
            </div>
            <div className='flex-1 min-w-0'>
              <div className='flex justify-between items-center'>
                <h3 className='font-medium text-sm'>{conversation.user.name}</h3>
                <span className='text-xs text-muted-foreground'>
                  {conversation.lastMessage &&
                    formatMessageTime(conversation.lastMessage.timestamp)}
                </span>
              </div>
              <p className='text-xs text-muted-foreground truncate'>
                {conversation.lastMessage?.content}
              </p>
            </div>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
};

export default ConversationList;
