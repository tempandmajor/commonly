import { Gift } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PaymentMethodBadgeProps {
  usePlatformCredit: boolean;
}

const PaymentMethodBadge = ({ usePlatformCredit }: PaymentMethodBadgeProps) => {
  if (!usePlatformCredit) return null;

  return (
    <Badge variant='outline' className='bg-violet-100 text-violet-700 hover:bg-violet-100'>
      <Gift className='h-3 w-3 mr-1' />
      Platform Credit
    </Badge>
  );
};

export default PaymentMethodBadge;
