import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  placeholder?: string | undefined;
  disabled?: boolean | undefined;
}

const MessageInput = ({
  onSendMessage,
  placeholder = 'Type a message...',
  disabled = false,
}: MessageInputProps) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className='border-t p-3 flex items-end gap-2'>
      <Textarea
        value={message}
        onChange={e => setMessage((e.target as HTMLInputElement).value)}
        placeholder={placeholder}
        onKeyDown={handleKeyPress}
        className='flex-1 min-h-[80px] max-h-[160px] resize-none'
        disabled={disabled}
      />
      <Button
        size='icon'
        onClick={handleSend}
        disabled={!message.trim() || disabled}
        className='h-10 w-10 rounded-full'
      >
        <Send className='h-4 w-4' />
      </Button>
    </div>
  );
};

export default MessageInput;
