import { formatDate } from '@/utils/dates';
import { formatCurrency } from '@/utils/currency';

interface PaymentDetailsProps {
  paymentDetails: {
    amount: number;
    currency: string;
    description?: string | undefined;
    createdAt: string;
  };
  eventId?: string | null;
}

export const PaymentDetails = ({ paymentDetails, eventId }: PaymentDetailsProps) => {
  return (
    <div className='mt-4 border-t pt-4 space-y-2'>
      <p className='text-sm'>
        <span className='font-medium'>Amount:</span>{' '}
        {formatCurrency(paymentDetails.amount, paymentDetails.currency)}
      </p>

      {paymentDetails.description && (
        <p className='text-sm'>
          <span className='font-medium'>Description:</span> {paymentDetails.description}
        </p>
      )}

      <p className='text-sm'>
        <span className='font-medium'>Date:</span> {formatDate(paymentDetails.createdAt)}
      </p>

      {eventId && (
        <p className='text-sm'>
          <span className='font-medium'>Event ID:</span> {eventId}
        </p>
      )}
    </div>
  );
};
