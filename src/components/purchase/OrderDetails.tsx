import { Package } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { OrderFulfillmentBadge } from '@/components/order/OrderFulfillmentBadge';
import type { FulfillmentStatus } from '@/lib/types/order';

interface OrderDetailsProps {
  product: unknown;
  orderDetails: {
    quantity?: number | undefined;
    totalAmount: number;
  } | null;
}

export const OrderDetails = ({ product, orderDetails }: OrderDetailsProps) => {
  if (!product || !orderDetails) return null;

  return (
    <div>
      <div className='flex items-center justify-between mb-2'>
        <h3 className='font-semibold text-lg'>Product Details</h3>
        {(orderDetails as unknown as { fulfillment_status?: FulfillmentStatus | null })
          ?.fulfillment_status && (
          <OrderFulfillmentBadge
            status={
              (orderDetails as unknown as { fulfillment_status: FulfillmentStatus })
                .fulfillment_status
            }
          />
        )}
      </div>
      <div className='border rounded-lg overflow-hidden'>
        <div className='flex flex-col sm:flex-row items-center'>
          {product.images && product.images.length > 0 && (
            <div className='w-full sm:w-1/3'>
              <img
                src={product.images[0]}
                alt={product.name}
                className='h-full w-full object-cover'
              />
            </div>
          )}
          <div className='p-4 w-full sm:w-2/3'>
            <h4 className='font-medium text-lg'>{product.name}</h4>
            <p className='text-sm text-muted-foreground mb-2'>{product.description}</p>
            <div className='flex items-center justify-between'>
              <p className='font-semibold'>
                {formatCurrency(product.price)} x {orderDetails?.quantity || 1}
              </p>
              <div className='flex items-center text-sm text-muted-foreground'>
                <Package className='h-3.5 w-3.5 mr-1' />
                <span>Quantity: {orderDetails?.quantity || 1}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
