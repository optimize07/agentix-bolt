import { Settings, LogOut, ChartLine, Gauge, Building2, BarChart3, Bolt, Keyboard, Target, Trophy, FileText, Bot, Sparkles } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useTheme, generateGradientCSS } from "@/contexts/ThemeContext";
import { PermissionGate } from "@/components/PermissionGate";
import { toast } from "sonner";
import { useState } from "react";
import { SellixChatDialog } from "@/components/sellix/SellixChatDialog";

interface SidebarProps {
  saveStatus?: {
    state: 'idle' | 'saving' | 'saved' | 'error';
    lastSaved?: Date;
    error?: string;
  };
}

const Sidebar = ({ saveStatus }: SidebarProps) => {
  const { user, role, loading: orgLoading } = useOrganization();
  const { effectiveMode, lightSidebarConfig, darkSidebarConfig } = useTheme();
  const [sellixOpen, setSellixOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const sidebarConfig = effectiveMode === 'dark' ? darkSidebarConfig : lightSidebarConfig;
  const sidebarStyle = sidebarConfig.gradient.enabled
    ? { background: generateGradientCSS(sidebarConfig.gradient) }
    : { backgroundColor: sidebarConfig.colors.background };

  const getNavLinkStyle = (path: string, isActive: boolean) => ({
    color: isActive ? sidebarConfig.colors.activeText : sidebarConfig.colors.text,
    backgroundColor: isActive
      ? sidebarConfig.colors.activeBackground
      : hoveredItem === path
        ? sidebarConfig.colors.hoverBackground
        : 'transparent',
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
  };

  return (
    <aside 
      className="fixed left-0 top-0 bottom-0 w-64 flex flex-col z-50"
      style={{
        ...sidebarStyle,
        borderRight: `var(--divider-width) var(--divider-style) var(--divider-color)`
      }}
    >
      <div 
        className="px-6 py-4"
        style={{ borderBottom: `var(--divider-width) var(--divider-style) var(--divider-color)` }}
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <ChartLine className="text-primary-foreground" size={20} />
          </div>
          <h2 className="font-bold text-xl text-foreground">Sales</h2>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4 px-3">
        <div className="mb-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Main</p>
          <PermissionGate required="dashboard.view">
          <NavLink 
            to="/" 
            className="flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all mb-1"
            activeClassName="font-semibold"
            onMouseEnter={() => setHoveredItem("/")}
            onMouseLeave={() => setHoveredItem(null)}
            style={({ isActive }) => getNavLinkStyle("/", isActive)}
          >
              <Gauge size={20} />
              <span className="text-sm font-medium">Dashboard</span>
            </NavLink>
            <NavLink 
              to="/analytics" 
              className="flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all mb-1"
              activeClassName="font-semibold"
              onMouseEnter={() => setHoveredItem("/analytics")}
              onMouseLeave={() => setHoveredItem(null)}
              style={({ isActive }) => getNavLinkStyle("/analytics", isActive)}
            >
              <BarChart3 size={20} />
              <span className="text-sm font-medium">Analytics</span>
            </NavLink>
            <NavLink 
              to="/actions" 
              className="flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all mb-1"
              activeClassName="font-semibold"
              onMouseEnter={() => setHoveredItem("/actions")}
              onMouseLeave={() => setHoveredItem(null)}
              style={({ isActive }) => getNavLinkStyle("/actions", isActive)}
            >
              <Bolt size={20} />
              <span className="text-sm font-medium">Actions</span>
            </NavLink>
          </PermissionGate>
        </div>

        <PermissionGate required="dashboard.edit">
          <div className="mb-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Sales</p>
            <NavLink 
              to="/data-entry" 
              className="flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all mb-1"
              activeClassName="font-semibold"
              onMouseEnter={() => setHoveredItem("/data-entry")}
              onMouseLeave={() => setHoveredItem(null)}
              style={({ isActive }) => getNavLinkStyle("/data-entry", isActive)}
            >
              <Keyboard size={20} />
              <span className="text-sm font-medium">Data Entry</span>
            </NavLink>
            <NavLink 
              to="/targets" 
              className="flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all mb-1"
              activeClassName="font-semibold"
              onMouseEnter={() => setHoveredItem("/targets")}
              onMouseLeave={() => setHoveredItem(null)}
              style={({ isActive }) => getNavLinkStyle("/targets", isActive)}
            >
              <Target size={20} />
              <span className="text-sm font-medium">Targets</span>
            </NavLink>
            <NavLink 
              to="/leaderboards" 
              className="flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all mb-1"
              activeClassName="font-semibold"
              onMouseEnter={() => setHoveredItem("/leaderboards")}
              onMouseLeave={() => setHoveredItem(null)}
              style={({ isActive }) => getNavLinkStyle("/leaderboards", isActive)}
            >
              <Trophy size={20} />
              <span className="text-sm font-medium">Leaderboards</span>
            </NavLink>
          </div>
        </PermissionGate>

        <PermissionGate required="settings.view">
          <div className="mb-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Settings</p>
            <NavLink 
              to="/settings" 
              className="flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all"
              activeClassName="font-semibold"
              onMouseEnter={() => setHoveredItem("/settings")}
              onMouseLeave={() => setHoveredItem(null)}
              style={({ isActive }) => getNavLinkStyle("/settings", isActive)}
            >
              <Settings size={20} />
              <span className="text-sm font-medium">Settings</span>
            </NavLink>
          </div>
        </PermissionGate>
      </div>

      <div 
        className="px-3 py-2"
        style={{ borderTop: `var(--divider-width) var(--divider-style) var(--divider-color)` }}
      >
        <Button
          onClick={() => setSellixOpen(true)}
          className="w-full justify-start gap-3 bg-card border-2 border-primary text-foreground hover:bg-muted"
        >
          <Bot size={20} />
          <span className="font-medium">Sellix</span>
          <Badge variant="secondary" className="ml-auto gap-1">
            <Sparkles className="w-3 h-3" />
            AI
          </Badge>
        </Button>
      </div>

      <div 
        className="p-4 space-y-2"
        style={{ borderTop: `var(--divider-width) var(--divider-style) var(--divider-color)` }}
      >
        <div className="flex items-center space-x-3 px-3 py-2">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">
              {orgLoading ? "?" : user?.email?.[0].toUpperCase() || "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {orgLoading ? "Loading..." : user?.email || "User"}
            </p>
            {role && (
              <Badge variant="secondary" className="text-xs mt-1">
                {role.name}
              </Badge>
            )}
          </div>
        </div>
        <Button 
          variant="default" 
          size="sm" 
          onClick={handleLogout}
          className="w-full justify-start"
        >
          <LogOut size={16} className="mr-2" />
          Logout
        </Button>
      </div>

      <SellixChatDialog open={sellixOpen} onOpenChange={setSellixOpen} />
    </aside>
  );
};

export default Sidebar;
