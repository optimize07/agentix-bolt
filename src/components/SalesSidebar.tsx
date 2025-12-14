import { NavLink, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Users,
  LayoutDashboard,
  ArrowLeft,
  LineChart,
  FolderKanban,
  Workflow,
  Phone,
  Plug,
  Brain,
  Settings as Gear,
} from "lucide-react";
import { useSidebarToggle } from "@/hooks/use-sidebar-toggle";
import { SidebarUserPanel } from "@/components/SidebarUserPanel";

export const SalesSidebar = () => {
  const navigate = useNavigate();
  const { clientId } = useParams();
  const { isOpen } = useSidebarToggle();

  const sections = [
    {
      label: "MAIN DASHBOARD",
      items: [
        { title: "Dashboard", path: `/client/${clientId}/sales`, icon: LayoutDashboard },
        { title: "Analytics", path: `/client/${clientId}/sales/analytics`, icon: LineChart },
        { title: "Projects", path: `/client/${clientId}/sales/projects`, icon: FolderKanban },
        { title: "Sales Agents", path: `/client/${clientId}/sales/agents`, icon: Users },
      ],
    },
    {
      label: "SALES ENABLEMENT",
      items: [
        { title: "Pipeline Manager", path: `/client/${clientId}/sales/pipeline`, icon: Workflow },
        { title: "Call Scripts", path: `/client/${clientId}/sales/call-scripts`, icon: Phone },
      ],
    },
    {
      label: "RESOURCES",
      items: [
        { title: "Central Brain", path: `/client/${clientId}/central-brain`, icon: Brain },
        { title: "Sales Settings", path: `/client/${clientId}/sales/settings`, icon: Gear },
      ],
    },
  ];

  return (
    <aside 
      className={`${isOpen ? "flex" : "hidden"} h-screen min-w-64 w-64 shrink-0 flex-col`}
      style={{
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--divider-color)',
        color: 'var(--sidebar-text)',
      }}
    >
      {/* Header */}
      <div 
        className="p-6"
        style={{ borderBottom: '1px solid var(--divider-color)' }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ background: 'var(--sidebar-active-bg)', opacity: 0.2 }}
          >
            <Users className="h-6 w-6" style={{ color: 'var(--sidebar-active-bg)' }} />
          </div>
          <h1 className="whitespace-nowrap text-xl font-bold" style={{ color: 'var(--sidebar-text)' }}>Sales HQ</h1>
        </div>
      </div>

      {/* Back to Client Dashboard */}
      <div className="relative z-0 px-4 pt-4">
        <Button
          variant="outline"
          onClick={() => navigate(`/client/${clientId}`)}
          className="w-full justify-start gap-2"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          <span className="truncate">Client Dashboard</span>
        </Button>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex-1 overflow-y-auto px-4 py-6 scrollbar-hide">
        <div className="space-y-4">
          {sections.map((section) => (
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
                    end={item.path === `/client/${clientId}/sales`}
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
