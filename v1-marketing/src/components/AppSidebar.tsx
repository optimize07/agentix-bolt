import { NavLink } from "@/components/NavLink";
import { LayoutDashboard, Calendar, Rocket, FolderKanban, Lightbulb, Bot, Tag, FileText, GitBranch, Brain } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function AppSidebar() {
  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col relative z-20 pointer-events-auto">
      <div className="p-4 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <LayoutDashboard className="w-5 h-5 text-primary-foreground" />
        </div>
        <h1 className="text-xl font-bold text-foreground">InterestMedia</h1>
      </div>

      <Separator />

      <div className="flex-1 overflow-y-auto p-2">
        {/* MAIN DASHBOARD */}
        <div className="mb-4">
          <div className="text-xs font-semibold text-muted-foreground px-3 py-2">
            MAIN DASHBOARD
          </div>
          <NavLink
            to="/overview"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted/50 transition-colors"
            activeClassName="bg-primary/20 text-primary font-medium"
          >
            <LayoutDashboard className="w-4 h-4" />
            Overview
          </NavLink>
          <NavLink
            to="/calendar"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted/50 transition-colors"
            activeClassName="bg-primary/20 text-primary font-medium"
          >
            <Calendar className="w-4 h-4" />
            Calendar
          </NavLink>
          <NavLink
            to="/launch"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted/50 transition-colors"
            activeClassName="bg-primary/20 text-primary font-medium"
          >
            <Rocket className="w-4 h-4" />
            Launch
          </NavLink>
        </div>

        <Separator />

        {/* STUDIO */}
        <div className="my-4">
          <div className="text-xs font-semibold text-muted-foreground px-3 py-2">
            STUDIO
          </div>
          <NavLink
            to="/projects"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted/50 transition-colors"
            activeClassName="bg-primary/20 text-primary font-medium"
          >
            <FolderKanban className="w-4 h-4" />
            Boards
          </NavLink>
          <NavLink
            to="/ideation"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted/50 transition-colors"
            activeClassName="bg-primary/20 text-primary font-medium"
          >
            <Lightbulb className="w-4 h-4" />
            Ideation
          </NavLink>
          <NavLink
            to="/ai-cmo"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted/50 transition-colors"
            activeClassName="bg-primary/20 text-primary font-medium"
          >
            <Bot className="w-4 h-4" />
            AI CMO
          </NavLink>
        </div>

        <Separator />

        {/* CAMPAIGNS */}
        <div className="my-4">
          <div className="text-xs font-semibold text-muted-foreground px-3 py-2">
            CAMPAIGNS
          </div>
          <NavLink
            to="/offers"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted/50 transition-colors"
            activeClassName="bg-primary/20 text-primary font-medium"
          >
            <Tag className="w-4 h-4" />
            Offer
          </NavLink>
          <NavLink
            to="/copy"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted/50 transition-colors"
            activeClassName="bg-primary/20 text-primary font-medium"
          >
            <FileText className="w-4 h-4" />
            Copy
          </NavLink>
          <NavLink
            to="/funnel"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted/50 transition-colors"
            activeClassName="bg-primary/20 text-primary font-medium"
          >
            <GitBranch className="w-4 h-4" />
            Funnel
          </NavLink>
        </div>

        <Separator />

        {/* CENTRAL BRAIN */}
        <div className="my-4">
          <div className="text-xs font-semibold text-muted-foreground px-3 py-2">
            CENTRAL BRAIN
          </div>
          <NavLink
            to="/central-brain"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted/50 transition-colors"
            activeClassName="bg-primary/20 text-primary font-medium"
          >
            <Brain className="w-4 h-4" />
            Central Brain
          </NavLink>
        </div>
      </div>
    </aside>
  );
}
