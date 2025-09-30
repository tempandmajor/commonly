import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Send } from 'lucide-react';
import { resendConfirmationEmail } from '@/utils/emailConfirmation';

interface ResendConfirmationButtonProps {
  email?: string | undefined;
  className?: string | undefined;
}

const ResendConfirmationButton: React.FC<ResendConfirmationButtonProps> = ({
  email: initialEmail = '',
  className = '',
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleResend = async () => {
    if (!email) {
      return;
    }

    setIsLoading(true);
    const { error } = await resendConfirmationEmail(email);
    setIsLoading(false);

    if (!error) {
      setShowForm(false);
    }
  };

  if (!showForm) {
    return (
      <Button
        variant='outline'
        size='sm'
        onClick={() => setShowForm(true)}
        className={`text-sm ${className}`}
      >
        <Mail className='h-4 w-4 mr-2' />
        Resend confirmation email
      </Button>
    );
  }

  return (
    <Card className={`w-full max-w-sm ${className}`}>
      <CardHeader className='pb-3'>
        <CardTitle className='text-lg'>Resend Confirmation</CardTitle>
        <CardDescription>Enter your email to receive a new confirmation link</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='relative'>
          <Mail className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            type='email'
            placeholder='Enter your email'
            value={email}
            onChange={e => setEmail((e.target as HTMLInputElement).value)}
            className='pl-10'
          />
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' size='sm' onClick={() => setShowForm(false)} className='flex-1'>
            Cancel
          </Button>
          <Button
            onClick={handleResend}
            disabled={!email || isLoading}
            size='sm'
            className='flex-1'
          >
            {isLoading ? (
              <>Sending...</>
            ) : (
              <>
                <Send className='h-4 w-4 mr-2' />
                Send
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResendConfirmationButton;
