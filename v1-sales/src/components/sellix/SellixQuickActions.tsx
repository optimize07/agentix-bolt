import { Button } from "@/components/ui/button";
import { TrendingUp, Target, Users, Lightbulb } from "lucide-react";

interface SellixQuickActionsProps {
  onSelectAction: (prompt: string) => void;
  compact?: boolean;
}

const quickActions = [
  {
    label: "Team Performance",
    prompt: "How's my team performing this week? Show me key metrics and insights.",
    icon: Users,
  },
  {
    label: "Hit My Targets",
    prompt: "What should I focus on to hit my targets this month? Give me 3 actionable strategies.",
    icon: Target,
  },
  {
    label: "Analyze Trends",
    prompt: "Analyze my close rate trends and identify any patterns or opportunities.",
    icon: TrendingUp,
  },
  {
    label: "Sales Strategy",
    prompt: "Suggest sales strategies specific to my industry and current pipeline.",
    icon: Lightbulb,
  },
];

export const SellixQuickActions = ({ onSelectAction, compact = false }: SellixQuickActionsProps) => {
  if (compact) {
    return (
      <div className="flex gap-2 flex-wrap">
        {quickActions.map((action) => (
          <Button
            key={action.label}
            variant="outline"
            size="sm"
            onClick={() => onSelectAction(action.prompt)}
            className="gap-2"
          >
            <action.icon className="w-3 h-3" />
            {action.label}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 mt-6">
      {quickActions.map((action) => (
        <Button
          key={action.label}
          variant="outline"
          onClick={() => onSelectAction(action.prompt)}
          className="h-auto py-4 flex flex-col items-start gap-2"
        >
          <action.icon className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium">{action.label}</span>
        </Button>
      ))}
    </div>
  );
};
