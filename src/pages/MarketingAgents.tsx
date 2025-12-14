import { useMemo, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MarketingSidebar } from "@/components/MarketingSidebar";
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
import { Download, Filter, Search, Megaphone, Plus, Bot } from "lucide-react";
import {
  MarketingAgentsTable,
  type MarketingAgentRow,
} from "@/components/departments/marketing/MarketingAgentsTable";
import { N8nAgentConfigModal } from "@/components/agents/N8nAgentConfigModal";
import { UniversalAgentRunner } from "@/components/agents/UniversalAgentRunner";
import { 
  AgentConfig, 
  fetchAgentConfig, 
  listAgentConfigs, 
  getAgentInputFields 
} from "@/integrations/n8n/agents";
import { useToast } from "@/hooks/use-toast";

const kpis: DepartmentKpi[] = [
  { label: "Total Agents", value: "12", trend: { direction: "up", value: "+2 this month" } },
  { label: "Active Campaigns", value: "8", trend: { direction: "up", value: "+5% from last week" } },
  { label: "Department Health", value: "92%", trend: { direction: "down", value: "-1% from last week" } },
];

const humanAgents: MarketingAgentRow[] = [
  {
    id: "jane-doe",
    name: "Jane Doe",
    role: "Content Manager",
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAxZ39Ef-rzCumYSJwudf6rs8Guq47P9Zk_Kv5U8UC24kIuLFRC69HDQp6ezKm20wrODkPm8CDM3W5l9pP16wIuEQOjIrnUBznZZ0GwE-6tQJSVfsAInYhayk8rQJCmtuFgCPDp44-w_SyUiTwHKG-1CrauDTIEqKzJ-oUoTVhxHt8Oyfg785n0IC_pw_V1nWxap0VxZ_7Jluz32Qsn9iLp8gjF7ZOpbqn7vyq9kC8UYKE8vcw4TSlRzxoOuEQLirDiaD7klPl49PJ8",
    status: "active",
    contentProgressPercent: 75,
    contentText: "15/20 Projects",
    campaignsProgressPercent: 60,
    campaignsText: "6/10 Campaigns",
    healthPercent: 95,
    email: "jane.doe@example.com",
    description: "Owns the full content calendar and collaborates with AI assistants for research.",
  },
  {
    id: "john-smith",
    name: "John Smith",
    role: "Campaign Specialist",
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCBKklUpnKwU1xAZiZB5CKRPmjDY_wfV8qaCJW-D0VfpSyxyBDvvKii3WzzpKfDDZrsDKTYZ8lnxoQFd6TrX0ORBeyRIJdk7uNTc4-5OWM2qX9pURNi02_rxBFOnKqFJa3nXuQiqocA7ADHm9xMdfCH4nMCRAL7VUFh-yVJVdh_ZJq9sC1ritCVSv3r3Jx53sZ6NRFXNCk3hqCLjeg3xXdsdy80P4K3-y4ySJO_ovCoyFnjMaCGstm_Ys1xmr8eN0UGuJkdTto_ZNLy",
    status: "active",
    contentProgressPercent: 40,
    contentText: "8/20 Projects",
    campaignsProgressPercent: 90,
    campaignsText: "9/10 Campaigns",
    healthPercent: 82,
    email: "john.smith@example.com",
    description: "Pipeline-focused campaign specialist shipping paid media assets.",
  },
  {
    id: "emily-white",
    name: "Emily White",
    role: "SEO Specialist",
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCURxNMKdyIwYl5i9Dio-zlf3Lt5OCd9HREIY9BYR7AEvOqCtQlDomwpkwv4RaXF_GI1winbGsEuz0FvGoPXL6AX2pu_XYxZHfft742xd2LxCStM4XabSldmCsj5-ipPyC7GjMA9JYqM9XqE91aZXDEKSkylwZuSLAwiVcwcCz49nGrVj0iSVJUIMFpXsR58-QQixtEWro_Q3aVGz9k4lIKydhmKyvKOehzHS7FC3UJVpuxAZAweXWrfKSoPLEFLfqDRsyim5R_tVkk",
    status: "on-leave",
    contentProgressPercent: 10,
    contentText: "2/20 Projects",
    campaignsProgressPercent: 0,
    campaignsText: "0/10 Campaigns",
    healthPercent: 45,
    email: "emily.white@example.com",
    description: "SEO specialist currently out. Handles technical audit outputs.",
  },
];

// Extended row type to include agent config
interface ExtendedMarketingAgentRow extends MarketingAgentRow {
  isAI?: boolean;
  config?: AgentConfig;
}

