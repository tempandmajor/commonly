import { useStripeConnect } from '@/hooks/useStripeConnect';
import { useIdentityVerification } from '@/hooks/useIdentityVerification';
import { useLocation } from 'react-router-dom';
import StripeConnectRequired from '@/components/payment/connect/StripeConnectRequired';
import CatererProfileForm from './CatererProfileForm';
import VenueOwnerVerification from '@/components/venue/VenueOwnerVerification';

interface CatererProfileFormWrapperProps {
  onSubmit?: (catererData: unknown) => Promise<void> | undefined;
  initialData?: unknown | undefined;
}

const CatererProfileFormWrapper = ({ onSubmit, initialData }: CatererProfileFormWrapperProps) => {
  const { hasStripeConnect, isLoading } = useStripeConnect();
  const { verificationStatus } = useIdentityVerification();
  const location = useLocation();

  if (isLoading) {
    return <StripeConnectRequired type='caterer' isLoading={true} />;
  }

  if (!hasStripeConnect) {
    return <StripeConnectRequired type='caterer' returnPath={location.pathname} />;
  }

  // If the user hasn't been verified, show the verification card
  if (verificationStatus !== 'verified') {
    return (
      <div className='space-y-6'>
        <h2 className='text-2xl font-bold'>Create Your Catering Profile</h2>
        <p className='text-muted-foreground'>
          Before you can list your catering service, we need to verify your identity for security
          purposes.
        </p>
        <VenueOwnerVerification className='mt-6' />
      </div>
    );
  }

  return (
    <CatererProfileForm
      {...(onSubmit && { onSubmit })}
      {...(initialData && { initialData })}
    />
  );
};

export default CatererProfileFormWrapper;
