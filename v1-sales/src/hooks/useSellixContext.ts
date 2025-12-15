import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";

interface SellixContext {
  teamSize: number;
  recentSubmissionsCount: string;
  targetProgress: string;
  loading: boolean;
}

export const useSellixContext = (): SellixContext => {
  const { organization, user } = useOrganization();
  const [context, setContext] = useState<SellixContext>({
    teamSize: 0,
    recentSubmissionsCount: "N/A",
    targetProgress: "N/A",
    loading: true,
  });

  useEffect(() => {
    if (!organization?.id) return;

    const fetchContext = async () => {
      try {
        // Get team size
        const { count: teamCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("organization_id", organization.id);

        // Get recent submissions (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const { count: submissionCount } = await supabase
          .from("form_submissions")
          .select("*", { count: "exact", head: true })
          .eq("organization_id", organization.id)
          .gte("submitted_at", sevenDaysAgo.toISOString());

        setContext({
          teamSize: teamCount || 0,
          recentSubmissionsCount: submissionCount ? `${submissionCount} in last 7 days` : "No recent activity",
          targetProgress: "Data not yet configured",
          loading: false,
        });
      } catch (error) {
        console.error("[Sellix Context] Error fetching data:", error);
        setContext({
          teamSize: 0,
          recentSubmissionsCount: "Error loading data",
          targetProgress: "Error loading data",
          loading: false,
        });
      }
    };

    fetchContext();
  }, [organization?.id]);

  return context;
};
