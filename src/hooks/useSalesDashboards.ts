import { useCallback, useEffect, useMemo, useState } from "react";
import { untypedSupabase as supabase } from "@/integrations/supabase/untyped-client";
import { Dashboard, DashboardComponent } from "@/types/dataBinding";
import { Sheet } from "@/utils/dataExtractor";
import { useUser } from "@/contexts/UserContext";
import { toast } from "sonner";

interface UseSalesDashboardsOptions {
  clientId?: string;
}

const buildSampleSheets = (): Sheet[] => [
  {
    id: "ds-1",
    name: "Sales Data",
    data: [
      ["Month", "Revenue", "Orders", "Customers"],
      ["January", "12500", "234", "189"],
      ["February", "15200", "289", "234"],
      ["March", "18900", "342", "287"],
    ],
  },
  {
    id: "ds-2",
    name: "Price Tracker",
    data: [
      ["Product", "Price", "Date", "Change"],
      ["Product A", "99.99", "2024-01-15", "5"],
      ["Product B", "149.99", "2024-01-15", "-3"],
      ["Product C", "79.99", "2024-01-15", "2"],
    ],
  },
];

const buildSampleDashboard = (): Dashboard => ({
  id: "dashboard-1",
  name: "Sales Dashboard",
  description: "Starter widgets for sales performance",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  components: [
    {
      id: "component-1",
      type: "statsCard",
      position: { x: 0, y: 0, w: 3, h: 2 },
      config: { title: "Total Revenue", change: "+12%", trend: "up", value: "12500" },
      dataBinding: {
        sheetId: "ds-1",
        columns: { value: "Revenue" },
        aggregation: "sum",
      },
    },
    {
      id: "component-2",
      type: "lineChart",
      position: { x: 3, y: 0, w: 6, h: 4 },
      config: { title: "Revenue Trend", xAxisKey: "Month", dataKey: "Revenue" },
      dataBinding: {
        sheetId: "ds-1",
        columns: { x: "Month", y: "Revenue" },
      },
    },
  ],
});

export const useSalesDashboards = ({ clientId }: UseSalesDashboardsOptions) => {
  const { user } = useUser();
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [sheets, setSheets] = useState<Sheet[]>(buildSampleSheets());
  const [isLoading, setIsLoading] = useState(true);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const storageKey = useMemo(() => `sales_dashboards_${clientId || "global"}`, [clientId]);

  const loadLocal = useCallback(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        setDashboards(parsed);
        return true;
      }
    } catch (error) {
      console.error("Failed to read dashboards from localStorage", error);
    }
    return false;
  }, [storageKey]);

  const saveLocal = useCallback(
    (items: Dashboard[]) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(items));
      } catch (error) {
        console.error("Failed to save dashboards to localStorage", error);
      }
    },
    [storageKey]
  );

  const loadFromSupabase = useCallback(async () => {
    if (!clientId || !user) return false;
    const { data, error } = await supabase
      .from("sales_dashboards")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to load dashboards from Supabase", error);
      return false;
    }

    const mapped = (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description ?? undefined,
      components: (row.components || []) as DashboardComponent[],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    if (mapped.length > 0) {
      setDashboards(mapped);
      return true;
    }

    return false;
  }, [clientId, user]);

  const persistToSupabase = useCallback(
    async (items: Dashboard[]) => {
      if (!clientId || !user) return;
      setSaveState("saving");
      try {
        const payload = items.map((d) => ({
          id: d.id,
          client_id: clientId,
          user_id: user.id,
          name: d.name,
          description: d.description ?? null,
          components: d.components,
        }));

        const { error } = await supabase.from("sales_dashboards").upsert(payload);
        if (error) throw error;
        setSaveState("saved");
      } catch (error) {
        console.error("Failed to save dashboards to Supabase", error);
        setSaveState("error");
        toast.error("Could not save dashboards to Supabase, keeping local copy.");
      }
    },
    [clientId, user]
  );

  const load = useCallback(async () => {
    setIsLoading(true);

    const localLoaded = loadLocal();
    let remoteLoaded = false;
    if (clientId && user) {
      remoteLoaded = await loadFromSupabase();
    }

    if (!localLoaded && !remoteLoaded) {
      const sample = [buildSampleDashboard()];
      setDashboards(sample);
      saveLocal(sample);
    }

    setIsLoading(false);
  }, [clientId, user, loadLocal, loadFromSupabase, saveLocal]);

  useEffect(() => {
    load();
  }, [load]);

  const createDashboard = useCallback(() => {
    const now = new Date().toISOString();
    const dashboard: Dashboard = {
      id: `dashboard-${Date.now()}`,
      name: "New Dashboard",
      description: "Custom sales dashboard",
      components: [],
      createdAt: now,
      updatedAt: now,
    };
    setDashboards((prev) => {
      const next = [...prev, dashboard];
      saveLocal(next);
      void persistToSupabase(next);
      return next;
    });
    return dashboard.id;
  }, [persistToSupabase, saveLocal]);

  const updateDashboard = useCallback(
    (dashboard: Dashboard) => {
      setDashboards((prev) => {
        const next = prev.map((d) => (d.id === dashboard.id ? { ...dashboard, updatedAt: new Date().toISOString() } : d));
        saveLocal(next);
        void persistToSupabase(next);
        return next;
      });
    },
    [persistToSupabase, saveLocal]
  );

  const deleteDashboard = useCallback(
    async (dashboardId: string) => {
      setDashboards((prev) => {
        const next = prev.filter((d) => d.id !== dashboardId);
        saveLocal(next);
        return next;
      });

      if (clientId && user) {
        const { error } = await supabase.from("sales_dashboards").delete().eq("id", dashboardId).eq("client_id", clientId);
        if (error) {
          console.error("Failed to delete dashboard from Supabase", error);
          toast.error("Could not delete dashboard in Supabase, please retry.");
        }
      }
    },
    [clientId, user, saveLocal]
  );

  return {
    dashboards,
    sheets,
    isLoading,
    saveState,
    createDashboard,
    updateDashboard,
    deleteDashboard,
    setDashboards,
    setSheets,
  };
};
