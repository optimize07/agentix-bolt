import { Newspaper, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Event {
  title: string;
  description: string;
  angle: string;
  relevance: string;
}

interface CurrentEventsSectionProps {
  events: Event[];
  onUseEvent: (event: Event) => void;
  isLoading?: boolean;
}

export function CurrentEventsSection({ events, onUseEvent, isLoading }: CurrentEventsSectionProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Newspaper className="w-5 h-5 text-blue-500" />
            Current Events
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
          <Newspaper className="w-5 h-5 text-blue-500" />
          Current Events
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">Generate ideas to see relevant events</p>
        ) : (
          events.map((event, index) => (
            <div
              key={index}
              className="p-3 rounded-lg border border-border/50 hover:border-primary/30 transition-colors group"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-medium text-sm">{event.title}</h4>
                <Badge variant="secondary" className="text-xs shrink-0">
                  {event.relevance}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{event.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-primary line-clamp-1">{event.angle}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onUseEvent(event)}
                >
                  Use <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
