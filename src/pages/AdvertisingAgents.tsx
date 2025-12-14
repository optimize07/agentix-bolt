import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AdvertisingSidebar } from "@/components/AdvertisingSidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { MoreHorizontal, Search, Megaphone, FileText, Plus } from "lucide-react";
import { listN8nConnections, listN8nWorkflows } from "@/integrations/n8n/api";
import { N8nAgentConfigModal } from "@/components/agents/N8nAgentConfigModal";

type AgentStatus = "online" | "busy" | "offline";

type AdvertisingAgent = {
  id: string;
  name: string;
  avatarUrl?: string;
  status: AgentStatus;
  activeCampaigns: number;
  optimizationProjects: number;
  performancePct: number; // 0-100
};

type CampaignOverview = {
  name: string;
  metricLabel: string;
  metricColorClass: string;
  ownerAvatarUrl?: string;
  progressPct: number;
  amountLeftLabel: string;
  progressRightLabel: string;
};

function statusPillClasses(status: AgentStatus) {
  if (status === "online") return "text-emerald-500 bg-emerald-500/10";
  if (status === "busy") return "text-amber-500 bg-amber-500/10";
  return "text-muted-foreground bg-muted";
}

const AdvertisingAgents = () => {
  const { clientId } = useParams();
  const [configOpen, setConfigOpen] = useState(false);
  const [configAgentKey, setConfigAgentKey] = useState<string>("");

  const [n8nRows, setN8nRows] = useState<AdvertisingAgent[]>([]);
  const [n8nMap, setN8nMap] = useState<Record<string, { connectionId: string; workflowId: string }>>({});

  useEffect(() => {
    (async () => {
      try {
        const rows: AdvertisingAgent[] = [];
        const map: Record<string, { connectionId: string; workflowId: string }> = {};
        const agency = await listN8nConnections({ scope: "agency" });
        const client = clientId ? await listN8nConnections({ scope: "client", clientId }) : { connections: [] };
        const all = [...(agency?.connections ?? []), ...(client?.connections ?? [])];
        for (const c of all) {
          const { workflows } = await listN8nWorkflows({ connectionId: c.id });
          for (const w of workflows || []) {
            const key = `n8n-${c.id}-${w.id}`;
            rows.push({
              id: key,
              name: (w.name || `Workflow ${w.id}`) as string,
              avatarUrl: "/n8n.svg",
              status: "online",
              activeCampaigns: 0,
              optimizationProjects: 0,
              performancePct: 80,
            });
            map[key] = { connectionId: c.id, workflowId: String(w.id) };
          }
        }
        setN8nRows(rows);
        setN8nMap(map);
      } catch (e) {
        console.error("Failed to load n8n workflows", e);
        setN8nRows([]);
      }
    })();
  }, [clientId]);

  const kpis = [
    { label: "Total Agents", value: "42" },
    { label: "Active Campaigns", value: "18" },
    { label: "Total Ad Spend", value: "$250,600", trend: "+5.2%" },
    { label: "Department Health", value: "95%", trend: "Excellent" },
  ];

  const agents: AdvertisingAgent[] = [
    {
      id: "olivia",
      name: "Olivia Rhye",
      avatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDVV0yQORHQyjodkknteQ0mmuYhlj7wwpC8U3OI3LV1AatP--6V0YAvq2Wz3o_0-zklaV07c-0U1otWRSGA0Dz-qRa7C9NYc0l_YjAUPz2cj9Gky8Lk0laAtAUOxIdgSN2b6LW3SKaJcjwJZuMDC-xIia3r2Kp0tjJwchS1MeYXchsbsS9WCp4ZK4yvw8H31oXc9KEsND9G1kpx0GV2vCkebhmAQTlmg95op40VGNK4FZKDBOJ_wE7DcJC1qvMF-LWwM6kZnFeDCx9x",
      status: "online",
      activeCampaigns: 5,
      optimizationProjects: 2,
      performancePct: 92,
    },
    {
      id: "phoenix",
      name: "Phoenix Baker",
      avatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAcqBNJG-9Mt9xwJEqZU52uQZlFfBqwKx0gJmBmtQsiD47jvEPaRgdN09YXjiKCQpG8KxuDSHloV7VvhDG0zo6KLh9y6NNy9vXgOzVfE54psKkDGf3YrtUuhJeiAOC4lluFiMTrXO-vN1VDMr9A6lmiMPG2ECCGVyIcW3J1g9X3g3-je1bJTLux3p_UoQsrT9swo5aJwOb7g_PaB46VHdYhsX1hXDQm-TYhxS6d1lwaMsmyFx7C9UQBF5p7HXVXQMVv2mFR21aswsey",
      status: "busy",
      activeCampaigns: 8,
      optimizationProjects: 4,
      performancePct: 85,
    },
    {
      id: "lana",
      name: "Lana Steiner",
      avatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCVEwd0eBZaCw2rgemCeb3mZsTg11v_EePzVxsAAgtTlcs7aIgVbkicW8h0vovrGHfkG6MTPdYp-kPq1tNq5dvaz_MNLkSpMcB5nG_l3wuinBVEQZVThsP9Ufhjp1Xy0GT7kr_9HfgRJsQv0K8X__jhU8PPddZJ53Vz1kdlJzQ23xztWSITNKr0-hR1WbUCGYRktdL4YW9H1jCATxVVY6AY7TYwFV4rSb2mlB9d-3v2S4Yb8ly-fCyDbIOKFyLFQh5vN452U0XU7pHG",
      status: "offline",
      activeCampaigns: 3,
      optimizationProjects: 1,
      performancePct: 78,
    },
    {
      id: "demi",
      name: "Demi Wilkinson",
      avatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuColtx48s1Vh3C5ZmPsiTWwp9fhaelvouIP6JnunMWRbMJj-06XI2pkVYx1yra_n4LldaALeJ3SZ35Y6DYguE39sjBDXlD93UDaWqjKJB9AF7tOi1ZsIoiFO2YFTmKbIEnpkkyrnioaCGLwuZ1AxDCd3xRQxa_mWsVivZACx5TUEP4wi1aXAasLjOrT_n1h7rxTWiBc3f0BV5X10FbI0CKb1G7oG-4T_dw-XJwov5mLtWqzXH0haLkAaM3rNFUmRqb7kexq2ki6c0Tm",
      status: "online",
      activeCampaigns: 6,
      optimizationProjects: 3,
      performancePct: 95,
    },
  ];

  const combinedAgents = [...agents, ...n8nRows];

  const campaigns: CampaignOverview[] = [
    {
      name: "Summer Sale 2024",
      metricLabel: "ROAS: 4.2",
      metricColorClass: "text-emerald-500",
      ownerAvatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCfvEGti7mj58G31Dqow0-VIqi4D7FV_j1B7nrN5tPyCqWRGp4BMeE6zOcGLp_8ri2kLmDDhNmNW96f8jnK_2iIrZBySpFG2MlJgDE4iBKc57eK1xg3WZlPv9DF-o7KbCIHEppuVMUaxZ9OVyPFq3PD1cqF6vemtNAE7pdjaB-lvwTu5ec3ogaroEX5MoPw9RaYHtdjcnHUNfy6BWlbV9FAZpxRcMzzz6d5zwcnWc3gM_II50MncX9t386MscoeKk8fjlE7o2L9i6eU",
      progressPct: 75,
      amountLeftLabel: "$15,000 / $20,000",
      progressRightLabel: "75%",
    },
    {
      name: "Q4 Product Launch",
      metricLabel: "CTR: 1.8%",
      metricColorClass: "text-amber-500",
      ownerAvatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCSZg5H02vROGL2gfYbYi7oUvMwjjiFsPz-UlpCnfqLI2aZ6hCiTvaYJ9YWzmHKUyCBrPNsdXtc0a8prdkvPHZPUZrMkzM9EDWDHvF_boww8_S4b5tq4jGphx7Msew7Tn6bltzhmd6yoIarvwBFMnpIP8HPb8Cye8vCdvWzXLsZJsfV_AsXMERZCdEIxX3XivrjhCMCjox7J2VqsnbXgOQksvdGPjvGCnQup9IyNIeuTQsYdL4jx_1fRS5qnpZ4w4AC27kWL5fZPD3R",
      progressPct: 40,
      amountLeftLabel: "$8,000 / $20,000",
      progressRightLabel: "40%",
    },
    {
      name: "Brand Awareness Initiative",
      metricLabel: "ROAS: 3.9",
      metricColorClass: "text-emerald-500",
      ownerAvatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCAwb2myvyxp3WomJqrcXa1Hyp-kFnQqYRMt9iEINERCVE_sNJnhOTbIFPyMM9hR5ZfAISl-SZm-aCJyfE-8xHhzYlVL7mAvcSFgLp0Wamssh6ZkGFH9tTKYpFzWFrWPSF9VN8uUWwyWfZ5sMTDHnN1Hyy7gV0hHturrohtvqN_iOzw6-lkfzU8tkz_yTCW8lK9y5Ju1kE5MniWyoA2Ot6rD6nXn95JFl-o1gB9OYAdSY3iVcEy-cMTecXTSsoAK-iV5B18ib2BiD6F",
      progressPct: 90,
      amountLeftLabel: "$27,000 / $30,000",
      progressRightLabel: "90%",
    },
  ];

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | AgentStatus>("all");
  const [performance] = useState<"all" | "high" | "medium" | "low">("all");

  const filteredAgents = useMemo(() => {
    const q = query.trim().toLowerCase();
    return agents.filter((a) => {
      const statusOk = status === "all" ? true : a.status === status;
      const text = a.name.toLowerCase();
      const qOk = q ? text.includes(q) : true;
      return statusOk && qOk;
    });
  }, [agents, query, status]);

  const filteredCombined = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = [...agents, ...n8nRows];
    return list.filter((a) => {
      const statusOk = status === "all" ? true : a.status === status;
      const text = a.name.toLowerCase();
      const qOk = q ? text.includes(q) : true;
      return statusOk && qOk;
    });
  }, [agents, n8nRows, query, status]);

  return (
    <div className="flex h-screen w-full bg-background">
      <AdvertisingSidebar />
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="border-b border-border bg-background">
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
                  <span className="text-foreground">Advertising</span>
                </div>
                <div className="flex items-center gap-3">
                  <Megaphone className="h-8 w-8 text-foreground" />
                  <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground">
                    Advertising Department
                  </h1>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="border-border text-foreground">
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Report
                </Button>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Agent
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 lg:grid-cols-4 lg:p-8">
          {kpis.map((kpi, idx) => (
            <Card key={idx} className="border border-border bg-card p-6">
              <p className="text-base font-medium text-muted-foreground">{kpi.label}</p>
              {kpi.trend ? (
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="text-3xl font-bold leading-tight tracking-tight text-foreground">
                    {kpi.value}
                  </p>
                  <p className="text-sm font-medium text-emerald-500">{kpi.trend}</p>
                </div>
              ) : (
                <p className="mt-2 text-3xl font-bold leading-tight tracking-tight text-foreground">
                  {kpi.value}
                </p>
              )}
            </Card>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3 lg:p-8">
          {/* Left: search + table */}
          <div className="flex flex-col gap-4 lg:col-span-2">
            <div className="flex flex-col justify-between gap-4 sm:flex-row">
              <div className="relative min-w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="w-full pl-9"
                  placeholder="Find agents by name..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Status: All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Status: All</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                    <SelectItem value="busy">Busy</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={performance} disabled>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Performance: All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Performance: All</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Card className="overflow-x-auto border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Active Campaigns</TableHead>
                    <TableHead className="text-center">Optimization Projects</TableHead>
                    <TableHead>Performance Score</TableHead>
                    <TableHead className="text-right">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCombined.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            {a.avatarUrl ? <AvatarImage src={a.avatarUrl} alt={a.name} /> : null}
                            <AvatarFallback>
                              {a.name
                                .split(" ")
                                .map((p) => p[0])
                                .join("")
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-foreground">{a.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${statusPillClasses(
                            a.status,
                          )}`}
                        >
                          <span className="h-2 w-2 rounded-full bg-current" />
                          {a.status === "online" ? "Online" : a.status === "busy" ? "Busy" : "Offline"}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{a.activeCampaigns}</TableCell>
                      <TableCell className="text-center">{a.optimizationProjects}</TableCell>
                      <TableCell className="w-56">
                        <Progress value={a.performancePct} className="h-2" />
                      </TableCell>
                      <TableCell className="text-right">
                        <button
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setConfigAgentKey(a.id);
                            setConfigOpen(true);
                          }}
                          title="Edit configuration"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>

          {/* Right: campaigns overview */}
          <Card className="h-fit space-y-5 border border-border bg-card p-6 lg:col-span-1">
            <h3 className="text-lg font-bold text-foreground">Active Campaigns Overview</h3>
            <div className="flex flex-col gap-5">
              {campaigns.map((c, idx) => (
                <div key={idx} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-foreground">{c.name}</p>
                    <span className={`text-sm font-semibold ${c.metricColorClass}`}>{c.metricLabel}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">Agent:</p>
                    <Avatar className="h-5 w-5">
                      {c.ownerAvatarUrl ? <AvatarImage src={c.ownerAvatarUrl} alt="agent" /> : null}
                      <AvatarFallback>AG</AvatarFallback>
                    </Avatar>
                  </div>
                  <Progress value={c.progressPct} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{c.amountLeftLabel}</span>
                    <span>{c.progressRightLabel}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>

      {/* Configure selected n8n agent */}
      <N8nAgentConfigModal
        open={configOpen}
        onOpenChange={setConfigOpen}
        scope="client"
        clientId={clientId}
        area="advertising"
        agentKey={configAgentKey}
        title="Configure Advertising Agent"
      />
    </div>
  );
};

export default AdvertisingAgents;


