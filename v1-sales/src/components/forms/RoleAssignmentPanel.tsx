import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Users } from "lucide-react";

interface Role {
  id: string;
  name: string;
  description?: string;
}

interface RoleAssignmentPanelProps {
  roles: Role[];
  selectedRoleIds: string[];
  onToggleRole: (roleId: string, checked: boolean) => void;
}

export const RoleAssignmentPanel = ({ roles, selectedRoleIds, onToggleRole }: RoleAssignmentPanelProps) => {
  return (
    <div className="h-full flex flex-col bg-background border-l">
      <div className="p-4 border-b">
        <h3 className="font-semibold mb-1">Assign Roles</h3>
        <p className="text-xs text-muted-foreground">
          {selectedRoleIds.length} of {roles.length} selected
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {roles.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground font-medium mb-1">No roles configured</p>
            <p className="text-xs text-muted-foreground">
              Your organization's industry needs role setup. Contact an administrator.
            </p>
          </div>
        ) : (
          roles.map(role => (
            <div key={role.id} className="flex items-start space-x-2 p-2 rounded-md hover:bg-accent">
              <Checkbox
                id={`role-${role.id}`}
                checked={selectedRoleIds.includes(role.id)}
                onCheckedChange={(checked) => onToggleRole(role.id, !!checked)}
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <Label htmlFor={`role-${role.id}`} className="text-sm font-medium cursor-pointer">
                  {role.name}
                </Label>
                {role.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {role.description}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
