import { useNavigate, useParams } from "react-router-dom";
import { ChevronDown, Gauge, LogOut, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser, usePermissions } from "@/contexts/UserContext";

export const SidebarUserPanel = () => {
  const navigate = useNavigate();
  const { clientId } = useParams();
  const { user, profile, signOut, isAgencyAdmin } = useUser();
  const { canAccessAdminPanel } = usePermissions();

  // Get user initials for avatar
  const userInitials = profile?.display_name
    ? profile.display_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || "U";

  async function handleSignOut() {
    await signOut();
    navigate("/auth");
  }

  return (
    <div 
      className="p-4"
      style={{ borderTop: '1px solid var(--divider-color)' }}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button 
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors"
            style={{ color: 'var(--sidebar-text)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--sidebar-hover-bg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <div 
              className="flex h-8 w-8 items-center justify-center rounded-full"
              style={{ background: 'var(--sidebar-active-bg)', opacity: 0.6 }}
            >
              <span className="text-xs font-semibold" style={{ color: 'var(--sidebar-active-text)' }}>
                {userInitials}
              </span>
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
        <DropdownMenuContent align="end" className="w-56 bg-popover">
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
  );
};
