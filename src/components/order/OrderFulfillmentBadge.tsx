import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Truck, Factory, XCircle, Upload } from 'lucide-react';
import type { FC } from 'react';
import type { FulfillmentStatus } from '@/lib/types/order';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

export interface OrderFulfillmentBadgeProps {
  status: FulfillmentStatus;
  className?: string | undefined;
  tooltip?: string | undefined;
}

const labelMap: Record<FulfillmentStatus, string> = {
  submitted: 'Submitted',
  in_production: 'In Production',
  shipped: 'Shipped',
  cancelled: 'Cancelled',
  submission_failed: 'Submission Failed',
};

const iconMap: Record<FulfillmentStatus, FC<any>> = {
  submitted: Upload,
  in_production: Factory,
  shipped: Truck,
  cancelled: XCircle,
  submission_failed: XCircle,
};

const variantClassMap: Record<FulfillmentStatus, string> = {
  submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  in_production: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  shipped: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  cancelled: 'bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  submission_failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

export const OrderFulfillmentBadge: FC<OrderFulfillmentBadgeProps> = ({
  status,
  className,
  tooltip,
}) => {
  const Icon = iconMap[status] ?? CheckCircle2;
  const label = labelMap[status] ?? status;
  const classes = variantClassMap[status] ?? '';

  const badgeEl = (
    <Badge className={`${classes} inline-flex items-center gap-1 ${className ?? ''}`.trim()}>
      <Icon className='h-3.5 w-3.5' />
      <span>{label}</span>
    </Badge>
  );

  if (!tooltip) return badgeEl;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{badgeEl}</TooltipTrigger>
        <TooltipContent>
          <span className='whitespace-pre-line'>{tooltip}</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default OrderFulfillmentBadge;
