import { Anchor, Copy, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

interface Hook {
  hook: string;
  example: string;
  platform: string;
  type: string;
}

interface HooksSectionProps {
  hooks: Hook[];
  isLoading?: boolean;
}

export function HooksSection({ hooks, isLoading }: HooksSectionProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success("Hook copied to clipboard!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      question: 'bg-purple-500/20 text-purple-400',
      statement: 'bg-blue-500/20 text-blue-400',
      story: 'bg-green-500/20 text-green-400',
      controversial: 'bg-red-500/20 text-red-400',
      curiosity: 'bg-yellow-500/20 text-yellow-400',
    };
    return colors[type] || 'bg-muted text-muted-foreground';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Anchor className="w-5 h-5 text-purple-500" />
            Top Hooks to Use
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-3 rounded-lg bg-muted/50 animate-pulse">
              <div className="h-4 bg-muted rounded w-full mb-2" />
              <div className="h-3 bg-muted rounded w-3/4" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Anchor className="w-5 h-5 text-purple-500" />
          Top Hooks to Use
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {hooks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Generate ideas to see hooks</p>
        ) : (
          hooks.map((hook, index) => (
            <div
              key={index}
              className="p-3 rounded-lg border border-border/50 hover:border-primary/30 transition-colors group"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="font-medium text-sm italic">"{hook.hook}"</p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 shrink-0"
                  onClick={() => copyToClipboard(hook.hook, index)}
                >
                  {copiedIndex === index ? (
                    <Check className="w-3 h-3 text-green-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                <span className="font-medium">Example:</span> {hook.example}
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {hook.platform}
                </Badge>
                <Badge className={`text-xs ${getTypeColor(hook.type)}`}>
                  {hook.type}
                </Badge>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