export default function MarketingAgents() {
  const { clientId } = useParams();
  const { toast } = useToast();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "on-leave">("all");
  const [aiAgents, setAiAgents] = useState<ExtendedMarketingAgentRow[]>([]);

  // Modal state
  const [configOpen, setConfigOpen] = useState(false);
  const [configAgentKey, setConfigAgentKey] = useState<string>("");
  const [configAgentConfig, setConfigAgentConfig] = useState<AgentConfig | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  
  // Runner state
  const [selectedAgent, setSelectedAgent] = useState<AgentConfig | null>(null);
  const [runnerOpen, setRunnerOpen] = useState(false);
  const [viewAgent, setViewAgent] = useState<ExtendedMarketingAgentRow | null>(null);
  const [viewOpen, setViewOpen] = useState(false);

  function toAgentKey(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  async function refreshDynamicAgents() {
    try {
      const cfgs = await listAgentConfigs({ area: "marketing", clientId: clientId, includePredefined: true });
      
      // Deduplicate by agent_key (prefer client-specific over predefined)
      const seenKeys = new Set<string>();
      const uniqueCfgs = (cfgs || []).filter((cfg) => {
        if (seenKeys.has(cfg.agent_key)) return false;
        seenKeys.add(cfg.agent_key);
        return true;
      });
      
      const mapped: ExtendedMarketingAgentRow[] = uniqueCfgs.map((cfg) => ({
        id: `ai-${cfg.agent_key}`,
        name: cfg.display_name || cfg.agent_key,
        role: cfg.display_role || "AI Agent",
        avatarUrl: cfg.avatar_url || "/n8n.svg",
        status: "active" as const,
        contentProgressPercent: 0,
        contentText: cfg.is_predefined ? "Predefined" : "—",
        campaignsProgressPercent: 0,
        campaignsText: cfg.output_behavior === "chat_stream" ? "Chat" : "Form",
        healthPercent: 100,
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
  const allRows: ExtendedMarketingAgentRow[] = useMemo(() => {
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

  async function handleRun(row: ExtendedMarketingAgentRow) {
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
        const cfg = await fetchAgentConfig({ area: "marketing", agentKey: key, clientId });
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

  function handleEdit(row: ExtendedMarketingAgentRow) {
    const key = row.id?.startsWith("ai-") ? row.id.slice(3) : toAgentKey(row.name);
    setConfigAgentKey(key);
    setConfigAgentConfig(row.isAI ? row.config ?? null : null);
    setConfigOpen(true);
  }

  function handleView(row: ExtendedMarketingAgentRow) {
    setViewAgent(row);
    setViewOpen(true);
  }

  function handleMessage(row: ExtendedMarketingAgentRow) {
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
      content: r.contentText,
      campaigns: r.campaignsText,
      health: `${r.healthPercent}%`,
    }));
    const header = Object.keys(exportRows[0] || {}).join(",");
    const csv = [header, ...exportRows.map((r) => Object.values(r).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `marketing-agents-${clientId || "client"}.csv`;
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
      label: "Active Campaigns", 
      value: "8", 
      trend: { direction: "up", value: "+5% from last week" } 
    },
    { 
      label: "Department Health", 
      value: "92%", 
      trend: { direction: "down", value: "-1% from last week" } 
    },
  ];

  return (
    <div className="flex h-screen w-full" style={{ background: 'var(--page-bg)' }}>
      <MarketingSidebar />
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
                  <span className="text-foreground">Marketing</span>
                </div>
                <div className="flex items-center gap-3">
                  <Megaphone className="h-8 w-8 text-foreground" />
                  <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground">
                    Marketing Department
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on-leave">On Leave</SelectItem>
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
            <MarketingAgentsTable
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
          area="marketing"
          agentKey={configAgentKey}
          initialConfig={configAgentConfig}
          title="Configure Marketing Agent"
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
          area="marketing"
          title="Add Marketing Agent"
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
                      <p className="text-muted-foreground text-xs uppercase">Content creation</p>
                      <p className="font-semibold">{viewAgent.contentText}</p>
                    </Card>
                    <Card className="border border-border p-3 text-sm">
                      <p className="text-muted-foreground text-xs uppercase">Campaigns</p>
                      <p className="font-semibold">{viewAgent.campaignsText}</p>
                    </Card>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {viewAgent.description ||
                      (viewAgent.isAI
                        ? "Predefined automation agent."
                        : "Core team member contributing to campaign delivery.")}
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
