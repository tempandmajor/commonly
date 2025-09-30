import { Badge } from '@/components/ui/badge';

interface ConnectStatusBadgeProps {
  isEnabled: boolean;
}

const ConnectStatusBadge = ({ isEnabled }: ConnectStatusBadgeProps) => {
  if (isEnabled) {
    return <Badge className='bg-green-100 text-green-800 hover:bg-green-200'>Active</Badge>;
  }

  return (
    <Badge variant='outline' className='bg-amber-100 text-amber-800 hover:bg-amber-200'>
      Setup Required
    </Badge>
  );
};

export default ConnectStatusBadge;
