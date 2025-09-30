import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { reportError, ErrorSeverity } from '@/utils/errorReporting';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'user' | 'moderator';
  lastLogin: Date;
  status: 'active' | 'suspended' | 'pending';
}

interface AccessManagementProps {
  onUserRoleChange?: (userId: string, newRole: string) => void | undefined;
}

export function AccessManagement({ onUserRoleChange }: AccessManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Fetch real user data from Supabase
        const { data: usersData, error } = await supabase
          .from('users')
          .select('id, email, is_admin, created_at, updated_at')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        const formattedUsers: User[] =
          usersData?.map((user: any) => ({
            id: user.id,
            email: user.email || 'No email',
            role: user.is_admin ? 'admin' : 'user',
            lastLogin: user.updated_at ? new Date(user.updated_at) : new Date(user.created_at),
            status: 'active', // Default to active since we don't have a status field
          })) || [];

        setUsers(formattedUsers);
        setLoading(false);
      } catch (error) {
        reportError(
          error instanceof Error ? error : new Error('Failed to fetch users'),
          { component: 'AccessManagement', action: 'fetchUsers' },
          ErrorSeverity.HIGH
        );
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      // Update user role in Supabase
      const { error } = await supabase
        .from('users')
        .update({ is_admin: newRole === 'admin' })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      // Update local state
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, role: newRole as User['role'] } : user
        )
      );

      onUserRoleChange?.(userId, newRole);
      toast.success('User role updated successfully');
    } catch (error) {
      reportError(
        error instanceof Error ? error : new Error('Failed to update user role'),
        { component: 'AccessManagement', action: 'updateRole', userId },
        ErrorSeverity.HIGH
      );
      toast.error('Failed to update user role');
    }
  };

  const handleStatusChange = async (userId: string, newStatus: User['status']) => {
    try {
      setUsers(prevUsers =>
        prevUsers.map(user => (user.id === userId ? { ...user, status: newStatus } : user))
      );
      toast.success(`User ${newStatus} successfully`);
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'moderator':
        return 'default';
      case 'user':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'suspended':
        return 'destructive';
      case 'pending':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Management</CardTitle>
          <CardDescription>Loading user access controls...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className='flex items-center justify-between p-4 border rounded'>
                <div className='space-y-2'>
                  <div className='h-4 bg-gray-200 rounded w-48'></div>
                  <div className='h-3 bg-gray-200 rounded w-32'></div>
                </div>
                <div className='space-x-2'>
                  <div className='h-6 bg-gray-200 rounded w-16 inline-block'></div>
                  <div className='h-6 bg-gray-200 rounded w-20 inline-block'></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Access Management</CardTitle>
        <CardDescription>Manage user roles and permissions</CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='flex items-center space-x-2'>
          <Input
            placeholder='Search users...'
            value={searchTerm}
            onChange={e => setSearchTerm((e.target as HTMLInputElement).value)}
            className='max-w-sm'
          />
        </div>

        <div className='space-y-4'>
          {filteredUsers.map(user => (
            <div key={user.id} className='flex items-center justify-between p-4 border rounded-lg'>
              <div className='space-y-1'>
                <p className='text-sm font-medium leading-none'>{user.email}</p>
                <p className='text-sm text-muted-foreground'>
                  Last login: {user.lastLogin.toLocaleDateString()}
                </p>
              </div>

              <div className='flex items-center space-x-2'>
                <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                <Badge variant={getStatusBadgeVariant(user.status)}>{user.status}</Badge>

                <select
                  value={user.role}
                  onChange={e => handleRoleChange(user.id, e.target.value)}
                  className='text-sm border rounded px-2 py-1'
                >
                  <option value='user'>User</option>
                  <option value='moderator'>Moderator</option>
                  <option value='admin'>Admin</option>
                </select>

                {user.status === 'active' ? (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleStatusChange(user.id, 'suspended')}
                  >
                    Suspend
                  </Button>
                ) : (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleStatusChange(user.id, 'active')}
                  >
                    Activate
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <div className='text-center py-6 text-muted-foreground'>
            No users found matching your search.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
