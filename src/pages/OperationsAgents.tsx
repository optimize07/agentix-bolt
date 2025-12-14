import { useMemo, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { OperationsSidebar } from "@/components/OperationsSidebar";
import { DepartmentKPIs } from "@/components/departments/DepartmentKPIs";
import type { DepartmentKpi } from "@/components/departments/types";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Download, Filter, Search, Settings, Plus, Bot } from "lucide-react";
import {
  OperationsAgentsTable,
  type OperationsAgentRow,
} from "@/components/departments/operations/OperationsAgentsTable";
import { N8nAgentConfigModal } from "@/components/agents/N8nAgentConfigModal";
import { UniversalAgentRunner } from "@/components/agents/UniversalAgentRunner";
import { 
  AgentConfig, 
  fetchAgentConfig, 
  listAgentConfigs, 
} from "@/integrations/n8n/agents";
import { useToast } from "@/hooks/use-toast";

const humanAgents: OperationsAgentRow[] = [
  {
    id: "olivia-rhye",
    name: "Olivia Rhye",
    role: "Automation Specialist",
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCp7I3X34xs2nAgaD4_ap28gmAfZb1KERd-LeW_aVqc-HE4Pfi44c-8x8QHEneiS6X9UU5bLeelULEu-QKL0vShKQunykPTefHSagWMHFgCCywD05msibM2tJww99b30caVvc5s_kFc31K3HdXwIYkwrHml6k5y_eWVdjvheFgxKmSJWn-Tvxatu-T-eqDgEfiwCrEx9hUPk5nbSlNhIUvml6dSmkIhquDM7VeVKiNCCxLGc-7-qI3OavPhynQf1k17mHJj4bdjb52w",
    status: "online",
    workflowProgressPercent: 85,
    workflowText: "17/20 Workflows",
    tasksProgressPercent: 70,
    tasksText: "14/20 Tasks",
    efficiencyPercent: 92,
    email: "olivia.rhye@example.com",
    description: "Automation specialist managing workflow integrations and n8n processes.",
  },
  {
    id: "phoenix-baker",
    name: "Phoenix Baker",
    role: "Process Analyst",
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAjRA1FwwN92_D7D0lDu7xyHP8H--xZaBevmd8Pxf6B0fzqNvetNl49vLs68CjOdbxGIJ7uFxAptN6XIhYnuIGqt1fD5x817ArrPdi2LMNvmUpaScxDeLF2T4MwkxXcw0rWvvF6t05jV22NgEP4v5kzunvsFxGxQ3OeniIMV7ZdKWHZycdUjMK7KeRlUhOq8bN69YfW40tdID-usb3aKXJQcFSSOEzIgbT1QYqaoA7OwaDMMXhGsmTu4E5N8BOK5_61l_Dfgq8iak2F",
    status: "online",
    workflowProgressPercent: 60,
    workflowText: "12/20 Workflows",
    tasksProgressPercent: 80,
    tasksText: "16/20 Tasks",
    efficiencyPercent: 88,
    email: "phoenix.baker@example.com",
    description: "Process analyst focused on optimizing operational procedures.",
  },
  {
    id: "lana-steiner",
    name: "Lana Steiner",
    role: "Team Lead",
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAdVTQbJxrd5r3RleaZtHIYlbjC-y72x4bUu0ZIKYPsczSyOV7do4mAjeO7l2KtYuxmxWBz6r7wojabKzcDrcVuZTGY0ylG_jxwW8uHRk0uoHkchUE9i_OL7EAHBnbNJMRnvjKekoDu5PdOL1f7SP27UApIS8qfzZzI_hqm-AORgdxjHbEEz79XO2vL9Tz1JIlYdSJMCxoRfThi_mAUf8ewUJREA3LeYFu4_xGq5dTPlMuC5u_BXt_CPMd-dDpctJYMssneu86IF4YI",
    status: "busy",
    workflowProgressPercent: 95,
    workflowText: "19/20 Workflows",
    tasksProgressPercent: 90,
    tasksText: "18/20 Tasks",
    efficiencyPercent: 96,
    email: "lana.steiner@example.com",
    description: "Operations team lead overseeing all department activities.",
  },
  {
    id: "demi-wilkinson",
    name: "Demi Wilkinson",
    role: "Data Entry Clerk",
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDgmSdWWL1o7JFIv6fe8PxLQdDixLy_LGOmzn5aWynRsOx3jhAMMrs94NOylWBE9-CH_j4uG_8Q-BYpQy4-dNGsw9ssMSSikOKun7d-ECUPJLPiiH1n6aDpKPgFth6cWlBtaXw_CWZqM7DuT7-4ftk1kOKJ6Uv4cJNC9Ra-_6N_AEH1OhoOWjRXw5oDKFFeaUcBYc8RnApFCd-2A_E9wwvhO2-8kADdpAK-VfzhAOX6pBBebqOS4EJpx-Y04QCKOSNq65hX_ZsU-QE5",
    status: "offline",
    workflowProgressPercent: 30,
    workflowText: "6/20 Workflows",
    tasksProgressPercent: 40,
    tasksText: "8/20 Tasks",
    efficiencyPercent: 65,
    email: "demi.wilkinson@example.com",
    description: "Data entry specialist currently offline.",
  },
];

