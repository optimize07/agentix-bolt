import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useOrganization } from "@/contexts/OrganizationContext";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, Users, Building2 } from "lucide-react";

interface Dashboard {
  id: string;
  name: string;
  user_id: string | null;
  is_default: boolean;
  created_at: string;
  owner?: {
    full_name: string | null;
    email: string;
  };
}

interface DashboardSelectorProps {
  currentDashboardId: string | null;
  onSelect: (dashboardId: string) => void;
}

export const DashboardSelector = ({ currentDashboardId, onSelect }: DashboardSelectorProps) => {
  const { getLabel, organization } = useOrganization();
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboards();
  }, [organization?.id]);

  const loadDashboards = async () => {
    if (!organization?.id) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      const { data, error } = await supabase
        .from("dashboard_layouts")
        .select(`
          id,
          name,
          user_id,
          is_default,
          created_at,
          owner:profiles(full_name, email)
        `)
        .eq("organization_id", organization.id)
        .or(`user_id.eq.${userId},user_id.is.null`)
        .order("is_default", { ascending: false })
        .order("name");

      if (error) throw error;

      setDashboards(data as any || []);
    } catch (error) {
      console.error("Failed to load dashboards:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDashboardIcon = (dashboard: Dashboard) => {
    if (dashboard.is_default) return <Building2 className="w-4 h-4" />;
    if (dashboard.user_id) return <LayoutDashboard className="w-4 h-4" />;
    return <Users className="w-4 h-4" />;
  };

  const getDashboardLabel = (dashboard: Dashboard) => {
    if (dashboard.is_default) return getLabel('dashboard.org_default');
    if (dashboard.user_id) return getLabel('dashboard.personal');
    return getLabel('dashboard.team');
  };

  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger className="w-[250px]">
          <SelectValue placeholder="Loading..." />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={currentDashboardId || undefined} onValueChange={onSelect}>
      <SelectTrigger className="w-[250px]">
        <SelectValue placeholder={getLabel('dashboard.switch')} />
      </SelectTrigger>
      <SelectContent>
        {dashboards.map((dashboard) => (
          <SelectItem key={dashboard.id} value={dashboard.id}>
            <div className="flex items-center gap-2">
              {getDashboardIcon(dashboard)}
              <span className="flex-1">{dashboard.name}</span>
              <Badge variant="outline" className="ml-2 text-xs">
                {getDashboardLabel(dashboard)}
              </Badge>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
