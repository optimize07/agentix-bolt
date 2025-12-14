import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { ChevronDown, Copy, TrendingUp, Eye, MousePointer, DollarSign } from "lucide-react";

interface TopPerformerCardProps {
  performer: any;
  iteration: any;
  rank: number;
}

const TopPerformerCard = ({ performer, iteration, rank }: TopPerformerCardProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const metrics = performer.performance_metrics;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const metricCards = [
    { label: "ROAS", value: `${metrics.roas.toFixed(2)}x`, icon: DollarSign, color: "text-green-500" },
    { label: "CTR", value: `${metrics.ctr.toFixed(2)}%`, icon: MousePointer, color: "text-primary" },
    { label: "Impressions", value: metrics.impressions.toLocaleString(), icon: Eye, color: "text-accent" },
    { label: "Conversions", value: metrics.conversions, icon: TrendingUp, color: "text-orange-500" },
  ];

  return (
    <Card className="p-6 bg-card border-border">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-primary text-primary">
                Rank #{rank}
              </Badge>
              <h3 className="text-lg font-semibold text-foreground">{performer.ad_name}</h3>
            </div>
            <p className="text-sm text-muted-foreground">Ad ID: {performer.ad_id}</p>
          </div>
          
          {performer.thumbnail_url && (
            <img 
              src={performer.thumbnail_url} 
              alt="Ad thumbnail"
              className="w-24 h-24 object-cover rounded-lg border border-border"
            />
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metricCards.map((metric) => (
            <div key={metric.label} className="bg-background rounded-lg p-3 border border-border">
              <div className="flex items-center gap-2 mb-1">
                <metric.icon className={`h-4 w-4 ${metric.color}`} />
                <span className="text-xs text-muted-foreground">{metric.label}</span>
              </div>
              <p className="text-xl font-bold text-foreground">{metric.value}</p>
            </div>
          ))}
        </div>

        {iteration && (
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-accent/5 hover:bg-accent/10 rounded-lg transition-colors">
              <span className="font-medium text-foreground">View AI-Generated Iteration</span>
              <ChevronDown className={`h-5 w-5 text-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            
            <CollapsibleContent className="pt-4 space-y-6">
              <div className="bg-background rounded-lg p-4 border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-foreground">Iteration Rationale</h4>
                </div>
                <p className="text-sm text-muted-foreground">{iteration.iteration_rationale}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-foreground">Original Script</h4>
                  <div className="bg-background rounded-lg p-4 border border-border">
                    <p className="text-sm text-foreground whitespace-pre-wrap">{iteration.original_script}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-foreground">Original Hooks</h5>
                    {iteration.original_hooks.map((hook: string, i: number) => (
                      <div key={i} className="bg-background rounded p-2 border border-border">
                        <p className="text-sm text-muted-foreground">{hook}</p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-background rounded-lg p-3 border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Original CTA</p>
                    <p className="text-sm text-foreground">{iteration.original_cta}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-foreground">New Iteration</h4>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => copyToClipboard(iteration.new_script, 'New script')}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Script
                    </Button>
                  </div>
                  <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                    <p className="text-sm text-foreground whitespace-pre-wrap">{iteration.new_script}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h5 className="text-sm font-medium text-foreground">New Hooks</h5>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => copyToClipboard(iteration.new_hooks.join('\n'), 'New hooks')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    {iteration.new_hooks.map((hook: string, i: number) => (
                      <div key={i} className="bg-primary/5 rounded p-2 border border-primary/20">
                        <p className="text-sm text-foreground">{hook}</p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
                    <p className="text-xs text-muted-foreground mb-1">New CTA</p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-foreground">{iteration.new_cta}</p>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => copyToClipboard(iteration.new_cta, 'New CTA')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </Card>
  );
};

export default TopPerformerCard;