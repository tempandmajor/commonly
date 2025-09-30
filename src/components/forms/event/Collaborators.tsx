import { UseFormReturn } from 'react-hook-form';
import { EventFormValues } from '@/lib/validations/eventValidation';
import { EventCollaborator } from '@/lib/types/event';
import { toast } from 'sonner';
import { CollaboratorHeader } from './collaborators/CollaboratorHeader';
import { CollaboratorForm } from './collaborators/CollaboratorForm';
import { CollaboratorList } from './collaborators/CollaboratorList';
import { v4 as uuidv4 } from 'uuid';

interface CollaboratorsProps {
  form: UseFormReturn<EventFormValues>;
}

export const Collaborators = ({ form }: CollaboratorsProps) => {
  const collaborators = form.watch('collaborators') || [];

  const handleAddCollaborator = (newCollaboratorData: Omit<EventCollaborator, 'id'>) => {
    // Check if the email is already in the list
    if (collaborators.some(c => c.email === newCollaboratorData.email)) {
      toast.error('This email is already added as a collaborator');
      return;
    }

    // Create a complete collaborator object with a required id
    const newCollaborator: EventCollaborator = {
      id: uuidv4(), // Always generate an id
      email: newCollaboratorData.email,
      name: newCollaboratorData.name,
      role: newCollaboratorData.role || 'co-organizer',
      status: newCollaboratorData.status || 'pending',
      isExistingUser: newCollaboratorData.isExistingUser,
    };

    // Make sure all collaborators have ids and required fields
    const updatedCollaborators: EventCollaborator[] = [
          ...collaborators.map(c => ({
          ...c,
        id: c.id || uuidv4(), // Ensure existing collaborators have ids
        email: c.email, // Ensure email exists (it's required)
        status: c.status || 'pending',
        role: c.role || 'co-organizer',
      })),
      newCollaborator,
    ];

    form.setValue('collaborators', updatedCollaborators);
  };

  const handleRemoveCollaborator = (id: string) => {
    const updatedCollaborators = collaborators.filter(c => c.id !== id);

    // Ensure all remaining collaborators have the required fields
    const validatedCollaborators: EventCollaborator[] = updatedCollaborators.map(c => ({
      id: c.id || uuidv4(), // Ensure id is present
      email: c.email, // Email is required
      name: c.name,
      role: c.role || 'co-organizer',
      status: c.status || 'pending',
      isExistingUser: c.isExistingUser,
    }));

    form.setValue('collaborators', validatedCollaborators);
    toast.info('Collaborator removed');
  };

  return (
    <div className='space-y-4'>
      <CollaboratorHeader />
      <CollaboratorForm onAddCollaborator={handleAddCollaborator} form={form} />
      <CollaboratorList
        collaborators={collaborators.map(c => ({
          id: c.id || uuidv4(),
          email: c.email,
          name: c.name,
          role: c.role || 'co-organizer',
          status: c.status || 'pending',
          isExistingUser: c.isExistingUser,
        }))}
        onRemoveCollaborator={handleRemoveCollaborator}
      />
    </div>
  );
};
