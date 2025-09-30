import { User } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import SubscriptionSetup from './SubscriptionSetup';

interface CreatorSettingsProps {
  user: User;
  isEligibleForSubscription: boolean;
  isPrivateProfile: boolean;
  onUpdateSubscriptionEligibility: (isEligible: boolean) => Promise<void>;
  onPrivacyToggle: (isPrivate: boolean) => Promise<void>;
}

const CreatorSettings = ({
  user,
  isEligibleForSubscription,
  isPrivateProfile,
  onUpdateSubscriptionEligibility,
  onPrivacyToggle,
}: CreatorSettingsProps) => {
  return (
    <Card className='border-primary/20 bg-primary/5'>
      <CardContent className='p-6'>
        <div className='space-y-4'>
          <h3 className='text-xl font-bold'>Creator Settings</h3>

          <div className='flex flex-col space-y-4'>
            <div className='flex items-center space-x-2'>
              <Switch
                id='subscription-eligibility'
                checked={isEligibleForSubscription}
                onCheckedChange={onUpdateSubscriptionEligibility}
              />
              <Label htmlFor='subscription-eligibility'>
                Enable subscription option for followers
              </Label>
            </div>

            {isEligibleForSubscription && (
              <div className='pl-6 space-y-2'>
                <p className='text-sm text-muted-foreground'>
                  Configure your subscription offerings
                </p>
                <SubscriptionSetup onClose={() => {}} />
              </div>
            )}

            <div className='flex items-center space-x-2 mt-4'>
              <Switch
                id='profile-privacy'
                checked={isPrivateProfile}
                onCheckedChange={onPrivacyToggle}
              />
              <Label htmlFor='profile-privacy'>
                Private profile (only followers can see your content)
              </Label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreatorSettings;
