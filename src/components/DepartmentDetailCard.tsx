import { useState, useMemo } from "react";
import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RotateCw } from "lucide-react";
import { ScheduleManagementModal } from "./ScheduleManagementModal";
import { RunNowModal } from "./RunNowModal";
import { StatusChangeModal } from "./StatusChangeModal";
import { useParams } from "react-router-dom";
import { Agent } from "@/data/departments";
import { N8nAgentConfigModal } from "@/components/agents/N8nAgentConfigModal";
import { RunAgentDynamicModal } from "@/components/agents/RunAgentDynamicModal";
import { fetchAgentConfig, RuntimeField } from "@/integrations/n8n/agents";
import { runN8nWorkflow } from "@/integrations/n8n/api";
import { useToast } from "@/hooks/use-toast";

interface DepartmentDetailCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  agentCount: number;
  agents: Agent[];
}

export const DepartmentDetailCard = ({
  title,
  description,
  icon: Icon,
  agentCount,
  agents,
}: DepartmentDetailCardProps) => {
  const { clientId } = useParams();
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [runNowModalOpen, setRunNowModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [n8nConfigOpen, setN8nConfigOpen] = useState(false);
  const [n8nConfigAgentKey, setN8nConfigAgentKey] = useState<string>("");
  const [n8nRunOpen, setN8nRunOpen] = useState(false);
  const [n8nRunFields, setN8nRunFields] = useState<RuntimeField[]>([]);
  const [n8nRunConfig, setN8nRunConfig] = useState<{ connectionId: string; workflowId: string; webhookUrl?: string } | null>(null);
  const [n8nRunning, setN8nRunning] = useState(false);
  const { toast } = useToast();

  const clientNames: Record<string, string> = {
    "techstart-solutions": "TechStart Solutions",
    "healthhub-medical": "HealthHub Medical",
    "global-consulting": "Global All-In-Consulting",
  };

  const clientName = clientNames[clientId || ""] || "Client";

  // Group agents by name - agents with same name but different sources are grouped
  // The configured source (from agent config) determines which one to use
  const groupedAgents = useMemo(() => {
    const groups: Record<string, Agent[]> = {};
    agents.forEach((agent) => {
      if (!groups[agent.name]) {
        groups[agent.name] = [];
      }
      groups[agent.name].push(agent);
    });
    return Object.values(groups);
  }, [agents]);

  // Get the primary agent from a group - uses the first agent (configured source)
  const getAgentFromGroup = (agentGroup: Agent[]) => {
    return agentGroup[0];
  }

  const handleScheduleClick = (agentGroup: Agent[]) => {
    const agent = getAgentFromGroup(agentGroup);
    setSelectedAgent(agent);
    setScheduleModalOpen(true);
  };

  const handleRunNowClick = (agentGroup: Agent[]) => {
    const agent = getAgentFromGroup(agentGroup);
    // Special handling for Marketing's two automation agents -> use n8n run flow
    if (title === "Marketing" && ["VSL Generator", "Perfect Webinar Script"].includes(agent.name)) {
      setSelectedAgent(agent);
      const agentKey = agent.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      (async () => {
        const cfg = await fetchAgentConfig({ area: "marketing", agentKey, clientId: clientId });
        if (!cfg) {
          setN8nConfigAgentKey(agentKey);
          setN8nConfigOpen(true);
          return;
        }
        const fields = (cfg.input_mapping?.requiredFields ?? []) as RuntimeField[];
        if (fields.length > 0) {
          setN8nRunFields(fields);
          setN8nRunConfig({ connectionId: cfg.connection_id, workflowId: cfg.workflow_id, webhookUrl: cfg.webhook_url || undefined });
          setN8nRunOpen(true);
        } else {
          try {
            setN8nRunning(true);
            await runN8nWorkflow({ connectionId: cfg.connection_id, workflowId: cfg.workflow_id, webhookUrl: cfg.webhook_url || undefined, payload: {}, waitTillFinished: true });
            toast({ title: "Agent started", description: `${agent.name} is running` });
          } finally {
            setN8nRunning(false);
          }
        }
      })();
    } else {
      setSelectedAgent(agent);
      setRunNowModalOpen(true);
    }
  };

  const handleStatusClick = (agentGroup: Agent[]) => {
    const agent = getAgentFromGroup(agentGroup);
    setSelectedAgent(agent);
    setStatusModalOpen(true);
  };

  const handleSaveSchedule = (newSchedule: "daily" | "weekly" | "monthly") => {
    console.log(`Updated ${selectedAgent?.name} schedule to ${newSchedule}`);
    // Here you would update the backend
  };

  const handleSaveStatus = (newStatus: "Active" | "Inactive" | "Paused") => {
    console.log(`Updated ${selectedAgent?.name} status to ${newStatus}`);
    // Here you would update the backend
  };

  const getStatusDotColor = (status: Agent["status"]) => {
    switch (status) {
      case "Active":
        return "bg-green-500";
      case "Paused":
        return "bg-yellow-500";
      case "Inactive":
        return "bg-gray-400";
    }
  };

  const agentListContent = groupedAgents.map((agentGroup, index) => {
    const agent = getAgentFromGroup(agentGroup);

    return (
      <div
        key={index}
        className="flex items-center justify-between gap-3 py-2 text-sm group hover:bg-muted/50 px-2 rounded-md transition-colors"
      >
        <span className="text-foreground flex-1">{agent.name}</span>
        <div className="flex items-center gap-2 ml-auto">
          {/* Source badge - configured in agent settings, not editable here */}
          <Badge 
            variant="outline" 
            className={`text-xs capitalize flex items-center gap-1.5 ${
              agent.source === 'mastra' 
                ? 'border-purple-500/30 text-purple-400' 
                : 'border-blue-500/30 text-blue-400'
            }`}
          >
            {agent.source === 'mastra' ? (
              <>
                <img src="/mastra.svg" alt="" className="h-3.5 w-3.5 brightness-0 invert" />
                Mastra
              </>
            ) : (
              <>
                <img src="/n8n.svg" alt="" className="h-3 w-auto" />
                N8n
              </>
            )}
          </Badge>

          {agent.schedule && (
            <Badge
              variant="outline"
              className="cursor-pointer hover:bg-primary/10 text-xs capitalize"
              onClick={() => handleScheduleClick(agentGroup)}
            >
              {agent.schedule}
            </Badge>
          )}
          {agent.canRunNow && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-30 group-hover:opacity-100 transition-opacity"
              onClick={() => handleRunNowClick(agentGroup)}
              title="Run now"
            >
              <RotateCw className="h-3.5 w-3.5" />
            </Button>
          )}
          <button
            onClick={() => handleStatusClick(agentGroup)}
            className="cursor-pointer hover:opacity-80 transition-opacity"
            title={`Status: ${agent.status}`}
          >
            <div className={`h-2 w-2 rounded-full ${getStatusDotColor(agent.status)}`} />
          </button>
        </div>
      </div>
    );
  });

  return (
    <>
      <Card className="border border-border bg-card p-6">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            </div>
            <Badge className="bg-primary/20 text-primary hover:bg-primary/30">
              {agentCount} Agents
            </Badge>
          </div>

          {/* Agent List - Scrollable if more than 3 */}
          {agents.length > 3 ? (
            <ScrollArea className="h-[180px] pr-4">
              <div className="space-y-1">
                {agentListContent}
              </div>
            </ScrollArea>
          ) : (
            <div className="space-y-1">
              {agentListContent}
            </div>
          )}

          {/* Footer Button */}
          <Button
            variant="outline"
            className="w-full border-primary/20 text-primary hover:bg-primary/10"
            asChild
          >
            <Link to={title === "Advertising" ? `/client/${clientId}/advertising` : "#"}>
              Access {title} Tools
            </Link>
          </Button>
        </div>
      </Card>

      {/* Modals */}
      {selectedAgent?.schedule && (
        <ScheduleManagementModal
          open={scheduleModalOpen}
          onOpenChange={setScheduleModalOpen}
          agentName={selectedAgent.name}
          currentSchedule={selectedAgent.schedule}
          onSave={handleSaveSchedule}
        />
      )}

      {selectedAgent?.canRunNow && (
        <RunNowModal
          open={runNowModalOpen}
          onOpenChange={setRunNowModalOpen}
          agentName={selectedAgent.name}
          clientName={clientName}
        />
      )}

      {selectedAgent && (
        <StatusChangeModal
          open={statusModalOpen}
          onOpenChange={setStatusModalOpen}
          agentName={selectedAgent.name}
          currentStatus={selectedAgent.status}
          onSave={handleSaveStatus}
        />
      )}

      {/* n8n config/run modals (marketing automations) */}
      <N8nAgentConfigModal
        open={n8nConfigOpen}
        onOpenChange={setN8nConfigOpen}
        scope="client"
        clientId={clientId}
        area="marketing"
        agentKey={n8nConfigAgentKey}
        title="Configure Marketing Agent"
      />
      <RunAgentDynamicModal
        open={n8nRunOpen}
        onOpenChange={setN8nRunOpen}
        title="Provide inputs"
        fields={n8nRunFields}
        onRun={async (values) => {
          if (!n8nRunConfig) return;
          try {
            setN8nRunning(true);
            await runN8nWorkflow({ connectionId: n8nRunConfig.connectionId, workflowId: n8nRunConfig.workflowId, webhookUrl: n8nRunConfig.webhookUrl, payload: values, waitTillFinished: true });
            toast({ title: "Agent started", description: "Workflow triggered" });
            setN8nRunOpen(false);
          } finally {
            setN8nRunning(false);
          }
        }}
        running={n8nRunning}
      />
    </>
  );
};
