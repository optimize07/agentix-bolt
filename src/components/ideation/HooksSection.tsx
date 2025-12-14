import { Fish, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Hook {
  hook: string;
  example: string;
  platform: string;
  type: string;
}

interface HooksSectionProps {
  hooks: Hook[];
  onUseHook: (hook: Hook) => void;
  isLoading?: boolean;
}

export function HooksSection({ hooks, onUseHook, isLoading }: HooksSectionProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Fish className="w-5 h-5 text-emerald-500" />
            Hook Ideas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3 rounded-lg bg-muted/50 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-full mb-1" />
              <div className="h-3 bg-muted rounded w-2/3" />
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
          <Fish className="w-5 h-5 text-emerald-500" />
          Hook Ideas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {hooks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Generate hooks to see suggestions</p>
        ) : (
          hooks.map((hook, index) => (
            <div
              key={index}
              className="p-3 rounded-lg border border-border/50 hover:border-primary/30 transition-colors group"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">{hook.type}</span>
                <Badge variant="secondary" className="text-xs capitalize">
                  {hook.platform}
                </Badge>
              </div>
              <p className="text-sm font-medium text-foreground mb-1">{hook.hook}</p>
              <p className="text-xs text-muted-foreground mb-2">{hook.example}</p>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onUseHook(hook)}
              >
                Use <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
