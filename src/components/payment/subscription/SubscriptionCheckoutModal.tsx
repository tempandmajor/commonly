import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SubscriptionPaymentForm } from './SubscriptionPaymentForm';

interface SubscriptionCheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planTitle: string;
  planDescription: string;
  price: number;
  productId?: string | undefined;
  customerEmail?: string | undefined;
  onSuccess?: () => void | undefined;
  onError?: (error: Error) => void | undefined;
}

export const SubscriptionCheckoutModal = ({
  open,
  onOpenChange,
  planTitle,
  planDescription,
  price,
  productId,
  customerEmail,
  onSuccess,
  onError,
}: SubscriptionCheckoutModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>{`Subscription to ${planTitle}`}</DialogTitle>
          <DialogDescription>{planDescription}</DialogDescription>
        </DialogHeader>

        <SubscriptionPaymentForm
          price={price}
          productId={productId}
          customerEmail={customerEmail}
          onSuccess={onSuccess}
          onError={onError}
        />
      </DialogContent>
    </Dialog>
  );
};
