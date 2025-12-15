import { NavLink } from "@/components/NavLink";
import { LayoutDashboard, BarChart3, FolderKanban, Bot, Sparkles, Lightbulb, Target, TrendingUp, Search, Gauge, Brain, Image } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function AppSidebar() {
  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col relative z-20 pointer-events-auto">
      <div className="p-4 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <LayoutDashboard className="w-5 h-5 text-primary-foreground" />
        </div>
        <h1 className="text-xl font-bold text-foreground">AdPilot</h1>
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
            to="/analytics"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted/50 transition-colors"
            activeClassName="bg-primary/20 text-primary font-medium"
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </NavLink>
          <NavLink
            to="/projects"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted/50 transition-colors"
            activeClassName="bg-primary/20 text-primary font-medium"
          >
            <FolderKanban className="w-4 h-4" />
            Projects
          </NavLink>
        </div>

        <Separator />

        {/* AD LAUNCHER */}
        <div className="my-4">
          <div className="text-xs font-semibold text-muted-foreground px-3 py-2">
            AD LAUNCHER
          </div>
          <NavLink
            to="/ad-creator"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted/50 transition-colors"
            activeClassName="bg-primary/20 text-primary font-medium"
          >
            <Sparkles className="w-4 h-4" />
            Ad Creator
          </NavLink>
          <NavLink
            to="/ai-cmo"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted/50 transition-colors"
            activeClassName="bg-primary/20 text-primary font-medium"
          >
            <Lightbulb className="w-4 h-4" />
            AI CMO
          </NavLink>
          <NavLink
            to="/campaigns"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted/50 transition-colors"
            activeClassName="bg-primary/20 text-primary font-medium"
          >
            <Target className="w-4 h-4" />
            Campaign Manager
          </NavLink>
        </div>

        <Separator />

        {/* AD RESEARCH */}
        <div className="my-4">
          <div className="text-xs font-semibold text-muted-foreground px-3 py-2">
            AD RESEARCH
          </div>
          <NavLink
            to="/ad-spy"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted/50 transition-colors"
            activeClassName="bg-primary/20 text-primary font-medium"
          >
            <Search className="w-4 h-4" />
            Ad Spy
          </NavLink>
          <NavLink
            to="/ad-optimizer"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted/50 transition-colors"
            activeClassName="bg-primary/20 text-primary font-medium"
          >
            <Gauge className="w-4 h-4" />
            Ad Optimizer
          </NavLink>
          <NavLink
            to="/market-research"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted/50 transition-colors"
            activeClassName="bg-primary/20 text-primary font-medium"
          >
            <TrendingUp className="w-4 h-4" />
            Market Research
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
