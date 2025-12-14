import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChatSidebar } from "@/components/ChatSidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { DollarSign, MoreHorizontal, Search, Plus, FileText } from "lucide-react";

type FinStatus = "active" | "on_leave" | "inactive";

type FinancialAgent = {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
  status: FinStatus;
  currentProject: string;
  performancePct: number;
};

function statusDotClass(status: FinStatus) {
  if (status === "active") return "bg-emerald-500";
  if (status === "on_leave") return "bg-amber-500";
  return "bg-rose-500";
}

function statusLabel(status: FinStatus) {
  if (status === "active") return "Active";
  if (status === "on_leave") return "On Leave";
  return "Inactive";
}

const FinancialAgents = () => {
  const { clientId } = useParams();

  const kpis = [
    { label: "Budget Utilization", value: "92%" },
    { label: "Project Completion", value: "78%" },
  ];

  const agents: FinancialAgent[] = [
    {
      id: "olivia",
      name: "Olivia Rhye",
      role: "Sr. Financial Analyst",
      avatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBbwCHQ6PwplC80VDhIQ-itheWtP3RS1knkBgd9RGYMYTg3J6W4yNRW6tH9eiUkFvhs5zeHaH3nZpxt017kyBWpTh6o0F0BPQJfyyCAPGT-7cUyKKl_Pk0kgUdVbq24X7yIym7OZq86DyBESBiTrqDC4KbAD_l3JBwTyxpXXwORxlHMtz3K6zyRw8xIV0cEKe8wGL3mjfywjbgx1QAT4HWACmFsBTAV974dm7H9fO806dyGf1M5Rcrar7mvdNpoBIcBumyEmRVpM6G0",
      status: "active",
      currentProject: "Q3 Revenue Projection",
      performancePct: 92,
    },
    {
      id: "phoenix",
      name: "Phoenix Baker",
      role: "Accountant",
      avatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDITnLqLpcZ-FKgjON5NogPeeGesth4qDcyIW1BBxMmhIr9zk085GJtEF_GTkc4W_kq4-aLq3jUnNV24x-JjlyVCBMjpG7yu9_FCI_KhaasQ_gk_vDbVBak403Wz7YzgMu5PlG4LYY847tAh5dLz5SCk1IOPfQggM-JljhdNf4P5Spx19ovTnupVxp9Pe2qNHXMZpfYq4u0X6DRTcKqL3kmFXfJN8CJRB2FSnth1cPh407muxjp13WE144xoF9Dylzrz2wapJs3AZ8-",
      status: "on_leave",
      currentProject: "N/A",
      performancePct: 75,
    },
    {
      id: "lana",
      name: "Lana Steiner",
      role: "Budget Coordinator",
      avatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBuedUQNWcJh6b1QJ4hoSYSlGZIM6veDKFJ5zRqvxWyE97AfUKcnLqvtG0YHCTI5zVXDThI6-6L5b4H5abpMaZRr4Hxx4Re4UJepAmGf4-XjccHeSMXSIQgU6oKxOcF03YOTBUdb-6QpPgHDjechZIvxpYTAcC2nYA3S0HVFfXZjHIsluYfatSFDQwJhWanN3Fwp8EuB0AUwgpaBaabmEvHuCi0HpqiQKblHcS-XqWU1QeeS8AhRZ10Ylt4koBiRGNIQFdRhH8WEWoV",
      status: "active",
      currentProject: "Expense Report Automation",
      performancePct: 88,
    },
    {
      id: "demi",
      name: "Demi Wilkinson",
      role: "Financial Planner",
      avatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBPYKmign2T7d7A2O1I4oCG22p2i9rTPV5lw7rmVtgxkx9RaqiLckeRpwVN1cacZ__At7s_aH2nKUyT_fMwc0ky7pmCvd37ftrLACFL2cUckcFpGfQ3_roVvbl5MyDuLGJmdWUCzywKPmallMiFnwPZ4jCQcGczDcIbfPLYscORyBRqOn6DAt6oHfSKu32HTYYj2uS5W8-UFIKvQ4Kz4eJHqdniBB-qKAgjLFy328GeidB9fOBRge3PKQ1Xs4r7EcW89n3itrXqAlrf",
      status: "inactive",
      currentProject: "Client Portfolio Review",
      performancePct: 40,
    },
  ];

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | FinStatus>("all");

  const filteredAgents = useMemo(() => {
    const q = query.trim().toLowerCase();
    return agents.filter((a) => {
      const filterOk = filter === "all" ? true : a.status === filter;
      const qOk = q ? (a.name + " " + a.role).toLowerCase().includes(q) : true;
      return filterOk && qOk;
    });
  }, [agents, query, filter]);

  return (
    <div className="flex h-screen w-full bg-background">
      <ChatSidebar />
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
                  <span className="text-foreground">Financials</span>
                </div>
                <div className="flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-foreground" />
                  <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground">
                    Financials Department
                  </h1>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Overview of agents, projects, and department health.
                </p>
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

        {/* Main grid */}
        <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3 lg:p-8">
          {/* Left: search + table */}
          <div className="flex flex-col gap-4 lg:col-span-2">
            <div className="flex flex-col justify-between gap-4 sm:flex-row">
              <div className="relative min-w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="w-full pl-9"
                  placeholder="Search agents..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filter === "all" ? "default" : "outline"}
                  className={filter === "all" ? "" : "border-border"}
                  onClick={() => setFilter("all")}
                >
                  All
                </Button>
                <Button
                  variant={filter === "active" ? "default" : "outline"}
                  className={filter === "active" ? "" : "border-border"}
                  onClick={() => setFilter("active")}
                >
                  Active
                </Button>
                <Button
                  variant={filter === "on_leave" ? "default" : "outline"}
                  className={filter === "on_leave" ? "" : "border-border"}
                  onClick={() => setFilter("on_leave")}
                >
                  On Leave
                </Button>
              </div>
            </div>

            <Card className="overflow-x-auto border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Current Project</TableHead>
                    <TableHead className="text-right">Performance</TableHead>
                    <TableHead className="text-right">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAgents.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            {a.avatarUrl ? <AvatarImage src={a.avatarUrl} alt={a.name} /> : null}
                            <AvatarFallback>
                              {a.name
                                .split(" ")
                                .map((p) => p[0])
                                .join("")
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">{a.name}</span>
                            <span className="text-sm text-muted-foreground">{a.role}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${statusDotClass(a.status)}`} />
                          <span className="text-sm text-foreground/80">{statusLabel(a.status)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground/80">{a.currentProject}</TableCell>
                      <TableCell className="w-56">
                        <Progress value={a.performancePct} className="h-2" />
                      </TableCell>
                      <TableCell className="text-right">
                        <button className="text-muted-foreground hover:text-foreground">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>

          {/* Right: Health pulse + projects */}
          <div className="flex flex-col gap-6">
            <Card className="border border-border bg-card p-6">
              <h3 className="mb-4 text-lg font-bold text-foreground">Department Health Pulse</h3>
              <div className="relative flex h-40 items-center justify-center">
                <svg className="-rotate-90 transform" width="160" height="160" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    strokeWidth="12"
                    className="stroke-muted"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    strokeWidth="12"
                    strokeLinecap="round"
                    className="stroke-primary"
                    strokeDasharray="339.292"
                    strokeDashoffset="54.28672"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-4xl font-extrabold text-foreground">84%</span>
                  <span className="text-sm text-muted-foreground">Excellent</span>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4 text-center">
                {kpis.map((k, i) => (
                  <div key={i}>
                    <p className="text-sm text-muted-foreground">{k.label}</p>
                    <p className="text-xl font-bold text-foreground">{k.value}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="border border-border bg-card p-6">
              <h3 className="mb-4 text-lg font-bold text-foreground">FP&amp;A Projects</h3>
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex size-5 flex-shrink-0 items-center justify-center rounded-md bg-primary/20">
                    <span className="text-sm text-primary">↑</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Q3 Revenue Projection</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500">
                        In Progress
                      </span>
                      <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-500">
                        High Priority
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 flex size-5 flex-shrink-0 items-center justify-center rounded-md bg-primary/20">
                    <span className="text-sm text-primary">∑</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Expense Report Automation</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-500">
                        In Review
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 flex size-5 flex-shrink-0 items-center justify-center rounded-md bg-primary/20">
                    <span className="text-sm text-primary">▣</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Client Portfolio Analysis</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500">
                        Completed
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FinancialAgents;


