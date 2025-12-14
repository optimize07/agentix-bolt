import {
  Hexagon,
  LayoutDashboard,
  // Shield, // TODO: Re-enable when System Control is implemented
  FolderKanban,
  Brain,
  ChevronDown,
  Gauge,
  Settings,
  LogOut,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NavLink, useParams, useNavigate } from "react-router-dom";
import { departmentsData } from "@/data/departments";
import { useSidebarToggle } from "@/hooks/use-sidebar-toggle";
import { useAllFeatureToggles } from "@/hooks/useFeatureToggle";
import { useUser, usePermissions } from "@/contexts/UserContext";

export const ChatSidebar = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { isOpen } = useSidebarToggle();
  const { isEnabled, loading: loadingFeatures } = useAllFeatureToggles(clientId);
  const { user, profile, signOut, isAgencyAdmin } = useUser();
  const { canAccessAdminPanel } = usePermissions();

  // Filter departments based on feature toggles
  const enabledDepartments = departmentsData.filter((dept) => {
    if (loadingFeatures) return true; // Show all while loading
    const featureKey = `department.${dept.id}`;
    return isEnabled(featureKey);
  });

  const navigationItems = [
    { id: "dashboard", title: "Dashboard", icon: LayoutDashboard, path: `/client/${clientId}`, agents: [], featureKey: null },
    ...enabledDepartments.map(dept => ({
      id: dept.id,
      title: dept.title,
      icon: dept.icon,
      path: `/client/${clientId}/${dept.id}`,
      agents: dept.agents,
      featureKey: `department.${dept.id}`,
    })),
  ];

  // Filter quick access items based on feature toggles
  const allQuickAccessItems = [
    { id: "projects", title: "Projects", icon: FolderKanban, path: `/client/${clientId}/projects`, featureKey: "feature.projects" },
    { id: "central-brain", title: "Central Brain", icon: Brain, path: `/client/${clientId}/central-brain`, featureKey: "feature.knowledge-base" },
    { id: "launch", title: "Agentix AI", icon: Sparkles, path: `/client/${clientId}/launch`, featureKey: "feature.launch" },
  ];

  const quickAccessItems = allQuickAccessItems.filter((item) => {
    if (!item.featureKey) return true;
    if (loadingFeatures) return true;
    return isEnabled(item.featureKey);
  });

  const adminItems = [
    { id: "admin", title: "Admin Panel", icon: Gauge, path: "/admin" },
  ];

  async function handleSignOut() {
    await signOut();
    navigate("/auth");
  }

  // Get user initials for avatar
  const userInitials = profile?.display_name
    ? profile.display_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || "U";

  return (
    <aside 
      className={`${isOpen ? "flex" : "hidden"} h-screen w-64 flex-col shrink-0`}
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
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70">
            <Hexagon className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--sidebar-text)' }}>Agentix</h2>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navigationItems.map((item) => {
            const hasDepartmentAgents = item.agents && item.agents.length > 0;
            
            const navLinkContent = (isActive: boolean) => (
              <div
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-white/5"
                }`}
                style={{
                  color: isActive ? undefined : 'var(--sidebar-text)',
                  opacity: isActive ? 1 : 0.7,
                }}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </div>
            );

            return hasDepartmentAgents ? (
              <HoverCard key={item.id} openDelay={2000}>
                <HoverCardTrigger asChild>
                  <NavLink to={item.path}>
                    {({ isActive }) => navLinkContent(isActive)}
                  </NavLink>
                </HoverCardTrigger>
                <HoverCardContent side="right" className="w-64">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-foreground">{item.title} Agents</h4>
                    <div className="space-y-1">
                      {item.agents.map((agent, idx) => (
                        <div key={idx} className="text-xs text-muted-foreground">
                          • {agent.name}
                        </div>
                      ))}
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
            ) : (
              <NavLink key={item.id} to={item.path} end={item.id === "dashboard"}>
                {({ isActive }) => navLinkContent(isActive)}
              </NavLink>
            );
          })}
        </nav>

        {/* Quick Access Section */}
        <div className="mt-6">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--sidebar-text)', opacity: 0.5 }}>
            Quick Access
          </p>
          <nav className="space-y-1">
            {quickAccessItems.map((item) => (
              <NavLink
                key={item.id}
                to={item.path}
                className={({ isActive }) =>
                  `flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-white/5"
                  }`
                }
                style={({ isActive }) => ({
                  color: isActive ? undefined : 'var(--sidebar-text)',
                  opacity: isActive ? 1 : 0.7,
                })}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {canAccessAdminPanel && (
          <div className="mt-6">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--sidebar-text)', opacity: 0.5 }}>
              Administration
            </p>
            <nav className="space-y-1">
              {adminItems.map((item) => (
                <NavLink
                  key={item.id}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-white/5"
                    }`
                  }
                  style={({ isActive }) => ({
                    color: isActive ? undefined : 'var(--sidebar-text)',
                    opacity: isActive ? 1 : 0.7,
                  })}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        )}
      </ScrollArea>

      {/* User Profile */}
      <div className="p-4" style={{ borderTop: '1px solid var(--divider-color)' }}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-white/5"
              style={{ color: 'var(--sidebar-text)' }}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                <span className="text-xs font-semibold text-primary">{userInitials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--sidebar-text)' }}>
                  {profile?.display_name || user?.email || "User"}
                </p>
                <p className="text-xs capitalize" style={{ color: 'var(--sidebar-text)', opacity: 0.6 }}>
                  {isAgencyAdmin ? "Agency Admin" : "Client User"}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--sidebar-text)', opacity: 0.6 }} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => navigate(`/client/${clientId}/settings`)}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </DropdownMenuItem>
            {canAccessAdminPanel && (
              <DropdownMenuItem onClick={() => navigate("/admin")}>
                <Gauge className="h-4 w-4 mr-2" />
                Admin Panel
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
};
