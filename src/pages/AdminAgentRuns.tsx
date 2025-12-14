import { useEffect, useMemo, useState } from "react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type AgentMessageRow = {
  id: string;
  created_at: string;
  client_id: string | null;
  agent_config_id: string;
  role: string;
  content: string;
  metadata: any;
};

type AgentConfigRow = {
  id: string;
  display_name: string | null;
  agent_key: string;
  area: string;
};

const formatDuration = (ms?: number | null) => {
  if (ms == null) return "n/a";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

const AdminAgentRuns = () => {
  const [messages, setMessages] = useState<AgentMessageRow[]>([]);
  const [agents, setAgents] = useState<Record<string, AgentConfigRow>>({});
  const [loading, setLoading] = useState(true);
  const [onlyAssistant, setOnlyAssistant] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("agent_messages")
          .select("id, created_at, client_id, agent_config_id, role, content, metadata")
          .order("created_at", { ascending: false })
          .limit(80);
        if (error) throw error;
        setMessages(data || []);

        const agentIds = Array.from(new Set((data || []).map((m) => m.agent_config_id)));
        if (agentIds.length) {
          const { data: agentsData } = await supabase
            .from("agent_configs")
            .select("id, display_name, agent_key, area")
            .in("id", agentIds);
          const map: Record<string, AgentConfigRow> = {};
          (agentsData || []).forEach((a) => {
            map[a.id] = a as AgentConfigRow;
          });
          setAgents(map);
        }
      } catch (e) {
        console.error("Failed to load agent runs", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const rows = useMemo(() => {
    const filtered = onlyAssistant ? messages.filter((m) => m.role === "assistant") : messages;
    return filtered.map((m) => {
      const trace = m.metadata?.trace || {};
      const agentMeta = agents[m.agent_config_id];
      return {
        ...m,
        trace,
        agentLabel: agentMeta?.display_name || agentMeta?.agent_key || m.agent_config_id,
        area: agentMeta?.area,
      };
    });
  }, [messages, agents, onlyAssistant]);

  return (
    <div className="flex h-screen w-full" style={{ background: "var(--page-bg)" }}>
      <AdminSidebar />
      <main className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground">Agent Runs</h1>
            <p className="text-sm text-muted-foreground">Recent executions with trace metadata for debugging.</p>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="assistant-only" checked={onlyAssistant} onCheckedChange={setOnlyAssistant} />
            <Label htmlFor="assistant-only" className="text-sm text-muted-foreground">
              Show only assistant messages
            </Label>
          </div>
        </div>

        <Card className="border border-border bg-card">
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[160px]">When</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Request</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                )}
                {!loading && rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
                      No runs found.
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  rows.map((row) => {
                    const trace = row.trace || {};
                    const success = trace.success !== false;
                    return (
                      <TableRow key={row.id}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(row.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-foreground">{row.agentLabel}</div>
                          {row.area && <div className="text-xs text-muted-foreground">{row.area}</div>}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {row.client_id || "agency"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={success ? "outline" : "destructive"}>
                            {trace.status ?? "n/a"} {trace.statusText ? trace.statusText : success ? "OK" : "Err"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDuration(trace.durationMs)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          <div>id: {trace.requestId || "n/a"}</div>
                          {trace.error && <div className="text-destructive">err: {trace.error}</div>}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {trace.contentLength != null ? `${trace.contentLength} chars` : "n/a"}
                        </TableCell>
                        <TableCell className="text-xs text-foreground max-w-xs truncate">
                          {row.content}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default AdminAgentRuns;


