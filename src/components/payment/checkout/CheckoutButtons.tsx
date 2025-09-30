import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface CheckoutData {
  amount: number;
  type: 'ticket' | 'subscription' | 'product';
  description?: string | undefined;
}

interface CheckoutButtonsProps {
  checkoutData: CheckoutData;
  paymentMethod: 'stripe' | 'platform-credit';
  loading: boolean;
  setLoading: (loading: boolean) => void;
  canUsePlatformCredit: boolean;
  onClose: () => void;
}

const CheckoutButtons = ({
  checkoutData,
  paymentMethod,
  loading,
  setLoading,
  canUsePlatformCredit,
  onClose,
}: CheckoutButtonsProps) => {
  const handlePayment = async () => {
    setLoading(true);
    try {
      // Mock payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      onClose();
    } catch (_error) {
      // Error handling silently ignored
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='flex gap-3'>
      <Button variant='outline' onClick={onClose} disabled={loading} className='flex-1'>
        Cancel
      </Button>
      <Button
        onClick={handlePayment}
        disabled={loading || (paymentMethod === 'platform-credit' && !canUsePlatformCredit)}
        className='flex-1'
      >
        {loading && <Loader2 className='h-4 w-4 mr-2 animate-spin' />}
        Complete Purchase
      </Button>
    </div>
  );
};

export default CheckoutButtons;
