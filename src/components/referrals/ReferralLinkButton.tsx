import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  Share2,
  Copy,
  DollarSign,
  Info,
  ExternalLink,
  Facebook,
  Twitter,
  MessageCircle,
  Mail,
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

interface ReferralLinkButtonProps {
  eventId: string;
  eventTitle: string;
  eventPrice: number;
  commissionAmount: number;
  commissionType: 'fixed' | 'percentage';
  requiresApproval?: boolean | undefined;
  maxReferrers?: number | undefined;
  className?: string | undefined;
}

const ReferralLinkButton: React.FC<ReferralLinkButtonProps> = ({
  eventId,
  eventTitle,
  eventPrice,
  commissionAmount,
  commissionType,
  requiresApproval = false,
  maxReferrers,
  className,
}) => {
  const { user } = useAuth();
  const [referralLink, setReferralLink] = useState<string>('');
  const [referralCode, setReferralCode] = useState<string>('');
  const [hasExistingLink, setHasExistingLink] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isApprovalPending, setIsApprovalPending] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  useEffect(() => {
    if (user) {
      checkExistingReferralLink();
    }
  }, [user, eventId]);

  const checkExistingReferralLink = async () => {
    try {
      const { data, error } = await supabase
        .from('referral_links')
        .select('referral_code, is_active')
        .eq('event_id', eventId)
        .eq('referrer_user_id', user?.id)
        .single();

      if (data) {
        setHasExistingLink(true);
        setReferralCode(data.referral_code);
        setReferralLink(`${window.location.origin}/events/${eventId}?ref=${data.referral_code}`);
        setIsApprovalPending(!data.is_active);
      }
    } catch (error) {
      // No existing link found
    }
  };

  const createReferralLink = async () => {
    if (!user) {
      toast.error('Please sign in to create a referral link');
      return;
    }

    try {
      setIsCreating(true);

      // Generate referral code
      const { data: codeData, error: codeError } = await supabase.rpc('generate_referral_code', {
        event_id: eventId,
        user_id: user.id,
      });

      if (codeError) throw codeError;

      // Create referral link
      const { data, error } = await supabase
        .from('referral_links')
        .insert({
          event_id: eventId,
          referrer_user_id: user.id,
          referral_code: codeData,
          is_active: !requiresApproval,
        })
        .select()
        .single();

      if (error) throw error;

      setReferralCode(codeData);
      setReferralLink(`${window.location.origin}/events/${eventId}?ref=${codeData}`);
      setHasExistingLink(true);
      setIsApprovalPending(requiresApproval);

      if (requiresApproval) {
        toast.success('Referral link created! Awaiting approval from event organizer.');
      } else {
        toast.success('Referral link created successfully!');
        setShowShareDialog(true);
      }
    } catch (error) {
      toast.error('Failed to create referral link');
    } finally {
      setIsCreating(false);
    }
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success('Referral link copied to clipboard!');
  };

  const shareToSocial = (platform: string) => {
    const text = `Check out this amazing event: ${eventTitle}`;
    const url = referralLink;

    let shareUrl = '';
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent(eventTitle)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  const calculateCommission = () => {
    if (commissionType === 'percentage') {
      return ((eventPrice * commissionAmount) / 100).toFixed(2);
    }
    return commissionAmount.toFixed(2);
  };

  if (!user) {
    return (
      <Button
        variant='outline'
        onClick={() => toast.info('Please sign in to create referral links')}
        className={className}
      >
        <Share2 className='h-4 w-4 mr-2' />
        Create Referral Link
      </Button>
    );
  }

  return (
    <>
      {!hasExistingLink ? (
        <Button
          onClick={createReferralLink}
          disabled={isCreating}
          className={className}
          variant='outline'
        >
          <Share2 className='h-4 w-4 mr-2' />
          {isCreating ? 'Creating...' : 'Create Referral Link'}
        </Button>
      ) : (
        <div className='space-y-2'>
          {isApprovalPending ? (
            <div className='flex items-center gap-2'>
              <Badge variant='secondary' className='gap-1'>
                <Info className='h-3 w-3' />
                Pending Approval
              </Badge>
              <span className='text-sm text-muted-foreground'>
                Your referral link is awaiting approval
              </span>
            </div>
          ) : (
            <div className='flex items-center gap-2'>
              <Button
                onClick={() => setShowShareDialog(true)}
                variant='outline'
                size='sm'
                className='gap-2'
              >
                <Share2 className='h-4 w-4' />
                Share & Earn ${calculateCommission()}
              </Button>
              <Button onClick={copyReferralLink} variant='ghost' size='sm' className='gap-2'>
                <Copy className='h-4 w-4' />
                Copy Link
              </Button>
            </div>
          )}
        </div>
      )}

      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Share2 className='h-5 w-5' />
              Share Your Referral Link
            </DialogTitle>
            <DialogDescription>
              Earn ${calculateCommission()} commission for each ticket sold through your link
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            {/* Commission Info */}
            <Card>
              <CardContent className='p-4'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='font-medium'>Your Commission</p>
                    <p className='text-sm text-muted-foreground'>
                      {commissionType === 'percentage'
                        ? `${commissionAmount}% of ticket price`
                        : `$${commissionAmount} per ticket`}
                    </p>
                  </div>
                  <div className='text-right'>
                    <div className='text-lg font-bold text-green-600'>${calculateCommission()}</div>
                    <div className='text-xs text-muted-foreground'>per ticket</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Referral Link */}
            <div className='space-y-2'>
              <label className='text-sm font-medium'>Your Referral Link</label>
              <div className='flex gap-2'>
                <Input value={referralLink} readOnly className='font-mono text-xs' />
                <Button onClick={copyReferralLink} size='sm' variant='outline'>
                  <Copy className='h-4 w-4' />
                </Button>
              </div>
            </div>

            {/* Social Sharing */}
            <div className='space-y-2'>
              <label className='text-sm font-medium'>Share on Social Media</label>
              <div className='grid grid-cols-2 gap-2'>
                <Button
                  onClick={() => shareToSocial('facebook')}
                  variant='outline'
                  size='sm'
                  className='gap-2'
                >
                  <Facebook className='h-4 w-4 text-blue-600' />
                  Facebook
                </Button>
                <Button
                  onClick={() => shareToSocial('twitter')}
                  variant='outline'
                  size='sm'
                  className='gap-2'
                >
                  <Twitter className='h-4 w-4 text-blue-400' />
                  Twitter
                </Button>
                <Button
                  onClick={() => shareToSocial('whatsapp')}
                  variant='outline'
                  size='sm'
                  className='gap-2'
                >
                  <MessageCircle className='h-4 w-4 text-green-600' />
                  WhatsApp
                </Button>
                <Button
                  onClick={() => shareToSocial('email')}
                  variant='outline'
                  size='sm'
                  className='gap-2'
                >
                  <Mail className='h-4 w-4 text-gray-600' />
                  Email
                </Button>
              </div>
            </div>

            {/* Tips */}
            <Alert>
              <Info className='h-4 w-4' />
              <AlertDescription>
                <strong>Pro tip:</strong> Share with people who would be genuinely interested in
                this event. Your conversion rate will be higher when you target the right audience.
              </AlertDescription>
            </Alert>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReferralLinkButton;
