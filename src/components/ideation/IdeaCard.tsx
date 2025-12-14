import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bookmark, Share2 } from "lucide-react";

interface IdeaCardProps {
  title: string;
  description: string;
  metadata?: string;
  cta?: string;
  onSave?: () => void;
  onShare?: () => void;
}

export function IdeaCard({ title, description, metadata, cta, onSave, onShare }: IdeaCardProps) {
  return (
    <Card className="p-4 space-y-3 border-border/60 hover:border-primary/40 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground leading-tight">{title}</h3>
          {metadata && (
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                {metadata}
              </Badge>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {onSave && (
            <Button size="icon" variant="ghost" onClick={onSave}>
              <Bookmark className="w-4 h-4" />
            </Button>
          )}
          {onShare && (
            <Button size="icon" variant="ghost" onClick={onShare}>
              <Share2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      {cta && (
        <p className="text-xs text-primary font-medium">CTA: {cta}</p>
      )}
    </Card>
  );
}
