import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { Button, ButtonProps } from '@/components/ui/button';
import { SubscriptionCheckoutModal } from './subscription/SubscriptionCheckoutModal';

interface SubscriptionButtonProps extends Omit<ButtonProps, 'onClick'> {
  planTitle: string;
  planDescription: string;
  price: number;
  productId?: string;
  customerEmail?: string;
  onSubscribeSuccess?: () => void;
  onSubscribeError?: (error: Error) => void;
}

const SubscriptionButton = ({
  planTitle,
  planDescription,
  price,
  productId,
  customerEmail,
  onSubscribeSuccess,
  onSubscribeError,
  children,
          ...buttonProps
}: SubscriptionButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsModalOpen(true)} {...buttonProps}>
        {children || (
          <>
            <Calendar className='mr-2 h-4 w-4' />
            Subscribe
          </>
        )}
      </Button>

      <SubscriptionCheckoutModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        planTitle={planTitle}
        planDescription={planDescription}
        price={price}
        productId={productId}
        customerEmail={customerEmail}
        onSuccess={onSubscribeSuccess}
        onError={onSubscribeError}
      />
    </>
  );
};

export default SubscriptionButton;