// Extended row type to include agent config
interface ExtendedOperationsAgentRow extends OperationsAgentRow {
  isAI?: boolean;
  config?: AgentConfig;
}

export default function OperationsAgents() {
  const { clientId } = useParams();
  const { toast } = useToast();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "online" | "busy" | "offline">("all");
  const [aiAgents, setAiAgents] = useState<ExtendedOperationsAgentRow[]>([]);

  // Modal state
  const [configOpen, setConfigOpen] = useState(false);
  const [configAgentKey, setConfigAgentKey] = useState<string>("");
  const [configAgentConfig, setConfigAgentConfig] = useState<AgentConfig | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  
  // Runner state
  const [selectedAgent, setSelectedAgent] = useState<AgentConfig | null>(null);
  const [runnerOpen, setRunnerOpen] = useState(false);
  const [viewAgent, setViewAgent] = useState<ExtendedOperationsAgentRow | null>(null);
  const [viewOpen, setViewOpen] = useState(false);

  function toAgentKey(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  async function refreshDynamicAgents() {
    try {
      const cfgs = await listAgentConfigs({ area: "operations", clientId: clientId, includePredefined: true });
      
      // Deduplicate by agent_key (prefer client-specific over predefined)
      const seenKeys = new Set<string>();
      const uniqueCfgs = (cfgs || []).filter((cfg) => {
        if (seenKeys.has(cfg.agent_key)) return false;
        seenKeys.add(cfg.agent_key);
        return true;
      });
      
      const mapped: ExtendedOperationsAgentRow[] = uniqueCfgs.map((cfg) => ({
        id: `ai-${cfg.agent_key}`,
        name: cfg.display_name || cfg.agent_key,
        role: cfg.display_role || "AI Agent",
        avatarUrl: cfg.avatar_url || "/n8n.svg",
        status: "online" as const,
        workflowProgressPercent: 0,
        workflowText: cfg.is_predefined ? "Predefined" : "—",
        tasksProgressPercent: 0,
        tasksText: cfg.output_behavior === "chat_stream" ? "Chat" : "Form",
        efficiencyPercent: 100,
        isAI: true,
        email: "support@agentix.ai",
        description: cfg.description || "Predefined automation powered by n8n.",
        config: cfg,
      }));
      setAiAgents(mapped);
    } catch (e) {
      console.error("Failed to load AI agents:", e);
      setAiAgents([]);
    }
  }

  useEffect(() => {
    refreshDynamicAgents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  // Combine AI agents with human agents
  const allRows: ExtendedOperationsAgentRow[] = useMemo(() => {
    return [...aiAgents, ...humanAgents.map(h => ({ ...h, isAI: false }))];
  }, [aiAgents]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allRows.filter((r) => {
      const statusOk = status === "all" ? true : r.status === status;
      const text = `${r.name} ${r.role}`.toLowerCase();
      return statusOk && (q ? text.includes(q) : true);
    });
  }, [allRows, query, status]);

  async function handleRun(row: ExtendedOperationsAgentRow) {
    // If it's an AI agent with config, use the universal runner
    if (row.isAI && row.config) {
      setSelectedAgent(row.config);
      setRunnerOpen(true);
      return;
    }

    // For AI agents without inline config, try to fetch it
    if (row.id?.startsWith("ai-")) {
      const key = row.id.slice(3);
      try {
        const cfg = await fetchAgentConfig({ area: "operations", agentKey: key, clientId });
        if (cfg) {
          setSelectedAgent(cfg);
          setRunnerOpen(true);
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }

    // Fallback: prompt to configure
    const key = row.id?.startsWith("ai-") ? row.id.slice(3) : toAgentKey(row.name);
    setConfigAgentKey(key);
    setConfigAgentConfig(row.isAI ? row.config ?? null : null);
    setConfigOpen(true);
  }

  function handleEdit(row: ExtendedOperationsAgentRow) {
    const key = row.id?.startsWith("ai-") ? row.id.slice(3) : toAgentKey(row.name);
    setConfigAgentKey(key);
    setConfigAgentConfig(row.isAI ? row.config ?? null : null);
    setConfigOpen(true);
  }

  function handleView(row: ExtendedOperationsAgentRow) {
    setViewAgent(row);
    setViewOpen(true);
  }

  function handleMessage(row: ExtendedOperationsAgentRow) {
    const recipient = row.email || "support@agentix.ai";
    const subject = encodeURIComponent(`${row.name} update`);
    const body = encodeURIComponent(
      `Hi ${row.isAI ? "Automation Team" : row.name.split(" ")[0]},\n\nI'd like to follow up on our ${row.role} work.`
    );
    window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
  }

  function handleExport() {
    const exportRows = filteredRows.map((r) => ({
      name: r.name,
      role: r.role,
      type: r.isAI ? "AI Agent" : "Human",
      status: r.status,
      workflows: r.workflowText,
      tasks: r.tasksText,
      efficiency: `${r.efficiencyPercent}%`,
    }));
    const header = Object.keys(exportRows[0] || {}).join(",");
    const csv = [header, ...exportRows.map((r) => Object.values(r).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `operations-agents-${clientId || "client"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Update KPIs based on actual agent counts
  const dynamicKpis: DepartmentKpi[] = [
    { 
      label: "Total Agents", 
      value: String(allRows.length), 
      trend: { direction: "up", value: `${aiAgents.length} AI` } 
    },
    { 
      label: "Active Workflows", 
      value: "24", 
      trend: { direction: "up", value: "+8% from last week" } 
    },
    { 
      label: "Department Efficiency", 
      value: "88%", 
      trend: { direction: "up", value: "+3% from last week" } 
    },
  ];

  return (
    <div className="flex h-screen w-full" style={{ background: 'var(--page-bg)' }}>
      <OperationsSidebar />
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="border-b border-border" style={{ background: 'var(--page-bg)' }}>
          <div className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Link className="hover:text-foreground" to={`/client/${clientId}`}>
                    Dashboard
                  </Link>
                  <span>/</span>
                  <Link className="hover:text-foreground" to={`/client/${clientId}`}>
                    Departments
                  </Link>
                  <span>/</span>
                  <span className="text-foreground">Operations</span>
                </div>
                <div className="flex items-center gap-3">
                  <Settings className="h-8 w-8 text-foreground" />
                  <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground">
                    Operations Department
                  </h1>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8 p-10">
          {/* KPI Cards */}
          <section>
            <DepartmentKPIs kpis={dynamicKpis} />
          </section>

          {/* AI Agents Quick Access */}
          {aiAgents.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Bot className="h-5 w-5" />
                AI Agents
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {aiAgents.slice(0, 3).map((agent) => (
                  <Card 
                    key={agent.id}
                    className="p-4 cursor-pointer hover:border-primary transition-colors"
                    onClick={() => agent.config && (setSelectedAgent(agent.config), setRunnerOpen(true))}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{agent.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{agent.role}</p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {agent.config?.output_behavior === "chat_stream" ? "Chat" : "Form"}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Controls */}
          <Card className="flex flex-wrap items-center justify-between gap-4 border border-border bg-card p-4">
            <div className="relative min-w-[250px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-10 pl-9"
                placeholder="Search for an agent..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setAddOpen(true)}>
                <Plus className="h-4 w-4" />
                Add Agent
              </Button>
              <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                <SelectTrigger className="h-10 w-40">
                  <SelectValue placeholder="Status: All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Status: All</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="busy">Busy</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" className="h-10 w-10">
                <Filter className="h-4 w-4" />
              </Button>
              <Button onClick={handleExport} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                <Download className="h-4 w-4" />
                Export Data
              </Button>
            </div>
          </Card>

          {/* Table */}
          <section>
            <OperationsAgentsTable
              rows={filteredRows}
              onRun={handleRun}
              onEdit={handleEdit}
              onView={handleView}
              onMessage={handleMessage}
              onRowClick={handleRun}
            />
          </section>
        </div>

        {/* Universal Agent Runner */}
        {selectedAgent && (
          <UniversalAgentRunner
            agent={selectedAgent}
            open={runnerOpen}
            onOpenChange={setRunnerOpen}
            clientId={clientId}
          />
        )}

        {/* Config modals */}
        <N8nAgentConfigModal
          open={configOpen}
          onOpenChange={(open) => {
            setConfigOpen(open);
            if (!open) {
              setConfigAgentKey("");
              setConfigAgentConfig(null);
            }
          }}
          scope="client"
          clientId={clientId}
          area="operations"
          agentKey={configAgentKey}
          initialConfig={configAgentConfig}
          title="Configure Operations Agent"
          onSaved={refreshDynamicAgents}
        />
        
        {/* Add new agent */}
        <N8nAgentConfigModal
          open={addOpen}
          onOpenChange={(open) => {
            setAddOpen(open);
            if (!open) {
              setConfigAgentKey("");
              setConfigAgentConfig(null);
            }
          }}
          scope="client"
          clientId={clientId}
          area="operations"
          title="Add Operations Agent"
          initialConfig={null}
          onSaved={refreshDynamicAgents}
        />

        {/* Agent details */}
        <Dialog open={viewOpen} onOpenChange={setViewOpen}>
          <DialogContent className="max-w-xl">
            {viewAgent ? (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      {viewAgent.avatarUrl || viewAgent.isAI ? (
                        <AvatarImage src={viewAgent.avatarUrl || "/n8n.svg"} alt={viewAgent.name} />
                      ) : null}
                      <AvatarFallback>
                        {viewAgent.isAI ? <Bot className="h-4 w-4" /> : viewAgent.name.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    {viewAgent.name}
                  </DialogTitle>
                  <DialogDescription>{viewAgent.role}</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <Card className="border border-border p-3 text-sm">
                      <p className="text-muted-foreground text-xs uppercase">Workflows</p>
                      <p className="font-semibold">{viewAgent.workflowText}</p>
                    </Card>
                    <Card className="border border-border p-3 text-sm">
                      <p className="text-muted-foreground text-xs uppercase">Tasks</p>
                      <p className="font-semibold">{viewAgent.tasksText}</p>
                    </Card>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {viewAgent.description ||
                      (viewAgent.isAI
                        ? "Predefined automation agent."
                        : "Core team member contributing to operations.")}
                  </p>

                  {viewAgent.isAI && viewAgent.config?.input_schema?.fields?.length ? (
                    <div className="space-y-2">
                      <Separator />
                      <p className="text-sm font-semibold text-foreground">Required Inputs</p>
                      <ScrollArea className="max-h-48">
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          {viewAgent.config.input_schema.fields.map((field) => (
                            <li key={field.key}>
                              <span className="font-medium text-foreground">{field.label}</span> — {field.type}
                            </li>
                          ))}
                        </ul>
                      </ScrollArea>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-3 justify-between">
                    <Button variant="outline" onClick={() => handleMessage(viewAgent)}>
                      Email {viewAgent.isAI ? "Support" : viewAgent.name.split(" ")[0]}
                    </Button>
                    {viewAgent.isAI && viewAgent.config ? (
                      <Button
                        onClick={() => {
                          setViewOpen(false);
                          setSelectedAgent(viewAgent.config || null);
                          setRunnerOpen(true);
                        }}
                      >
                        Open Runner
                      </Button>
                    ) : null}
                  </div>
                </div>
              </>
            ) : null}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
