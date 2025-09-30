import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Facebook, Twitter, Linkedin, Copy, MessageCircle, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface SocialSharePopoverProps {
  url: string;
  title: string;
  description?: string | undefined;
  image?: string | undefined;
  trigger: React.ReactNode;
  onShare?: () => void | undefined;
}

const SocialSharePopover = ({
  url,
  title,
  description = '',
  image,
  trigger,
  onShare,
}: SocialSharePopoverProps) => {
  const [copied, setCopied] = useState(false);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);
  const encodedImage = image ? encodeURIComponent(image) : '';

  const shareToFacebook = () => {
    // Facebook's sharer uses Open Graph meta tags automatically
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
    if (onShare) onShare();
    toast.success('Shared to Facebook');
  };

  const shareToTwitter = () => {
    // Twitter uses Twitter Card meta tags automatically
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
    if (onShare) onShare();
    toast.success('Shared to Twitter');
  };

  const shareToLinkedin = () => {
    // LinkedIn uses Open Graph meta tags automatically
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    window.open(linkedinUrl, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
    if (onShare) onShare();
    toast.success('Shared to LinkedIn');
  };

  const shareViaWhatsApp = () => {
    const whatsappText = `${title}\n\n${description}\n\n${url}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;
    window.open(whatsappUrl, '_blank');
    if (onShare) onShare();
    toast.success('Shared via WhatsApp');
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Check out: ${title}`);
    const body = encodeURIComponent(
      `I thought you might be interested in this:\n\n${title}\n\n${description}\n\n${url}`
    );
    const emailUrl = `mailto:?subject=${subject}&body=${body}`;
    window.location.href = emailUrl;
    if (onShare) onShare();
    toast.success('Email client opened');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (onShare) onShare();
      toast.success('Link copied to clipboard');

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const shareViaNativeAPI = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url,
        });
        if (onShare) onShare();
        toast.success('Shared successfully');
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          toast.error('Failed to share');
        }
      }
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className='w-80' align='end'>
        <div className='space-y-4'>
          <div>
            <h4 className='font-medium text-sm mb-1'>Share this content</h4>
            <p className='text-xs text-muted-foreground line-clamp-2'>{title}</p>
          </div>

          <div className='grid grid-cols-2 gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={shareToFacebook}
              className='flex items-center gap-2 justify-start'
            >
              <Facebook className='h-4 w-4 text-blue-600' />
              Facebook
            </Button>

            <Button
              variant='outline'
              size='sm'
              onClick={shareToTwitter}
              className='flex items-center gap-2 justify-start'
            >
              <Twitter className='h-4 w-4 text-blue-400' />
              Twitter
            </Button>

            <Button
              variant='outline'
              size='sm'
              onClick={shareToLinkedin}
              className='flex items-center gap-2 justify-start'
            >
              <Linkedin className='h-4 w-4 text-blue-700' />
              LinkedIn
            </Button>

            <Button
              variant='outline'
              size='sm'
              onClick={shareViaWhatsApp}
              className='flex items-center gap-2 justify-start'
            >
              <MessageCircle className='h-4 w-4 text-green-600' />
              WhatsApp
            </Button>

            <Button
              variant='outline'
              size='sm'
              onClick={shareViaEmail}
              className='flex items-center gap-2 justify-start'
            >
              <Mail className='h-4 w-4 text-gray-600' />
              Email
            </Button>

            <Button
              variant='outline'
              size='sm'
              onClick={copyToClipboard}
              className='flex items-center gap-2 justify-start'
            >
              <Copy className={`h-4 w-4 ${copied ? 'text-green-600' : 'text-gray-600'}`} />
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
          </div>

          {/* Native Share API for mobile devices */}
          {navigator.share && (
            <Button variant='default' size='sm' onClick={shareViaNativeAPI} className='w-full'>
              Share via Device
            </Button>
          )}

          {/* Preview of what will be shared */}
          <div className='border-t pt-3'>
            <p className='text-xs text-muted-foreground mb-2'>Social media preview:</p>
            <div className='border rounded-md p-2 bg-muted/30'>
              <div className='flex gap-2'>
                {image && (
                  <div className='w-12 h-12 bg-gray-200 rounded flex-shrink-0'>
                    <img src={image} alt='' className='w-full h-full object-cover rounded' />
                  </div>
                )}
                <div className='flex-1 min-w-0'>
                  <p className='text-xs font-medium truncate'>{title}</p>
                  <p className='text-xs text-muted-foreground line-clamp-2'>{description}</p>
                  <p className='text-xs text-muted-foreground truncate'>{new URL(url).hostname}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SocialSharePopover;
