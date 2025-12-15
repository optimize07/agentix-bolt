import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useOrganization } from "@/contexts/OrganizationContext";
import { PermissionGate } from "@/components/PermissionGate";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Building2, Users, Network, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

interface OrganizationUnit {
  id: string;
  name: string;
  type: string;
  parent_id: string | null;
  metadata: any;
  member_count?: number;
}

export const OrganizationSettings = () => {
  const navigate = useNavigate();
  const { getLabel, organization } = useOrganization();
  const { toast } = useToast();
  const [orgName, setOrgName] = useState("");
  const [memberCount, setMemberCount] = useState(0);
  const [units, setUnits] = useState<OrganizationUnit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (organization) {
      setOrgName(organization.name);
      loadOrganizationData();
    }
  }, [organization]);

  const loadOrganizationData = async () => {
    if (!organization?.id) return;

    try {
      // Load member count
      const { count: memberCountData } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organization.id);

      setMemberCount(memberCountData || 0);

      // Load organizational units
      const { data: unitsData, error: unitsError } = await supabase
        .from("organizational_units")
        .select("*")
        .eq("organization_id", organization.id)
        .order("name");

      if (unitsError) throw unitsError;

      // Get member count for each unit
      const unitsWithCounts = await Promise.all(
        (unitsData || []).map(async (unit) => {
          const { count } = await supabase
            .from("user_organizational_units")
            .select("*", { count: "exact", head: true })
            .eq("unit_id", unit.id);

          return { ...unit, member_count: count || 0 };
        })
      );

      setUnits(unitsWithCounts);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load organization data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveOrgDetails = async () => {
    if (!organization?.id) return;

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("organizations")
        .update({ name: orgName })
        .eq("id", organization.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Organization details updated"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!organization) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">Loading organization...</p>
      </div>
    );
  }

  return (
    <PermissionGate
      required="organization.manage"
      fallback={
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              You don't have permission to manage organization settings
            </p>
          </CardContent>
        </Card>
      }
    >
      <div className="grid gap-6">
        {/* Organization Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              <CardTitle>{getLabel('organization.details')}</CardTitle>
            </div>
            <CardDescription>
              Basic information about your organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">{getLabel('organization.name')}</Label>
                <Input
                  id="org-name"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{getLabel('organization.niche')}</Label>
                <Input value={organization.niche?.name || "N/A"} disabled />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{getLabel('organization.created')}</Label>
                <Input
                  value={organization.created_at ? format(new Date(organization.created_at), "PPP") : "N/A"}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label>{getLabel('organization.member_count')}</Label>
                <Input value={memberCount.toString()} disabled />
              </div>
            </div>

            <Button onClick={handleSaveOrgDetails} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        {/* Members Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <CardTitle>{getLabel('organization.members')}</CardTitle>
            </div>
            <CardDescription>
              Quick overview of your team members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{memberCount}</p>
                <p className="text-sm text-muted-foreground">Total team members</p>
              </div>
              <Button variant="outline" onClick={() => navigate("/settings?tab=users")}>
                Manage Users
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Organizational Units */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Network className="w-5 h-5" />
              <CardTitle>{getLabel('organization.units')}</CardTitle>
            </div>
            <CardDescription>
              Organizational structure and departments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Loading units...</p>
            ) : units.length === 0 ? (
              <p className="text-muted-foreground">No organizational units configured yet</p>
            ) : (
              <div className="space-y-2">
                {units.map((unit) => (
                  <div key={unit.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{unit.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {unit.type} • {unit.member_count} {unit.member_count === 1 ? 'member' : 'members'}
                      </p>
                    </div>
                    <Badge variant="outline">{unit.type}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
            </div>
            <CardDescription>
              Irreversible actions for your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  {getLabel('organization.delete')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your organization
                    and remove all associated data including dashboards, users, and settings.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction className="bg-destructive text-destructive-foreground">
                    Delete Organization
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </PermissionGate>
  );
};
