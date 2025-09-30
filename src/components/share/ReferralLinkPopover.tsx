import { useState } from 'react';
import { Link as LinkIcon, Copy, Check, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface ReferralLinkPopoverProps {
  url: string;
  referralCode: string;
  trigger: React.ReactNode;
  onCopy?: () => void | undefined;
  isAdmin?: boolean | undefined;
}

const ReferralLinkPopover = ({
  url,
  referralCode,
  trigger,
  onCopy,
  isAdmin = false,
}: ReferralLinkPopoverProps) => {
  const [copied, setCopied] = useState(false);
  const referralUrl = `${url}?ref=${referralCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    if (onCopy) onCopy();
    toast.success('Referral link copied to clipboard', {
      description: 'Share this link to earn rewards when people back this event.',
    });

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className='w-72'>
        <div className='space-y-2'>
          <h3 className='font-medium'>Your Referral Link</h3>
          <p className='text-sm text-muted-foreground'>
            Share this link with friends and earn rewards!
          </p>

          <div className='flex items-center rounded-md border px-3 py-2'>
            <LinkIcon className='mr-2 h-4 w-4 text-muted-foreground' />
            <p className='text-sm truncate flex-1'>{referralUrl}</p>
            <Button variant='ghost' size='sm' className='h-8 ml-2' onClick={copyToClipboard}>
              {copied ? <Check className='h-3 w-3 mr-1' /> : <Copy className='h-3 w-3 mr-1' />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>

          {isAdmin && (
            <div className='mt-4 rounded-md bg-amber-50 border border-amber-200 p-3'>
              <div className='flex items-center text-amber-800'>
                <Shield className='h-4 w-4 mr-2' />
                <span className='text-sm font-medium'>Admin Access Available</span>
              </div>
              <p className='text-xs text-amber-700 mt-1'>
                You have administrative privileges to manage the referral program, adjust reward
                amounts, and view detailed analytics through the management portal.
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ReferralLinkPopover;
