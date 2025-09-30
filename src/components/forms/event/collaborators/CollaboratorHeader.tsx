import { Users } from 'lucide-react';

export const CollaboratorHeader = () => {
  return (
    <>
      <div className='flex items-center gap-4'>
        <Users className='h-4 w-4 text-muted-foreground' />
        <span className='text-sm font-medium'>Event Collaborators</span>
      </div>
      <p className='text-sm text-muted-foreground mb-4'>
        Invite others to help manage this event. They'll receive an email invitation.
      </p>
    </>
  );
};
