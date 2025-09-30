import React, { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  EventFormValues,
  CollaboratorRole,
  CollaboratorStatus,
} from '@/lib/validations/eventValidation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Plus,
  X,
  Mail,
  User,
  Crown,
  Mic,
  Shield,
  Users,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CollaboratorManagerProps {
  form: UseFormReturn<EventFormValues>;
}

interface CollaboratorFormData {
  email: string;
  name: string;
  role: CollaboratorRole;
}

export const CollaboratorManager: React.FC<CollaboratorManagerProps> = ({ form }) => {
  const [isAddingCollaborator, setIsAddingCollaborator] = useState(false);
  const [collaboratorForm, setCollaboratorForm] = useState<CollaboratorFormData>({
    email: '',
    name: '',
    role: CollaboratorRole.CoOrganizer,
  });
  const [emailValidation, setEmailValidation] = useState<{
    isValid: boolean;
    message: string;
  }>({ isValid: true, message: '' });

  const collaborators = form.watch('collaborators') || [];

  const roleIcons = {
    [CollaboratorRole.CoOrganizer]: Crown,
    [CollaboratorRole.Speaker]: Mic,
    [CollaboratorRole.Moderator]: Shield,
    [CollaboratorRole.Assistant]: Users,
  };

  const roleDescriptions = {
    [CollaboratorRole.CoOrganizer]: 'Can edit event details and manage attendees',
    [CollaboratorRole.Speaker]: 'Presenting at the event',
    [CollaboratorRole.Moderator]: 'Managing discussions and Q&A',
    [CollaboratorRole.Assistant]: 'Helping with event coordination',
  };

  const statusIcons = {
    [CollaboratorStatus.Pending]: Clock,
    [CollaboratorStatus.Accepted]: CheckCircle,
    [CollaboratorStatus.Declined]: XCircle,
  };

  const statusColors = {
    [CollaboratorStatus.Pending]: 'text-yellow-600',
    [CollaboratorStatus.Accepted]: 'text-green-600',
    [CollaboratorStatus.Declined]: 'text-red-600',
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailValidation({ isValid: false, message: 'Email is required' });
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailValidation({ isValid: false, message: 'Please enter a valid email address' });
      return false;
    }
    if (collaborators.some(c => c.email === email)) {
      setEmailValidation({ isValid: false, message: 'This email is already added' });
      return false;
    }
    setEmailValidation({ isValid: true, message: '' });
    return true;
  };

  const handleAddCollaborator = () => {
    if (!validateEmail(collaboratorForm.email)) {
      return;
    }

    if (!collaboratorForm.name.trim()) {
      toast.error("Please enter the collaborator's name");
      return;
    }

    const newCollaborator = {
      id: crypto.randomUUID(),
      email: collaboratorForm.email,
      name: collaboratorForm.name,
      role: collaboratorForm.role,
      status: CollaboratorStatus.Pending,
      isExistingUser: false, // This would be determined by checking against user database
    };

    const updatedCollaborators = [...collaborators, newCollaborator];
    form.setValue('collaborators', updatedCollaborators);

    // Reset form
    setCollaboratorForm({
      email: '',
      name: '',
      role: CollaboratorRole.CoOrganizer,
    });
    setIsAddingCollaborator(false);
    setEmailValidation({ isValid: true, message: '' });

    toast.success(`Invitation will be sent to ${newCollaborator.email}`);
  };

  const handleRemoveCollaborator = (collaboratorId: string) => {
    const updatedCollaborators = collaborators.filter(c => c.id !== collaboratorId);
    form.setValue('collaborators', updatedCollaborators);
    toast.success('Collaborator removed');
  };

  const handleUpdateRole = (collaboratorId: string, newRole: CollaboratorRole) => {
    const updatedCollaborators = collaborators.map(c =>
      c.id === collaboratorId ? { ...c, role: newRole } : c
    );
    form.setValue('collaborators', updatedCollaborators);
    toast.success('Role updated');
  };

  const handleResendInvitation = (collaborator: unknown) => {
    // In a real implementation, this would trigger an API call
    toast.success(`Invitation resent to ${collaborator.email}`);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Users className='h-5 w-5' />
          Event Collaborators
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        <Alert>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>
            Add team members to help organize and manage your event. They'll receive email
            invitations with their assigned roles.
          </AlertDescription>
        </Alert>

        {/* Add Collaborator Form */}
        {isAddingCollaborator ? (
          <Card className='border-dashed'>
            <CardContent className='pt-6 space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='collaborator-email'>Email Address *</Label>
                  <Input
                    id='collaborator-email'
                    type='email'
                    placeholder='colleague@example.com'
                    value={collaboratorForm.email}
                    onChange={e => {
                      setCollaboratorForm(prev => ({ ...prev, email: (e.target as HTMLInputElement).value }));
                      validateEmail((e.target as HTMLInputElement).value);
                    }}
                    className={cn(!emailValidation.isValid && 'border-destructive')}
                  />
                  {!emailValidation.isValid && (
                    <p className='text-sm text-destructive'>{emailValidation.message}</p>
                  )}
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='collaborator-name'>Full Name *</Label>
                  <Input
                    id='collaborator-name'
                    placeholder='John Doe'
                    value={collaboratorForm.name}
                    onChange={e => setCollaboratorForm(prev => ({ ...prev, name: (e.target as HTMLInputElement).value }))}
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='collaborator-role'>Role</Label>
                <Select
                  value={collaboratorForm.role}
                  onValueChange={value =>
                    setCollaboratorForm(prev => ({ ...prev, role: value as CollaboratorRole }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(CollaboratorRole).map(role => {
                      const Icon = roleIcons[role];
                      return (
                        <SelectItem key={role} value={role}>
                          <div className='flex items-center gap-2'>
                            <Icon className='h-4 w-4' />
                            <div>
                              <div className='font-medium'>{role}</div>
                              <div className='text-xs text-muted-foreground'>
                                {roleDescriptions[role]}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className='flex gap-2'>
                <Button onClick={handleAddCollaborator} className='flex-1'>
                  <Send className='h-4 w-4 mr-2' />
                  Send Invitation
                </Button>
                <Button
                  variant='outline'
                  onClick={() => {
                    setIsAddingCollaborator(false);
                    setCollaboratorForm({
                      email: '',
                      name: '',
                      role: CollaboratorRole.CoOrganizer,
                    });
                    setEmailValidation({ isValid: true, message: '' });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Button
            type='button'
            variant='outline'
            onClick={() => setIsAddingCollaborator(true)}
            className='w-full'
          >
            <Plus className='h-4 w-4 mr-2' />
            Add Collaborator
          </Button>
        )}

        {/* Collaborators List */}
        {collaborators.length > 0 && (
          <div className='space-y-4'>
            <Separator />
            <div className='space-y-3'>
              <h4 className='text-sm font-medium'>Team Members ({collaborators.length})</h4>

              {collaborators.map((collaborator, index) => {
                const RoleIcon = roleIcons[collaborator.role];
                const StatusIcon = statusIcons[collaborator.status];

                return (
                  <Card key={collaborator.id} className='p-4'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-3'>
                        <Avatar className='h-10 w-10'>
                          <AvatarImage src='' alt={collaborator.name} />
                          <AvatarFallback>
                            {getInitials(collaborator.name || collaborator.email)}
                          </AvatarFallback>
                        </Avatar>

                        <div className='flex-1'>
                          <div className='flex items-center gap-2'>
                            <p className='font-medium'>{collaborator.name}</p>
                            <Badge variant='outline' className='text-xs'>
                              <RoleIcon className='h-3 w-3 mr-1' />
                              {collaborator.role}
                            </Badge>
                          </div>
                          <div className='flex items-center gap-2 mt-1'>
                            <Mail className='h-3 w-3 text-muted-foreground' />
                            <p className='text-sm text-muted-foreground'>{collaborator.email}</p>
                          </div>
                        </div>
                      </div>

                      <div className='flex items-center gap-2'>
                        <div className='flex items-center gap-1'>
                          <StatusIcon
                            className={cn('h-4 w-4', statusColors[collaborator.status])}
                          />
                          <span className='text-xs text-muted-foreground capitalize'>
                            {collaborator.status}
                          </span>
                        </div>

                        {collaborator.status === CollaboratorStatus.Pending && (
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => handleResendInvitation(collaborator)}
                          >
                            <Send className='h-3 w-3' />
                          </Button>
                        )}

                        <Select
                          value={collaborator.role}
                          onValueChange={value =>
                            handleUpdateRole(collaborator.id, value as CollaboratorRole)
                          }
                        >
                          <SelectTrigger className='w-auto'>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(CollaboratorRole).map(role => (
                              <SelectItem key={role} value={role}>
                                {role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleRemoveCollaborator(collaborator.id)}
                        >
                          <X className='h-4 w-4' />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {collaborators.length === 0 && !isAddingCollaborator && (
          <div className='text-center py-8 text-muted-foreground'>
            <Users className='h-12 w-12 mx-auto mb-4 opacity-50' />
            <p>No collaborators added yet</p>
            <p className='text-sm'>Add team members to help organize your event</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
