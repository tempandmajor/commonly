import { Badge } from '@/components/ui/badge';

interface TransactionStatusBadgeProps {
  status: string;
}

export const TransactionStatusBadge = ({ status }: TransactionStatusBadgeProps) => {
  switch (status) {
    case 'completed':
      return <Badge className='bg-black text-white'>Completed</Badge>;
    case 'pending':
      return <Badge className='bg-gray-200 text-gray-800'>Pending</Badge>;
    case 'failed':
      return <Badge className='bg-gray-400 text-white'>Failed</Badge>;
    case 'refunded':
      return <Badge variant='secondary'>Refunded</Badge>;
    default:
      return <Badge className='bg-gray-100 text-gray-800'>{status}</Badge>;
  }
};
