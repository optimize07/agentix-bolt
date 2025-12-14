import { Search, Plus, TrendingUp, Users, Briefcase, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminSidebar } from "@/components/AdminSidebar";
import { StatsCardLarge } from "@/components/admin/StatsCardLarge";
import { RevenueMetricCard } from "@/components/admin/RevenueMetricCard";
import { RevenueTimelineCard } from "@/components/admin/RevenueTimelineCard";
import { TasksTable } from "@/components/admin/TasksTable";
import { DepartmentHealthCard } from "@/components/admin/DepartmentHealthCard";
import { ClientPortfolioCard } from "@/components/admin/ClientPortfolioCard";
import { ActivityFeedItem } from "@/components/admin/ActivityFeedItem";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const revenueChartData = [
  { name: 'This Month', value: 287 },
  { name: 'Last Month', value: 237 },
  { name: 'Last Quarter', value: 842 },
];

const departmentPerformance = [
  { name: 'Advertising', value: 93 },
  { name: 'Marketing', value: 91 },
  { name: 'Sales', value: 91 },
  { name: 'Operations', value: 89 },
  { name: 'Strategy', value: 86 },
  { name: 'Financials', value: 73 },
];

const AdminDashboard = () => {
  return (
    <div className="flex min-h-screen" style={{ background: 'var(--page-bg)' }}>
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        {/* Top Header */}
        <div className="border-b border-border" style={{ background: 'var(--page-bg)' }}>
          <div className="p-6">
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-foreground">Agency Pulse Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Agency-level insights for high-level decision making across multiple projects and clients
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search projects, clients..."
                  className="pl-10 bg-sidebar border-border"
                />
              </div>
              <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="h-4 w-4" />
                New Task
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* At a Glance Stats */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">At a Glance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCardLarge
                title="Active Clients"
                value="24"
                change="+3 this month"
                icon={Users}
              />
              <StatsCardLarge
                title="Projects"
                value="147"
                change="across all clients"
                icon={Briefcase}
              />
              <StatsCardLarge
                title="Revenue"
                value="$287K"
                change="this month"
                icon={DollarSign}
              />
              <StatsCardLarge
                title="Task Velocity"
                value="43"
                change="tasks/day avg"
                icon={TrendingUp}
              />
            </div>
          </section>

          {/* Revenue Tracker */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">Revenue Tracker</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <RevenueMetricCard
                title="Leads"
                metrics={[
                  { label: "Total", value: "324" },
                  { label: "Converted", value: "43" },
                  { label: "Cost/Acq", value: "$78" },
                ]}
              />
              <RevenueMetricCard
                title="Revenue"
                metrics={[
                  { label: "Generated", value: "$28K" },
                  { label: "Outstanding", value: "$120K" },
                  { label: "Target", value: "$350K" },
                ]}
              />
              <RevenueMetricCard
                title="CAC"
                metrics={[
                  { label: "Facebook", value: "$343K" },
                  { label: "Inbound", value: "$43K" },
                  { label: "Substack", value: "$5K" },
                ]}
              />
              <RevenueMetricCard
                title="Clients"
                metrics={[
                  { label: "Onboarded", value: "18" },
                  { label: "Active", value: "14" },
                  { label: "Ret. Rate", value: "$15.9K" },
                ]}
              />
            </div>
          </section>

          {/* Revenue Timeline Comparison */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">Revenue Timeline Comparison</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <RevenueTimelineCard
                  period="This Month"
                  revenue="$287K"
                  leads="87"
                  conversions="12"
                  aov="$245"
                />
                <RevenueTimelineCard
                  period="Last Month"
                  revenue="$237K"
                  leads="102"
                  conversions="9"
                  aov="$301"
                />
                <RevenueTimelineCard
                  period="Last Quarter"
                  revenue="$842K"
                  leads="513"
                  conversions="37"
                  aov="$279"
                />
              </div>
            <div className="rounded-lg p-6" style={{ background: 'var(--card-bg)', border: 'var(--card-border-width) solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
                <h3 className="text-sm font-semibold text-foreground mb-4">Revenue Comparison</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="name" stroke="#888" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#888" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #333',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="value" fill="#134736" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* Task Lists Management */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">Task Lists Management</h2>
            <TasksTable />
          </section>

          {/* Department Health Monitor */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">Department Health Monitor</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <DepartmentHealthCard
                name="Strategy"
                teamSize={8}
                activeTasks={9}
                agentHealth={95}
              />
              <DepartmentHealthCard
                name="Advertising"
                teamSize={6}
                activeTasks={4}
                agentHealth={60}
              />
              <DepartmentHealthCard
                name="Sales"
                teamSize={5}
                activeTasks={8}
                agentHealth={80}
              />
              <DepartmentHealthCard
                name="Operations"
                teamSize={7}
                activeTasks={11}
                agentHealth={76}
              />
              <DepartmentHealthCard
                name="Financials"
                teamSize={4}
                activeTasks={6}
                agentHealth={72}
              />
              <DepartmentHealthCard
                name="Marketing"
                teamSize={4}
                activeTasks={4}
                agentHealth={45}
              />
            </div>
          </section>

          {/* Client Portfolio */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">Client Portfolio</h2>
            <div className="mb-4 flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search clients..."
                  className="pl-10 bg-sidebar border-border"
                />
              </div>
              <Tabs defaultValue="all">
                <TabsList className="bg-sidebar">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="inactive">Inactive</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <ClientPortfolioCard
                clientId="techstart-solutions"
                name="TechStart Solutions"
                type="B2B SaaS"
                projects={12}
                revenue="$45K"
                tasks={23}
              />
              <ClientPortfolioCard
                clientId="healthhub-medical"
                name="HealthHub Medical"
                type="Healthcare"
                projects={8}
                revenue="$38K"
                tasks={17}
              />
              <ClientPortfolioCard
                clientId="global-consulting"
                name="Global All-In-Consulting"
                type="Consulting"
                projects={15}
                revenue="$52K"
                tasks={31}
              />
            </div>
          </section>

          {/* Client Task Activity Tracker */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">Client Task Activity Tracker</h2>
            <div className="rounded-lg" style={{ background: 'var(--card-bg)', border: 'var(--card-border-width) solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
              <div className="border-b border-border p-4">
                <Tabs defaultValue="tasks">
                  <TabsList className="bg-sidebar">
                    <TabsTrigger value="tasks">Tasks</TabsTrigger>
                    <TabsTrigger value="alerts">Alerts</TabsTrigger>
                    <TabsTrigger value="views">Views</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <div className="divide-y divide-border">
                <ActivityFeedItem
                  action="Strategy Team Completed Under discussion"
                  client="TechStart Solutions Agency"
                  time="2 hours"
                />
                <ActivityFeedItem
                  action="Marketing Tasks created Status sent"
                  client="HealthHub Medical Agency"
                  time="5 hours"
                />
                <ActivityFeedItem
                  action="Sales Team Assigned Creative Tool"
                  client="Onward Marketing Inc"
                  time="8 hours"
                />
                <ActivityFeedItem
                  action="Operations Team started High priority"
                  client="Global All-In-Consulting"
                  time="1 day ago"
                />
                <ActivityFeedItem
                  action="Financials Team updated Social Media"
                  client="ImagineSpace Ltd"
                  time="4 hours"
                />
              </div>
            </div>
          </section>

          {/* Performance Analytics */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">Performance Analytics</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-lg p-6" style={{ background: 'var(--card-bg)', border: 'var(--card-border-width) solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
                <h3 className="text-sm font-semibold text-foreground mb-4">Department Performance</h3>
                <div className="space-y-4">
                  {departmentPerformance.map((dept) => (
                    <div key={dept.name}>
                      <div className="flex justify-between mb-2">
                        <span className="text-xs text-muted-foreground">{dept.name}</span>
                        <span className="text-xs font-semibold text-foreground">{dept.value}%</span>
                      </div>
                      <Progress value={dept.value} className="h-2" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg p-6" style={{ background: 'var(--card-bg)', border: 'var(--card-border-width) solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
                <h3 className="text-sm font-semibold text-foreground mb-4">Task Completion Trends</h3>
                <div className="space-y-4">
                  <div className="bg-sidebar border border-border rounded-lg p-4">
                    <p className="text-sm text-foreground font-medium">9 tasks due by end of week</p>
                    <p className="text-xs text-muted-foreground mt-1">Stay on track with upcoming deadlines</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Strategy Department</span>
                      <span className="text-foreground">3 tasks</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Marketing Department</span>
                      <span className="text-foreground">2 tasks</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Sales Department</span>
                      <span className="text-foreground">4 tasks</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
