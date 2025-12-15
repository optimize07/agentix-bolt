import { useState, useEffect } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface UserWithRole {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  role_name: string | null;
  role_slug: string | null;
  role_id: string | null;
  unit_name: string | null;
}

interface Role {
  id: string;
  name: string;
  slug: string;
}

export const UsersManagement = () => {
  const { organization, getLabel, niche } = useOrganization();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [userToDelete, setUserToDelete] = useState<UserWithRole | null>(null);

  useEffect(() => {
    if (organization && niche) {
      loadUsers();
      loadRoles();
    }
  }, [organization, niche]);

  const loadUsers = async () => {
    if (!organization) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          avatar_url,
          roles:user_roles (
            role_id,
            niche_roles (
              id,
              name,
              slug
            )
          ),
          units:user_organizational_units (
            organizational_units (
              name
            )
          )
        `)
        .eq('organization_id', organization.id);

      if (error) throw error;

      const formattedUsers: UserWithRole[] = data.map((user: any) => ({
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        avatar_url: user.avatar_url,
        role_name: user.roles?.[0]?.niche_roles?.name || null,
        role_slug: user.roles?.[0]?.niche_roles?.slug || null,
        role_id: user.roles?.[0]?.role_id || null,
        unit_name: user.units?.[0]?.organizational_units?.name || null,
      }));

      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: 'Error loading users',
        description: 'Failed to load team members',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    if (!niche) return;

    try {
      const { data, error } = await supabase
        .from('niche_roles')
        .select('id, name, slug')
        .eq('niche_id', niche.id)
        .order('name');

      if (error) throw error;
      setRoles(data || []);
      if (data && data.length > 0) {
        setSelectedRole(data[0].id);
      }
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  };

  const handleChangeRole = async (userId: string, currentRoleId: string | null, newRoleId: string) => {
    if (!organization) return;

    try {
      if (currentRoleId) {
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({ role_id: newRoleId })
          .eq('user_id', userId)
          .eq('organization_id', organization.id);

        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            organization_id: organization.id,
            role_id: newRoleId
          });

        if (error) throw error;
      }

      toast({
        title: 'Role updated',
        description: 'User role has been changed successfully'
      });

      loadUsers();
    } catch (error) {
      console.error('Error changing role:', error);
      toast({
        title: 'Error changing role',
        description: 'Failed to update user role',
        variant: 'destructive'
      });
    }
  };

  const handleRemoveUser = async () => {
    if (!userToDelete || !organization) return;

    try {
      // Delete user role
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userToDelete.id)
        .eq('organization_id', organization.id);

      if (error) throw error;

      toast({
        title: 'User removed',
        description: 'User has been removed from organization'
      });

      setUserToDelete(null);
      loadUsers();
    } catch (error) {
      console.error('Error removing user:', error);
      toast({
        title: 'Error removing user',
        description: 'Failed to remove user',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Invite User</CardTitle>
          <CardDescription>Add new team members to your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Email address"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1"
            />
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button disabled>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Email invitations coming soon
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>Manage your organization members</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No team members found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.full_name || 'No name'}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Select
                        value={user.role_id || ''}
                        onValueChange={(value) => handleChangeRole(user.id, user.role_id, value)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Role">
                            {user.role_name ? (
                              <Badge variant="outline">{user.role_name}</Badge>
                            ) : (
                              'No role'
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {user.unit_name ? (
                        <Badge variant="secondary">{user.unit_name}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">No unit</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setUserToDelete(user)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove user from organization?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {userToDelete?.full_name || userToDelete?.email} from your organization.
              They will lose access to all organization resources.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveUser}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};