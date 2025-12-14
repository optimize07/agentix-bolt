import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ChatSidebar } from "@/components/ChatSidebar";
import { StatsCard } from "@/components/StatsCard";
import { DepartmentDetailCard } from "@/components/DepartmentDetailCard";
import { Button } from "@/components/ui/button";
import { ClientSwitcher } from "@/components/ClientSwitcher";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Bot,
  Building2,
  TrendingUp as TrendingUpIcon,
  Trophy,
  Plus,
  Bell,
  Settings,
  Loader2
} from "lucide-react";
import { departmentsData, type Department } from "@/data/departments";
import { useAllFeatureToggles } from "@/hooks/useFeatureToggle";
import { getClient } from "@/integrations/clients/api";

const Index = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { features, loading: loadingFeatures, isEnabled } = useAllFeatureToggles(clientId);
  const [clientName, setClientName] = useState<string>("Client");
  const [loadingClient, setLoadingClient] = useState(true);

  // Load client name from database
  useEffect(() => {
    async function loadClient() {
      if (!clientId) return;
      setLoadingClient(true);
      try {
        const client = await getClient(clientId);
        if (client) {
          setClientName(client.name);
        } else {
          // Fallback to old mapping for backwards compatibility
          const clientNames: Record<string, string> = {
            "techstart-solutions": "TechStart Solutions",
            "healthhub-medical": "HealthHub Medical",
            "global-consulting": "Global All-In-Consulting",
            "imaginespace-ltd": "ImagineSpace Ltd",
            "smartax-corp": "SMARTAX Corp",
            "onward-marketing": "Onward Marketing Inc",
          };
          setClientName(clientNames[clientId] || "Client");
        }
      } catch (e) {
        console.error("Failed to load client:", e);
      } finally {
        setLoadingClient(false);
      }
    }
    loadClient();
  }, [clientId]);

  // Filter departments based on feature toggles
  const filteredDepartments = departmentsData.filter((dept) => {
    const featureKey = `department.${dept.id}`;
    return isEnabled(featureKey);
  });

  // Filter agents within each department
  const departmentsWithFilteredAgents = filteredDepartments.map((dept) => {
    // For now, show all agents if department is enabled
    // In future, could filter individual agents too
    return dept;
  });

  // Calculate stats based on filtered departments
  const totalAgents = departmentsWithFilteredAgents.reduce(
    (sum, dept) => sum + dept.agents.length,
    0
  );
  const activeDepartments = departmentsWithFilteredAgents.length;
  const activeAgents = departmentsWithFilteredAgents.reduce(
    (sum, dept) => sum + dept.agents.filter((a) => a.status === "Active").length,
    0
  );
  const efficiency = totalAgents > 0 
    ? Math.round((activeAgents / totalAgents) * 100) 
    : 0;

  const stats = [
    {
      label: "Total",
      value: totalAgents.toString(),
      subtitle: "Available agents",
      superscript: "Agents",
      icon: Bot,
    },
    {
      label: "Active",
      value: activeDepartments.toString(),
      subtitle: "Departments enabled",
      superscript: "Departments",
      icon: Building2,
    },
    {
      label: "Active",
      value: activeAgents.toString(),
      subtitle: "Currently running",
      superscript: "Running",
      icon: TrendingUpIcon,
    },
    {
      label: "Efficiency",
      value: `${efficiency}%`,
      subtitle: efficiency >= 80 ? "Excellent" : efficiency >= 60 ? "Good" : "Improving",
      superscript: "",
      icon: Trophy,
    },
  ];

  const isLoading = loadingFeatures || loadingClient;

  return (
    <div className="flex h-screen w-full" style={{ background: 'var(--page-bg)' }}>
      {/* Left Sidebar */}
      <ChatSidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Header Bar */}
        <div className="border-b border-border" style={{ background: 'var(--page-bg)' }}>
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-3">
              {loadingClient ? (
                <Skeleton className="h-8 w-48" />
              ) : (
                <h1 className="text-2xl font-bold text-foreground">
                  {clientName}
                </h1>
              )}
              <ClientSwitcher />
              <span className="text-2xl font-bold text-foreground">|</span>
              <h2 className="text-2xl font-bold text-foreground">
                Business Intelligence
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => navigate(`/client/${clientId}/projects`)}
              >
                <Plus className="h-4 w-4" />
                New Project
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Bell className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9"
                onClick={() => navigate(`/client/${clientId}/settings`)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-10">
          {/* Stats Grid */}
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {isLoading ? (
              <>
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-32 rounded-lg" />
                ))}
              </>
            ) : (
              stats.map((stat, index) => (
                <StatsCard
                  key={index}
                  label={stat.label}
                  value={stat.value}
                  subtitle={stat.subtitle}
                  icon={stat.icon}
                />
              ))
            )}
          </div>

          {/* Department Overview */}
          <div className="mb-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">
                Department Overview
              </h2>
              <Button variant="ghost" className="text-primary hover:text-primary/80">
                View All
              </Button>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-64 rounded-lg" />
                ))}
              </div>
            ) : departmentsWithFilteredAgents.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No Departments Enabled
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Contact your administrator to enable departments and features for your account.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
                {departmentsWithFilteredAgents.map((dept) => (
                  <DepartmentDetailCard
                    key={dept.id}
                    title={dept.title}
                    description={dept.description}
                    icon={dept.icon}
                    agentCount={dept.agents.length}
                    agents={dept.agents}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">
                Recent Activity
              </h2>
              <Button variant="ghost" className="text-primary hover:text-primary/80">
                View All
              </Button>
            </div>
            
            {/* Activity content placeholder */}
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Activity feed coming soon...</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
