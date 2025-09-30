import React, { useState } from 'react';
import { Event, SponsorshipTier } from '@/lib/types/event';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Shield, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { formatCurrency } from '@/utils/currency';

interface SponsorshipSectionProps {
  event: Event;
}

const SponsorshipSection: React.FC<SponsorshipSectionProps> = ({ event }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [selectedTier, setSelectedTier] = useState<SponsorshipTier | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  if (!event.sponsorshipTiers || event.sponsorshipTiers.length === 0) {
    return null;
  }

  const handleSponsorClick = (tier: SponsorshipTier) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to sponsor this event');
      navigate('/login', { state: { from: { pathname: `/events/${event.id}` } } });
      return;
    }

    if (tier.maxSponsors && tier.currentSponsors && tier.currentSponsors >= tier.maxSponsors) {
      toast.error('This sponsorship tier is already full');
      return;
    }

    setSelectedTier(tier);
    setShowDialog(true);
  };

  const handleConfirmSponsorship = () => {
    toast.success(
      `Thank you for sponsoring! We will contact you about your ${selectedTier?.name} sponsorship.`
    );
    setShowDialog(false);
  };

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='text-2xl flex items-center'>
            <Shield className='mr-2 h-5 w-5' />
            Sponsorship Opportunities
          </CardTitle>
        </CardHeader>
        <CardContent>
          {event.isAllOrNothing && (
            <Alert className='mb-6 bg-gray-50 border-gray-200'>
              <AlertTriangle className='h-4 w-4 text-gray-600' />
              <AlertTitle className='text-gray-800'>All or Nothing Event</AlertTitle>
              <AlertDescription className='text-gray-700'>
                You will only be charged if this event reaches its funding goal of{' '}
                {formatCurrency(event.targetAmount || 0)}. Current amount raised:{' '}
                {formatCurrency(event.currentAmount || 0)}
              </AlertDescription>
            </Alert>
          )}

          <p className='mb-6 text-muted-foreground'>
            Support this event by becoming a sponsor. Different tiers offer various benefits.
          </p>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {event.sponsorshipTiers.map(tier => {
              const isFull =
                tier.maxSponsors !== undefined &&
                tier.currentSponsors !== undefined &&
                tier.currentSponsors >= tier.maxSponsors;

              return (
                <Card
                  key={tier.id}
                  className={`flex flex-col border-2 ${isFull ? 'opacity-60' : ''}`}
                >
                  <CardHeader className='pb-2'>
                    <CardTitle>{tier.name}</CardTitle>
                  </CardHeader>

                  <CardContent className='py-2 flex-1'>
                    <div className='text-2xl font-bold'>${tier.price.toLocaleString()}</div>

                    {tier.description && (
                      <p className='my-2 text-muted-foreground text-sm'>{tier.description}</p>
                    )}

                    <Separator className='my-4' />

                    {tier.benefits && tier.benefits.length > 0 && (
                      <ul className='space-y-2'>
                        {tier.benefits.map((benefit, index) => (
                          <li key={index} className='flex items-start text-sm'>
                            <Check className='h-4 w-4 mr-2 text-green-500 mt-0.5 flex-shrink-0' />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {tier.maxSponsors && (
                      <p className='mt-4 text-xs text-muted-foreground'>
                        {tier.currentSponsors || 0} of {tier.maxSponsors} sponsors
                      </p>
                    )}
                  </CardContent>

                  <CardFooter className='pt-2'>
                    <Button
                      className='w-full'
                      onClick={() => handleSponsorClick(tier)}
                      disabled={isFull}
                      variant={isFull ? 'outline' : 'default'}
                    >
                      {isFull ? 'Fully Sponsored' : 'Become a Sponsor'}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Sponsorship</DialogTitle>
            <DialogDescription>
              {event.isAllOrNothing ? (
                <>
                  You are about to pledge {selectedTier?.name} sponsorship for $
                  {selectedTier?.price.toLocaleString()}. Your card will only be charged if the
                  event reaches its funding goal.
                </>
              ) : (
                <>
                  You are about to become a {selectedTier?.name} sponsor for $
                  {selectedTier?.price.toLocaleString()}.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4'>
            <h4 className='font-medium'>Benefits include:</h4>
            <ul className='space-y-2'>
              {selectedTier?.benefits.map((benefit, index) => (
                <li key={index} className='flex items-center'>
                  <Check className='h-4 w-4 mr-2 text-green-500' />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>

            <p className='text-sm text-muted-foreground mt-4'>
              After confirming, our team will reach out to you regarding next steps and payment
              details.
            </p>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmSponsorship}>
              {event.isAllOrNothing ? 'Pledge Sponsorship' : 'Confirm Sponsorship'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SponsorshipSection;
