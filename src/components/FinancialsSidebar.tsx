import { NavLink, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  PiggyBank,
  LayoutDashboard,
  LineChart,
  FolderKanban,
  FileText,
  ArrowLeft,
  Users,
} from "lucide-react";
import { useSidebarToggle } from "@/hooks/use-sidebar-toggle";
import { SidebarUserPanel } from "@/components/SidebarUserPanel";

export const FinancialsSidebar = () => {
  const navigate = useNavigate();
  const { clientId } = useParams();
  const { isOpen } = useSidebarToggle();

  const sections = [
    {
      label: "MAIN DASHBOARD",
      items: [
        { title: "Overview", path: `/client/${clientId}/financials`, icon: LayoutDashboard },
        { title: "Analytics", path: `/client/${clientId}/financials/analytics`, icon: LineChart },
        { title: "Projects", path: `/client/${clientId}/financials/projects`, icon: FolderKanban },
        { title: "Financial Agents", path: `/client/${clientId}/financials/agents`, icon: Users },
      ],
    },
    {
      label: "REPORTING",
      items: [{ title: "Reports", path: `/client/${clientId}/financials/reports`, icon: FileText }],
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
      <div 
        className="p-6"
        style={{ borderBottom: '1px solid var(--divider-color)' }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="flex h-10 w-10 items-center justify-center rounded-lg shrink-0"
            style={{ background: 'var(--sidebar-active-bg)', opacity: 0.2 }}
          >
            <PiggyBank className="h-6 w-6" style={{ color: 'var(--sidebar-active-bg)' }} />
          </div>
          <h1 className="text-xl font-bold whitespace-nowrap" style={{ color: 'var(--sidebar-text)' }}>FinOps Suite</h1>
        </div>
      </div>

      <div className="px-4 pt-4">
        <Button
          variant="outline"
          onClick={() => navigate(`/client/${clientId}`)}
          className="w-full justify-start gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="truncate">Client Dashboard</span>
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-6">
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
                    end={item.path === `/client/${clientId}/financials`}
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
