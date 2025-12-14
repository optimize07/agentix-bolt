import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ChatSidebar } from "@/components/ChatSidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClientSwitcher } from "@/components/ClientSwitcher";
import { RunNowModal } from "@/components/RunNowModal";
import { AgentSettingsModal } from "@/components/AgentSettingsModal";
import { getAllAgentSettings, type UserAgentSettings } from "@/integrations/user-agent-settings/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Bot,
  Search,
  Play,
  History,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Filter,
  RefreshCw,
  FileOutput,
  ChevronRight,
  Settings2,
  Star,
} from "lucide-react";
import { departmentsData, type Agent, type Department } from "@/data/departments";
import { useAllFeatureToggles } from "@/hooks/useFeatureToggle";
import { useToast } from "@/hooks/use-toast";

interface AgentRun {
  id: string;
  agentName: string;
  department: string;
  status: "running" | "completed" | "failed";
  startedAt: string;
  completedAt?: string;
  inputs: Record<string, any>;
  outputs?: Record<string, any>;
}

export default function ClientAgentController() {
  const { clientId } = useParams();
  const { toast } = useToast();
  const { isEnabled, loading: loadingFeatures } = useAllFeatureToggles(clientId);

  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedAgent, setSelectedAgent] = useState<{
    agent: Agent;
    department: Department;
  } | null>(null);
  const [runModalOpen, setRunModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [runHistory, setRunHistory] = useState<AgentRun[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [userSettings, setUserSettings] = useState<UserAgentSettings[]>([]);

  // Filter departments and agents based on feature toggles
  const enabledDepartments = departmentsData.filter((dept) => {
    const featureKey = `department.${dept.id}`;
    return isEnabled(featureKey);
  });

  // Flatten all agents from enabled departments
  const allAgents = enabledDepartments.flatMap((dept) =>
    dept.agents
      .filter((agent) => agent.canRunNow)
      .map((agent) => ({
        agent,
        department: dept,
      }))
  );

  // Apply filters
  const filteredAgents = allAgents.filter((item) => {
    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !item.agent.name.toLowerCase().includes(q) &&
        !item.department.title.toLowerCase().includes(q)
      ) {
        return false;
      }
    }

    // Department filter
    if (departmentFilter !== "all" && item.department.id !== departmentFilter) {
      return false;
    }

    // Status filter
    if (statusFilter !== "all" && item.agent.status !== statusFilter) {
      return false;
    }

    return true;
  });

  // Load run history and user settings
  useEffect(() => {
    loadRunHistory();
    loadUserSettings();
  }, [clientId]);

  async function loadUserSettings() {
    try {
      const settings = await getAllAgentSettings(clientId);
      setUserSettings(settings);
    } catch (error) {
      console.error("Error loading user settings:", error);
    }
  }

  // Get user settings for a specific agent
  function getAgentSettings(departmentId: string, agentName: string): UserAgentSettings | undefined {
    return userSettings.find(
      (s) => s.department_id === departmentId && s.agent_name === agentName
    );
  }

  // Get display name for an agent (custom or default)
  function getAgentDisplayName(departmentId: string, agentName: string): string {
    const settings = getAgentSettings(departmentId, agentName);
    return settings?.custom_name || agentName;
  }

  async function loadRunHistory() {
    setLoadingHistory(true);
    // In production, this would fetch from the database
    // For now, use mock data
    setTimeout(() => {
      setRunHistory([
        {
          id: "1",
          agentName: "Market Positioning Plan",
          department: "Strategy",
          status: "completed",
          startedAt: new Date(Date.now() - 3600000).toISOString(),
          completedAt: new Date(Date.now() - 3500000).toISOString(),
          inputs: { topic: "Q4 Planning" },
          outputs: { report: "Generated report..." },
        },
        {
          id: "2",
          agentName: "Facebook Ads Library Scraper",
          department: "Advertising",
          status: "running",
          startedAt: new Date(Date.now() - 300000).toISOString(),
          inputs: { competitor: "example.com" },
        },
        {
          id: "3",
          agentName: "Email Copywriter",
          department: "Marketing",
          status: "failed",
          startedAt: new Date(Date.now() - 7200000).toISOString(),
          completedAt: new Date(Date.now() - 7100000).toISOString(),
          inputs: { campaign: "Holiday Sale" },
        },
      ]);
      setLoadingHistory(false);
    }, 500);
  }

  function handleRunAgent(agent: Agent, department: Department) {
    setSelectedAgent({ agent, department });
    setRunModalOpen(true);
  }

  function handleOpenSettings(agent: Agent, department: Department) {
    setSelectedAgent({ agent, department });
    setSettingsModalOpen(true);
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "Active":
        return "bg-green-500/10 text-green-500";
      case "Paused":
        return "bg-yellow-500/10 text-yellow-500";
      case "Inactive":
        return "bg-gray-500/10 text-gray-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  }

  function getRunStatusIcon(status: AgentRun["status"]) {
    switch (status) {
      case "running":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  }

  return (
    <div className="flex h-screen w-full bg-background">
      <ChatSidebar />

      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="border-b border-border bg-background">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-3">
              <Bot className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Agent Controller</h1>
              <span className="text-muted-foreground">for</span>
              <ClientSwitcher />
            </div>
            <Button
              variant="outline"
              className="gap-2"
              onClick={loadRunHistory}
              disabled={loadingHistory}
            >
              <RefreshCw className={`h-4 w-4 ${loadingHistory ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="p-6">
          <Tabs defaultValue="agents" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="agents" className="gap-2">
                <Bot className="h-4 w-4" />
                Available Agents
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History className="h-4 w-4" />
                Run History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="agents">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search agents..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {enabledDepartments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Paused">Paused</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Agent Grid */}
              {loadingFeatures ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredAgents.length === 0 ? (
                <div className="text-center py-12">
                  <Bot className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No Agents Available
                  </h3>
                  <p className="text-muted-foreground">
                    {searchQuery || departmentFilter !== "all" || statusFilter !== "all"
                      ? "Try adjusting your filters"
                      : "No runnable agents are currently enabled for your account"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAgents.map((item, index) => {
                    const agentSettings = getAgentSettings(item.department.id, item.agent.name);
                    const displayName = getAgentDisplayName(item.department.id, item.agent.name);
                    const hasSchedule = agentSettings?.schedule_enabled;
                    const isFavorite = agentSettings?.is_favorite;
                    const scheduleDisplay = hasSchedule 
                      ? agentSettings?.schedule_type 
                      : item.agent.schedule;

                    return (
                      <Card
                        key={`${item.department.id}-${item.agent.name}-${index}`}
                        className="p-5 hover:border-primary/50 transition-colors group"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Bot className="h-4 w-4 text-primary" />
                              <h3 className="font-semibold text-foreground truncate">
                                {displayName}
                              </h3>
                              {isFavorite && (
                                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {item.department.title}
                              </Badge>
                              <Badge className={`text-xs ${getStatusColor(item.agent.status)}`}>
                                {item.agent.status}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleOpenSettings(item.agent, item.department)}
                            title="Agent Settings"
                          >
                            <Settings2 className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                          </Button>
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {item.agent.source && (
                              <Badge variant="secondary" className="text-xs">
                                {item.agent.source}
                              </Badge>
                            )}
                            {scheduleDisplay && (
                              <span className={`flex items-center gap-1 ${hasSchedule ? "text-primary" : ""}`}>
                                <Clock className="h-3 w-3" />
                                {scheduleDisplay}
                              </span>
                            )}
                          </div>
                          <Button
                            size="sm"
                            className="gap-2"
                            onClick={() => handleRunAgent(item.agent, item.department)}
                            disabled={item.agent.status === "Inactive"}
                          >
                            <Play className="h-4 w-4" />
                            Run
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="history">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : runHistory.length === 0 ? (
                <div className="text-center py-12">
                  <History className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No Run History
                  </h3>
                  <p className="text-muted-foreground">
                    Run your first agent to see the history here
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[600px]">
                  <div className="space-y-3">
                    {runHistory.map((run) => (
                      <Card key={run.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getRunStatusIcon(run.status)}
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-foreground">
                                  {run.agentName}
                                </h4>
                                <Badge variant="outline" className="text-xs">
                                  {run.department}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Started {new Date(run.startedAt).toLocaleString()}
                                {run.completedAt && (
                                  <span>
                                    {" • "}
                                    Completed {new Date(run.completedAt).toLocaleString()}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {run.outputs && (
                              <Button variant="ghost" size="sm" className="gap-2">
                                <FileOutput className="h-4 w-4" />
                                View Output
                              </Button>
                            )}
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Run Agent Modal */}
      {selectedAgent && (
        <RunNowModal
          open={runModalOpen}
          onOpenChange={setRunModalOpen}
          agentName={getAgentDisplayName(selectedAgent.department.id, selectedAgent.agent.name)}
        />
      )}

      {/* Agent Settings Modal */}
      {selectedAgent && (
        <AgentSettingsModal
          open={settingsModalOpen}
          onOpenChange={setSettingsModalOpen}
          agent={selectedAgent.agent}
          department={selectedAgent.department}
          clientId={clientId}
          onSettingsChange={loadUserSettings}
        />
      )}
    </div>
  );
}

