import React, { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { EventFormValues } from '@/lib/validations/eventValidation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EventCollaborator } from '@/lib/types/event';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import { FormFieldWrapper } from '@/components/shared/form-fields/FormFieldWrapper';

interface CollaboratorFormProps {
  onAddCollaborator: (collaborator: Omit<EventCollaborator, 'id'>) => void;
  form: UseFormReturn<EventFormValues>;
}

export const CollaboratorForm = ({ onAddCollaborator, form }: CollaboratorFormProps) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('co-organizer');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) return;

    onAddCollaborator({
      email: email.trim(), // This is required
      name: name.trim() || undefined,
      role,
      status: 'pending',
    });

    // Reset form fields
    setEmail('');
    setName('');
    setRole('co-organizer');
  };

  return (
    <Card className='border-dashed'>
      <CardContent className='pt-4'>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='space-y-2'>
              <FormFieldWrapper
                form={form}
                name='collaboratorEmail'
                label='Email'
                description='Enter the email address of the person you want to invite'
                required={true}
              >
                <Input
                  value={email}
                  onChange={e => setEmail((e.target as HTMLInputElement).value)}
                  placeholder='collaborator@example.com'
                  required
                  type='email'
                />
              </FormFieldWrapper>
            </div>

            <div className='space-y-2'>
              <FormFieldWrapper
                form={form}
                name='collaboratorName'
                label='Name (Optional)'
                description='Enter the name of the collaborator if known'
              >
                <Input
                  value={name}
                  onChange={e => setName((e.target as HTMLInputElement).value)}
                  placeholder='Jane Doe'
                />
              </FormFieldWrapper>
            </div>

            <div className='space-y-2'>
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue placeholder='Select role' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='co-organizer'>Co-organizer</SelectItem>
                  <SelectItem value='assistant'>Assistant</SelectItem>
                  <SelectItem value='moderator'>Moderator</SelectItem>
                  <SelectItem value='helper'>Helper</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='flex justify-end'>
            <Button type='submit'>
              <PlusCircle className='h-4 w-4 mr-2' />
              Add Collaborator
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
