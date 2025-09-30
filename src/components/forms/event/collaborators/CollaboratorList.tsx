import { AlertCircle } from 'lucide-react';
import { CollaboratorCard } from './CollaboratorCard';
import { EventCollaborator } from '@/lib/types/event';

interface CollaboratorListProps {
  collaborators: EventCollaborator[];
  onRemoveCollaborator: (id: string) => void;
}

export const CollaboratorList = ({
  collaborators,
  onRemoveCollaborator,
}: CollaboratorListProps) => {
  if (collaborators.length === 0) {
    return null;
  }

  return (
    <div className='space-y-2 mt-4'>
      <h4 className='text-sm font-medium'>Collaborators ({collaborators.length})</h4>
      <div className='space-y-2'>
        {collaborators.map(collaborator => (
          <CollaboratorCard
            key={collaborator.id}
            collaborator={collaborator}
            onRemove={onRemoveCollaborator}
          />
        ))}
      </div>
      {collaborators.some(c => c.status === 'pending') && (
        <div className='flex items-start gap-2 mt-2 text-sm text-muted-foreground'>
          <AlertCircle className='h-4 w-4 mt-0.5' />
          <p>Pending invitations will be sent when the event is created</p>
        </div>
      )}
    </div>
  );
};
