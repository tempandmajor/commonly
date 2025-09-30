import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CircleUserRound, Check, X } from 'lucide-react';
import { EventCollaborator } from '@/lib/types/event';

interface CollaboratorCardProps {
  collaborator: EventCollaborator;
  onRemove: (id: string) => void;
}

export const CollaboratorCard = ({ collaborator, onRemove }: CollaboratorCardProps) => {
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-500';
      case 'declined':
        return 'bg-red-500';
      case 'pending':
      default:
        return 'bg-yellow-500';
    }
  };

  return (
    <Card className='bg-muted/30'>
      <CardHeader className='py-3 px-4 flex flex-row items-center justify-between'>
        <div className='flex items-center gap-2'>
          <CircleUserRound className='h-5 w-5 text-muted-foreground' />
          <span className='font-medium'>{collaborator.email}</span>
          {collaborator.name && (
            <span className='text-sm text-muted-foreground'>({collaborator.name})</span>
          )}
          {collaborator.isExistingUser && (
            <Badge variant='outline' className='flex items-center gap-1 ml-2'>
              <Check className='h-3 w-3' /> Registered user
            </Badge>
          )}
        </div>
        <div className='flex items-center gap-2'>
          <Badge className={getStatusBadgeColor(collaborator.status)}>{collaborator.status}</Badge>
          <Badge variant='outline'>{collaborator.role || 'co-organizer'}</Badge>
          <Button
            variant='ghost'
            size='icon'
            className='h-7 w-7'
            onClick={() => onRemove(collaborator.id)}
          >
            <X className='h-4 w-4' />
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
};
