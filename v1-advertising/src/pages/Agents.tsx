import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Sparkles, Lightbulb, Search, Gauge, Brain } from "lucide-react";

export default function Agents() {
  const agents = [
    {
      name: "Ad Creator",
      icon: Sparkles,
      description: "Generate high-converting ad creatives using AI",
      status: "Active",
    },
    {
      name: "AI CMO",
      icon: Lightbulb,
      description: "Strategic marketing insights and campaign planning",
      status: "Active",
    },
    {
      name: "Ad Spy",
      icon: Search,
      description: "Research competitor ads and market trends",
      status: "Active",
    },
    {
      name: "Ad Optimizer",
      icon: Gauge,
      description: "Optimize ad performance with data-driven suggestions",
      status: "Active",
    },
    {
      name: "Knowledge Agent",
      icon: Brain,
      description: "Learn from your winning ads and brand guidelines",
      status: "Active",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Advertising Agents</h1>
        <p className="text-muted-foreground">Your AI-powered advertising team</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <Card key={agent.name} className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <agent.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{agent.name}</CardTitle>
                  <p className="text-xs text-primary">{agent.status}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{agent.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
