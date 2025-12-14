import { useState, useEffect } from "react";
import {
  Hexagon,
  Gauge,
  Users,
  CheckSquare,
  Activity,
  FileText,
  Settings,
  Bell,
  ArrowLeftRight,
  ChevronUp,
  Building2,
  Loader2,
  Brain,
  ToggleLeft,
  LogOut
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebarToggle } from "@/hooks/use-sidebar-toggle";
import { listClients, type Client } from "@/integrations/clients/api";
import { useUser } from "@/contexts/UserContext";

// Main Dashboard section
const mainDashboardItems = [
  { id: "agency-pulse", title: "Agency Pulse", icon: Gauge, path: "/admin" },
  { id: "reports", title: "Reports", icon: FileText, path: "/admin/reports" },
  { id: "client-management", title: "Client Management", icon: Users, path: "/admin/clients" },
  { id: "feature-toggles", title: "Feature Toggles", icon: ToggleLeft, path: "/admin/feature-toggles" },
];

// Agent Health section
const agentHealthItems = [
  { id: "department-health", title: "Department Health", icon: Activity, path: "/admin/departments" },
  { id: "task-orchestration", title: "Task Orchestration", icon: CheckSquare, path: "/admin/tasks" },
  { id: "agent-runs", title: "Agent Runs", icon: Brain, path: "/admin/agent-runs" },
];

// Quick Access section
const quickAccessItems = [
  { id: "central-brain", title: "Central Brain", icon: Brain, path: "/admin/central-brain" },
  { id: "notifications", title: "Notifications", icon: Bell, path: "/admin/notifications" },
  { id: "settings", title: "Settings", icon: Settings, path: "/admin/settings" },
  { id: "client-view", title: "Switch to Client View", icon: ArrowLeftRight, path: "/" },
];

export const AdminSidebar = () => {
  const [selectedClient, setSelectedClient] = useState("all");
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const navigate = useNavigate();
  const { isOpen } = useSidebarToggle();
  const { user, profile, signOut, isAgencyAdmin } = useUser();

  // Get user initials for avatar
  const userInitials = profile?.display_name 
    ? profile.display_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || 'AU';

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  useEffect(() => {
    loadClients();
  }, []);

  async function loadClients() {
    try {
      const data = await listClients();
      setClients(data);
    } catch (e) {
      console.error("Failed to load clients:", e);
      setClients([]);
    } finally {
      setLoadingClients(false);
    }
  }

  const handleClientChange = (clientId: string) => {
    setSelectedClient(clientId);
    
    if (clientId === "all") {
      navigate("/admin");
    } else {
      // clientId is the slug
      navigate(`/client/${clientId}`);
    }
  };

  const renderNavItem = (item: typeof mainDashboardItems[0]) => (
    <NavLink
      key={item.id}
      to={item.path}
      end={item.path === "/admin"}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs transition-colors"
      style={({ isActive }) => ({
        background: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
        color: isActive ? 'var(--sidebar-active-text)' : 'var(--sidebar-text)',
      })}
      onMouseEnter={(e) => {
        if (!e.currentTarget.classList.contains('active')) {
          e.currentTarget.style.background = 'var(--sidebar-hover-bg)';
        }
      }}
      onMouseLeave={(e) => {
        const isActive = e.currentTarget.getAttribute('aria-current') === 'page';
        if (!isActive) {
          e.currentTarget.style.background = 'transparent';
        }
      }}
    >
      <item.icon className="h-4 w-4" />
      <span>{item.title}</span>
    </NavLink>
  );

  return (
    <aside 
      className={`${isOpen ? "flex" : "hidden"} h-screen w-64 flex-col`}
      style={{
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--divider-color)',
        color: 'var(--sidebar-text)',
      }}
    >
      {/* Brand Header */}
      <div 
        className="p-6"
        style={{ borderBottom: '1px solid var(--divider-color)' }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ background: 'var(--sidebar-active-bg)' }}
          >
            <Hexagon className="h-5 w-5" style={{ color: 'var(--sidebar-active-text)' }} />
          </div>
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--sidebar-text)' }}>Agentix</h2>
          </div>
        </div>
      </div>

      {/* Client Switcher */}
      <div 
        className="px-3 py-4"
        style={{ borderBottom: '1px solid var(--divider-color)' }}
      >
        <Select value={selectedClient} onValueChange={handleClientChange} disabled={loadingClients}>
          <SelectTrigger 
            className="w-full text-sm h-10"
            style={{
              background: 'var(--sidebar-bg)',
              borderColor: 'var(--divider-color)',
              color: 'var(--sidebar-text)',
            }}
          >
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {loadingClients ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <SelectValue placeholder="Select client" />
              )}
            </div>
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="all">
              <div className="flex flex-col">
                <span className="text-sm font-medium">All Clients</span>
                <span className="text-xs text-muted-foreground">Overview</span>
              </div>
            </SelectItem>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.slug}>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{client.name}</span>
                  {client.type && (
                    <span className="text-xs text-muted-foreground">{client.type}</span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        {/* Main Dashboard Section */}
        <div className="mb-4">
          <p 
            className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--sidebar-text)', opacity: 0.6 }}
          >
            Main Dashboard
          </p>
          <nav className="space-y-1">
            {mainDashboardItems.map(renderNavItem)}
          </nav>
        </div>

        {/* Agent Health Section */}
        <div className="mb-4">
          <p 
            className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--sidebar-text)', opacity: 0.6 }}
          >
            Agent Health
          </p>
          <nav className="space-y-1">
            {agentHealthItems.map(renderNavItem)}
          </nav>
        </div>

        {/* Quick Access Section */}
        <div className="mt-6">
          <p 
            className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--sidebar-text)', opacity: 0.6 }}
          >
            Quick Access
          </p>
          <nav className="space-y-1">
            {quickAccessItems.map(renderNavItem)}
          </nav>
        </div>
      </ScrollArea>

      {/* User Profile */}
      <div 
        className="p-4"
        style={{ borderTop: '1px solid var(--divider-color)' }}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors"
              style={{ color: 'var(--sidebar-text)' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--sidebar-hover-bg)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div 
                className="flex h-8 w-8 items-center justify-center rounded-full"
                style={{ background: 'var(--sidebar-active-bg)', opacity: 0.2 }}
              >
                <span 
                  className="text-xs font-semibold"
                  style={{ color: 'var(--sidebar-active-bg)' }}
                >
                  {userInitials}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--sidebar-text)' }}>
                  {profile?.display_name || user?.email || "Admin User"}
                </p>
                <p className="text-xs capitalize" style={{ color: 'var(--sidebar-text)', opacity: 0.6 }}>
                  {isAgencyAdmin ? "Agency Admin" : "Premium Plan"}
                </p>
              </div>
              <ChevronUp className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--sidebar-text)', opacity: 0.6 }} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuItem onClick={() => navigate("/admin/settings")}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
};