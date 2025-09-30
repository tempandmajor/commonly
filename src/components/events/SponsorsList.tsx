import React from 'react';
import { SponsorshipTier } from '@/lib/types/event';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';

interface SponsorsListProps {
  sponsorshipTiers: SponsorshipTier[];
}

const SponsorsList: React.FC<SponsorsListProps> = ({ sponsorshipTiers }) => {
  // Filter tiers that have sponsors
  const tiersWithSponsors = sponsorshipTiers.filter(
    tier => tier.sponsors && tier.sponsors.length > 0
  );

  if (tiersWithSponsors.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center'>
          <Shield className='mr-2 h-5 w-5' />
          Event Sponsors
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-6'>
          {tiersWithSponsors.map(tier => (
            <div key={tier.id} className='space-y-3'>
              <h3 className='font-medium text-lg'>{tier.name} Sponsors</h3>
              <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4'>
                {tier.sponsors.map(sponsor => (
                  <div key={sponsor.id} className='text-center'>
                    {sponsor.logo ? (
                      <div className='aspect-square rounded-md overflow-hidden bg-secondary mb-2 flex items-center justify-center'>
                        <img
                          src={sponsor.logo}
                          alt={sponsor.name}
                          className='max-w-full max-h-full object-contain'
                          onError={e => {
                            e.currentTarget.src = '/placeholder.svg';
                          }}
                        />
                      </div>
                    ) : (
                      <div className='aspect-square rounded-md bg-secondary flex items-center justify-center mb-2'>
                        <Shield className='h-8 w-8 text-muted-foreground' />
                      </div>
                    )}

                    <h4 className='font-medium text-sm truncate'>{sponsor.name}</h4>
                    {sponsor.website && (
                      <a
                        href={sponsor.website}
                        target='_blank'
                        rel='noreferrer noopener'
                        className='text-xs text-blue-500 hover:underline truncate block'
                      >
                        Visit website
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SponsorsList;
