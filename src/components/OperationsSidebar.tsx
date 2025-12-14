import { NavLink, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Wrench,
  LayoutDashboard,
  LineChart,
  FolderKanban,
  Users,
  ArrowLeft,
  Workflow,
  Cog,
  ShieldCheck,
  Brain,
} from "lucide-react";
import { useSidebarToggle } from "@/hooks/use-sidebar-toggle";
import { SidebarUserPanel } from "@/components/SidebarUserPanel";

export const OperationsSidebar = () => {
  const navigate = useNavigate();
  const { clientId } = useParams();
  const { isOpen } = useSidebarToggle();

  const navigationSections = [
    {
      label: "MAIN DASHBOARD",
      items: [
        { title: "Overview", path: `/client/${clientId}/operations`, icon: LayoutDashboard },
        { title: "Analytics", path: `/client/${clientId}/operations/analytics`, icon: LineChart },
        { title: "Projects", path: `/client/${clientId}/operations/projects`, icon: FolderKanban },
        { title: "Operations Agents", path: `/client/${clientId}/operations/agents`, icon: Users },
      ],
    },
    {
      label: "PROCESS AUTOMATION",
      items: [
        { title: "Process Automation", path: `/client/${clientId}/operations/automation`, icon: Cog },
        { title: "Resource Optimization", path: `/client/${clientId}/operations/resource-optimization`, icon: Workflow },
        { title: "Quality Control", path: `/client/${clientId}/operations/quality-control`, icon: ShieldCheck },
      ],
    },
    {
      label: "RESOURCES",
      items: [
        { title: "Central Brain", path: `/client/${clientId}/central-brain`, icon: Brain },
      ],
    },
  ];

  return (
    <aside 
      className={`${isOpen ? "flex" : "hidden"} h-screen min-w-64 w-64 flex-col shrink-0`}
      style={{
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--divider-color)',
        color: 'var(--sidebar-text)',
      }}
    >
      {/* Header with Logo */}
      <div 
        className="p-6"
        style={{ borderBottom: '1px solid var(--divider-color)' }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="flex h-10 w-10 items-center justify-center rounded-lg shrink-0"
            style={{ background: 'var(--sidebar-active-bg)', opacity: 0.2 }}
          >
            <Wrench className="h-6 w-6" style={{ color: 'var(--sidebar-active-bg)' }} />
          </div>
          <h1 className="text-xl font-bold whitespace-nowrap" style={{ color: 'var(--sidebar-text)' }}>Operations</h1>
        </div>
      </div>

      {/* Back to Client Dashboard */}
      <div className="px-4 pt-4 relative z-0">
        <Button
          variant="outline"
          onClick={() => navigate(`/client/${clientId}`)}
          className="w-full justify-start gap-2"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          <span className="truncate">Client Dashboard</span>
        </Button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 scrollbar-hide relative z-10">
        <div className="space-y-4">
          {navigationSections.map((section) => (
            <div key={section.label} className="space-y-1">
              <div 
                className="px-3 py-2 text-xs font-semibold"
                style={{ color: 'var(--sidebar-text)', opacity: 0.6 }}
              >
                {section.label}
              </div>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === `/client/${clientId}/operations`}
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors"
                    style={({ isActive }) => ({
                      background: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
                      color: isActive ? 'var(--sidebar-active-text)' : 'var(--sidebar-text)',
                    })}
                    onMouseEnter={(e) => {
                      const isActive = e.currentTarget.getAttribute('aria-current') === 'page';
                      if (!isActive) {
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
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.title}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* User Profile Panel */}
      <SidebarUserPanel />
    </aside>
  );
};
